-- Add rescheduled_date and rescheduled_by to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS rescheduled_date DATE,
ADD COLUMN IF NOT EXISTS rescheduled_by UUID REFERENCES auth.users(id);

-- Optional: Create index on rescheduled_by
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_by ON public.appointments(rescheduled_by);
