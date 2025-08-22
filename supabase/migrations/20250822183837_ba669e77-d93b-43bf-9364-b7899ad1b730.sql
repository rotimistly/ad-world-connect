-- Create ads table with engagement tracking
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  media_url TEXT,
  location TEXT NOT NULL,
  range_km INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  fixed_price DECIMAL(10,2),
  fixed_price_expires_at TIMESTAMP WITH TIME ZONE,
  business_link TEXT NOT NULL,
  whatsapp_link TEXT,
  facebook_handle TEXT,
  tiktok_handle TEXT,
  contact_message TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_messages table for ad inquiries
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_email TEXT,
  message TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ads
CREATE POLICY "Users can view their own ads" ON public.ads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view published ads" ON public.ads
  FOR SELECT USING (published = true);

CREATE POLICY "Users can create their own ads" ON public.ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" ON public.ads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" ON public.ads
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for contact messages
CREATE POLICY "Anyone can send contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Ad owners can view messages for their ads" ON public.contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ads 
      WHERE ads.id = contact_messages.ad_id 
      AND ads.user_id = auth.uid()
    )
  );