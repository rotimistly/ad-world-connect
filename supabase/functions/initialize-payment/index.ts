import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  paymentId: string;
  amount: number;
  email: string;
  currency: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, amount, email, currency }: PaymentRequest = await req.json();

    if (!paymentId || !amount || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if Paystack secret key is available
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured. Please contact support.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create a unique reference for this payment
    const reference = `adboost_${paymentId}_${Date.now()}`;

    // Initialize real Paystack payment
    console.log('Initializing Paystack payment for:', { paymentId, amount, email, reference });
    
    // Get the site URL from the request origin for redirect
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
    const callbackUrl = `${origin}/functions/v1/verify-payment?reference=${reference}`;
    
    // Make request to Paystack API
    let paystackResponse;
    let paystackData;
    
    try {
      paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: Math.round(amount * 165000), // Convert USD to NGN kobo (1 USD = ~1650 NGN)
          currency: 'NGN', // Force NGN as Paystack primarily supports this
          reference: reference,
          callback_url: callbackUrl,
          metadata: {
            payment_id: paymentId,
            ad_id: paymentId, // Using paymentId as ad reference
            original_amount_usd: amount,
            original_currency: currency || 'USD'
          }
        })
      });

      paystackData = await paystackResponse.json();
      console.log('Paystack API response:', { status: paystackResponse.status, data: paystackData });
      
    } catch (fetchError) {
      console.error('Network error calling Paystack API:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Unable to connect to payment service. Please try again later.' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization failed:', {
        httpStatus: paystackResponse.status,
        paystackResponse: paystackData
      });
      
      // Provide specific error messages based on Paystack response
      let errorMessage = 'Payment initialization failed. ';
      if (paystackData.message) {
        if (paystackData.message.includes('No active channel')) {
          errorMessage += 'Payment service is currently unavailable. Please contact support or try again later.';
        } else if (paystackData.message.includes('Invalid key')) {
          errorMessage += 'Payment service configuration error. Please contact support.';
        } else {
          errorMessage += paystackData.message;
        }
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Update payment record with Paystack details
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        paystack_reference: reference,
        paystack_access_code: paystackData.data.access_code,
        status: 'initialized'
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment record' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Payment initialized successfully:', {
      paymentId,
      reference,
      authorization_url: paystackData.data.authorization_url
    });

    return new Response(JSON.stringify({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: reference
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in initialize-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);