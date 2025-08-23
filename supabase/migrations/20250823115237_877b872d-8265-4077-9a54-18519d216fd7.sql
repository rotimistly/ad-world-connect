-- Update the calculate_ad_price function to support the new distance and pricing structure
CREATE OR REPLACE FUNCTION public.calculate_ad_price(distance_km integer, is_fixed_price boolean DEFAULT false)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF is_fixed_price THEN
    RETURN 0; -- Fixed price ads use custom pricing
  END IF;
  
  -- New pricing structure starting from 200km
  IF distance_km < 200 THEN
    RETURN 4.00; -- Base price for distances under 200km
  ELSIF distance_km < 600 THEN
    RETURN 5.00; -- Standard price for 200-599km
  ELSE
    -- For 600km and above, increase by $0.07 for every 100km above 600
    RETURN 5.00 + (((distance_km - 600) / 100.0) * 0.07);
  END IF;
END;
$function$