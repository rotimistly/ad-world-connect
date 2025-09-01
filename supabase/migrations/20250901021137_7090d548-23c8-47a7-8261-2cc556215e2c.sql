-- Fix the payments status constraint to allow 'initialized' status
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add the correct constraint that allows all necessary payment statuses
ALTER TABLE public.payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'initialized', 'processing', 'completed', 'failed', 'cancelled'));