-- Add admin role for the first user (assuming it's you based on the request)
-- Replace this user_id with your actual user_id if different

INSERT INTO public.user_roles (user_id, role) 
SELECT 'd8ff4e6d-fb96-4a16-868d-d3c591a594b2', 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'd8ff4e6d-fb96-4a16-868d-d3c591a594b2' 
  AND role = 'admin'::app_role
);

-- Verify the admin role was added
SELECT ur.user_id, ur.role, p.email 
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin'::app_role;