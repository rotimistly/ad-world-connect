-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.calculate_ad_price(distance_km INTEGER, is_fixed_price BOOLEAN DEFAULT false)
RETURNS NUMERIC 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.track_ad_engagement(
  p_ad_id UUID,
  p_engagement_type TEXT -- 'view', 'click', 'message'
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;