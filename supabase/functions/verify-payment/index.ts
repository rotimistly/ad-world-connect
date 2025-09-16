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

    if (!reference) {
      // Get origin for proper redirect
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${origin}/dashboard?error=invalid_reference`,
          ...corsHeaders
        }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Verifying mock payment with reference:', reference);

    // For development, simulate successful payment verification
    const paystackData = {
      status: true,
      data: {
        status: 'success',
        amount: 700, // $0.07 in kobo
        reference: reference
      }
    };

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', paymentError);
      const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${origin}/dashboard?error=payment_not_found`,
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
      amount: paystackData.data.amount / 100,
      reference: reference
    });

    // Redirect to success page
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${origin}/dashboard?success=payment_completed`,
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('Error in verify-payment function:', error);
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${origin}/dashboard?error=verification_failed`,
        ...corsHeaders
      }
    });
  }
};

serve(handler);