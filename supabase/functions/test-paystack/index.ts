import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    // Check if Paystack secret key is available
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ 
        error: 'PAYSTACK_SECRET_KEY not found',
        available_env: Object.keys(Deno.env.toObject()).filter(key => key.includes('PAYSTACK'))
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Test Paystack API connection
    const testResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        amount: 100, // 1 NGN in kobo
        currency: 'NGN',
        reference: `test_${Date.now()}`,
      })
    });

    const responseData = await testResponse.json();
    
    return new Response(JSON.stringify({
      paystackConfigured: true,
      secretKeyExists: true,
      secretKeyPrefix: paystackSecretKey.substring(0, 8) + '...',
      testApiCall: {
        status: testResponse.status,
        ok: testResponse.ok,
        response: responseData
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);