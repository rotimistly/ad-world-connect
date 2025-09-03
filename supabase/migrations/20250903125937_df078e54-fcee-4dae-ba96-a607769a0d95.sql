-- Add platform tracking and analytics tables
CREATE TABLE public.ad_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  platform_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reach_count INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add platform reach analytics
CREATE TABLE public.platform_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_platform_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for ad_platforms
CREATE POLICY "Users can view platforms for their ads" 
ON public.ad_platforms 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ads 
  JOIN businesses ON ads.business_id = businesses.id 
  WHERE ads.id = ad_platforms.ad_id AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can create platforms for their ads" 
ON public.ad_platforms 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ads 
  JOIN businesses ON ads.business_id = businesses.id 
  WHERE ads.id = ad_platforms.ad_id AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can update platforms for their ads" 
ON public.ad_platforms 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM ads 
  JOIN businesses ON ads.business_id = businesses.id 
  WHERE ads.id = ad_platforms.ad_id AND businesses.user_id = auth.uid()
));

-- Create policies for platform_analytics
CREATE POLICY "Users can view analytics for their ad platforms" 
ON public.platform_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ad_platforms 
  JOIN ads ON ad_platforms.ad_id = ads.id
  JOIN businesses ON ads.business_id = businesses.id 
  WHERE ad_platforms.id = platform_analytics.ad_platform_id AND businesses.user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_ad_platforms_updated_at
BEFORE UPDATE ON public.ad_platforms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_analytics_updated_at
BEFORE UPDATE ON public.platform_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add platform selection to ads table
ALTER TABLE public.ads ADD COLUMN selected_platforms TEXT[] DEFAULT '{}';

-- Create function to get platform reach summary
CREATE OR REPLACE FUNCTION public.get_ad_platform_reach(ad_id UUID)
RETURNS TABLE(
  platform_name TEXT,
  total_reach INTEGER,
  total_impressions INTEGER,
  total_clicks INTEGER,
  engagement_rate DECIMAL
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ap.platform_name,
    COALESCE(SUM(pa.reach), 0)::INTEGER as total_reach,
    COALESCE(SUM(pa.impressions), 0)::INTEGER as total_impressions,
    COALESCE(SUM(pa.clicks), 0)::INTEGER as total_clicks,
    CASE 
      WHEN SUM(pa.impressions) > 0 
      THEN ROUND((SUM(pa.engagement)::DECIMAL / SUM(pa.impressions)) * 100, 2)
      ELSE 0
    END as engagement_rate
  FROM ad_platforms ap
  LEFT JOIN platform_analytics pa ON ap.id = pa.ad_platform_id
  WHERE ap.ad_id = $1
  GROUP BY ap.platform_name
  ORDER BY total_reach DESC;
$$;