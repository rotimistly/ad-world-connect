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

    // Initialize mock payment for development
    console.log('Initializing mock payment for development:', { paymentId, amount, email, reference });
    
    // Get the site URL from the request origin for redirect
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:8080';
    const callbackUrl = `${origin}/functions/v1/verify-payment?reference=${reference}`;
    
    // For development, create a mock successful response
    const paystackData = {
      status: true,
      data: {
        authorization_url: `${origin}/mock-payment?reference=${reference}&amount=${amount}&email=${encodeURIComponent(email)}`,
        access_code: `access_code_${reference}`,
        reference: reference
      }
    };

    // Update payment record with mock details
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