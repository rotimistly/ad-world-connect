import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactMessage {
  adId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  platform: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adId, senderName, senderEmail, senderPhone, message, platform }: ContactMessage = await req.json();

    if (!adId || !senderName || !senderEmail || !message || !platform) {
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

    // Get ad details and business contact info
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select(`
        *,
        businesses!inner(
          business_name,
          email,
          phone_number,
          whatsapp_link,
          facebook_handle,
          instagram_handle,
          twitter_handle,
          linkedin_handle,
          tiktok_handle
        )
      `)
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return new Response(
        JSON.stringify({ error: 'Ad not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Store the contact message
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        ad_id: adId,
        sender_name: senderName,
        sender_email: senderEmail,
        sender_phone: senderPhone,
        message: message,
        platform: platform
      });

    if (insertError) {
      console.error('Failed to store contact message:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store message' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Update ad engagement tracking
    await supabase.rpc('track_ad_engagement', {
      p_ad_id: adId,
      p_engagement_type: 'message'
    });

    // Determine redirect URL based on platform
    let redirectUrl = '';
    const business = ad.businesses;

    switch (platform) {
      case 'whatsapp':
        if (business.whatsapp_link) {
          redirectUrl = business.whatsapp_link;
        } else if (business.phone_number) {
          redirectUrl = `https://wa.me/${business.phone_number.replace(/\D/g, '')}?text=Hi, I'm interested in your ad: ${ad.headline}`;
        }
        break;
      case 'email':
        redirectUrl = `mailto:${business.email}?subject=Inquiry about ${ad.headline}&body=Hi,\n\nI'm interested in your ad: ${ad.headline}\n\nMessage: ${message}\n\nBest regards,\n${senderName}`;
        break;
      case 'phone':
        redirectUrl = `tel:${business.phone_number}`;
        break;
      case 'facebook':
        if (business.facebook_handle) {
          redirectUrl = `https://facebook.com/${business.facebook_handle.replace('@', '')}`;
        }
        break;
      case 'instagram':
        if (business.instagram_handle) {
          redirectUrl = `https://instagram.com/${business.instagram_handle.replace('@', '')}`;
        }
        break;
      case 'twitter':
        if (business.twitter_handle) {
          redirectUrl = `https://twitter.com/${business.twitter_handle.replace('@', '')}`;
        }
        break;
      case 'linkedin':
        if (business.linkedin_handle) {
          redirectUrl = `https://linkedin.com/in/${business.linkedin_handle.replace('@', '')}`;
        }
        break;
      case 'tiktok':
        if (business.tiktok_handle) {
          redirectUrl = `https://tiktok.com/@${business.tiktok_handle.replace('@', '')}`;
        }
        break;
      default:
        redirectUrl = `mailto:${business.email}`;
    }

    console.log('Contact message sent successfully:', {
      adId,
      senderName,
      platform,
      redirectUrl
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Message sent successfully',
      redirectUrl: redirectUrl
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-contact-message function:', error);
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