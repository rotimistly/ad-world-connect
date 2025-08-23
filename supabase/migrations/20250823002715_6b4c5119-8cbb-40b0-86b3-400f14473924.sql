-- Remove Stripe references and update schema for Paystack integration
-- Update payments table for Paystack
ALTER TABLE public.payments 
DROP COLUMN IF EXISTS transaction_id,
ADD COLUMN paystack_reference TEXT,
ADD COLUMN paystack_access_code TEXT,
ADD COLUMN currency TEXT DEFAULT 'USD';

-- Add engagement tracking to ads
ALTER TABLE public.ads 
ADD COLUMN views INTEGER DEFAULT 0,
ADD COLUMN clicks INTEGER DEFAULT 0,
ADD COLUMN messages INTEGER DEFAULT 0,
ADD COLUMN is_fixed_price BOOLEAN DEFAULT false,
ADD COLUMN fixed_price_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN distance_km INTEGER NOT NULL DEFAULT 2;

-- Create contact_messages table for user inquiries about ads
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  message TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'whatsapp', 'email', 'phone', 'social'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_messages
CREATE POLICY "Ad owners can view messages for their ads" 
ON public.contact_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ads 
    JOIN public.businesses ON ads.business_id = businesses.id 
    WHERE ads.id = contact_messages.ad_id 
    AND businesses.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Create user_sessions table for tracking active sessions
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates on contact_messages
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to calculate ad price based on distance
CREATE OR REPLACE FUNCTION public.calculate_ad_price(distance_km INTEGER, is_fixed_price BOOLEAN DEFAULT false)
RETURNS NUMERIC AS $$
BEGIN
  IF is_fixed_price THEN
    RETURN 0; -- Fixed price ads use custom pricing
  END IF;
  
  IF distance_km <= 2 THEN
    RETURN 4.00;
  ELSE
    RETURN 5.00;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add function to track ad engagement
CREATE OR REPLACE FUNCTION public.track_ad_engagement(
  p_ad_id UUID,
  p_engagement_type TEXT -- 'view', 'click', 'message'
)
RETURNS VOID AS $$
BEGIN
  CASE p_engagement_type
    WHEN 'view' THEN
      UPDATE public.ads SET views = views + 1 WHERE id = p_ad_id;
    WHEN 'click' THEN
      UPDATE public.ads SET clicks = clicks + 1 WHERE id = p_ad_id;
    WHEN 'message' THEN
      UPDATE public.ads SET messages = messages + 1 WHERE id = p_ad_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;