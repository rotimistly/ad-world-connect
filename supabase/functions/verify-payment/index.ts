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

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
      },
    });

    const paystackData = await paystackResponse.json();

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
    const { error: updateAdError } = await supabase
      .from('ads')
      .update({
        paid: true,
        published_at: new Date().toISOString()
      })
      .eq('id', payment.ad_id);

    if (updateAdError) {
      console.error('Failed to update ad:', updateAdError);
    }

    // Track payment success
    console.log('Payment verified and ad published:', {
      paymentId: payment.id,
      adId: payment.ad_id,
      amount: paystackData.data.amount / 100,
      reference: reference
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