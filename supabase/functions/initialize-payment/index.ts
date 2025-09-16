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

    // Create a unique reference for this payment
    const reference = `adboost_${paymentId}_${Date.now()}`;

    // Initialize real Paystack payment
    console.log('Initializing Paystack payment for:', { paymentId, amount, email, reference });
    
    // Get the site URL from the request origin for redirect
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
    const callbackUrl = `${origin}/functions/v1/verify-payment?reference=${reference}`;
    
    // Make request to Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        currency: currency || 'USD',
        reference: reference,
        callback_url: callbackUrl,
        metadata: {
          payment_id: paymentId,
          ad_id: paymentId // Using paymentId as ad reference
        }
      })
    });

    const paystackData = await paystackResponse.json();
    
    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return new Response(
        JSON.stringify({ error: 'Payment initialization failed: ' + paystackData.message }),
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