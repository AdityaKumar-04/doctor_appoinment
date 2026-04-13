-- Treatments Table
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    followup_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Followups Table
CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    followup_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, scheduled, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS Policies
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
CREATE POLICY "Users can read their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Doctors can manage treatments for their appointments
CREATE POLICY "Doctors can manage their treatments"
ON public.treatments FOR ALL
TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view their treatments"
ON public.treatments FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

-- Followups policies
CREATE POLICY "Doctors can manage followups"
ON public.followups FOR ALL
TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can view followups"
ON public.followups FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_treatments_appointment_id ON public.treatments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_followups_patient_id ON public.followups(patient_id);
