import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    const isMock = url.searchParams.get('mock');

    if (!reference) {
      // Redirect to dashboard with error if no reference
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/dashboard?error=invalid_reference',
          ...corsHeaders
        }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For mock payments, skip Paystack verification
    let paystackData = null;
    if (isMock === 'true') {
      console.log('Processing mock payment verification for reference:', reference);
      // Create mock successful response
      paystackData = {
        data: {
          status: 'success',
          amount: 0, // Will be updated from payment record
          reference: reference
        }
      };
    } else {
      // Verify payment with Paystack
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      });

      paystackData = await paystackResponse.json();

      if (!paystackResponse.ok || paystackData.data.status !== 'success') {
        console.error('Payment verification failed:', paystackData);
        // Redirect to dashboard with error
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/dashboard?error=payment_failed',
            ...corsHeaders
          }
        });
      }
    }

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', paymentError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/dashboard?error=payment_not_found',
          ...corsHeaders
        }
      });
    }

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed'
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Failed to update payment:', updatePaymentError);
    }

    // Update ad as paid and published
    const { data: updatedAd, error: updateAdError } = await supabase
      .from('ads')
      .update({
        paid: true,
        published_at: new Date().toISOString()
      })
      .eq('id', payment.ad_id)
      .select('*, businesses(*)')
      .single();

    if (updateAdError) {
      console.error('Failed to update ad:', updateAdError);
    }

    // Auto-publish ad to selected platforms
    if (updatedAd && updatedAd.selected_platforms && updatedAd.selected_platforms.length > 0) {
      try {
        const publishResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/auto-publish-ad`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adId: updatedAd.id,
            selectedPlatforms: updatedAd.selected_platforms,
            headline: updatedAd.headline,
            bodyText: updatedAd.body_text,
            callToAction: updatedAd.call_to_action,
            targetKeywords: updatedAd.target_keywords || [],
            region: updatedAd.region,
            distanceKm: updatedAd.distance_km
          })
        });

        const publishResult = await publishResponse.json();
        console.log('Auto-publishing result:', publishResult);
      } catch (publishError) {
        console.error('Failed to auto-publish ad:', publishError);
        // Continue with the process even if auto-publishing fails
      }
    }

    // Track payment success
    console.log('Payment verified and ad published:', {
      paymentId: payment.id,
      adId: payment.ad_id,
      amount: isMock === 'true' ? payment.amount : paystackData.data.amount / 100,
      reference: reference,
      isMock: isMock === 'true'
    });

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard?success=payment_completed',
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('Error in verify-payment function:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/dashboard?error=verification_failed',
        ...corsHeaders
      }
    });
  }
};

serve(handler);