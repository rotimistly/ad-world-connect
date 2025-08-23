-- Fix security definer function by adding search_path
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Remove the security definer view and replace with a function
DROP VIEW IF EXISTS public.admin_stats;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(
  total_users BIGINT,
  total_ads BIGINT,
  paid_ads BIGINT,
  total_businesses BIGINT,
  total_messages BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM profiles) AS total_users,
    (SELECT COUNT(*) FROM ads) AS total_ads,
    (SELECT COUNT(*) FROM ads WHERE paid = true) AS paid_ads,
    (SELECT COUNT(*) FROM businesses) AS total_businesses,
    (SELECT COUNT(*) FROM contact_messages) AS total_messages;
$$;