-- Add Performance Indexes to core tables to speed up foreign key lookups and sorting

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date, appointment_time);

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON public.doctors(clinic_id);

-- Clinics indexes
CREATE INDEX IF NOT EXISTS idx_clinics_owner_id ON public.clinics(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON public.clinics(is_active);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON public.payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Reviews & Wishlists
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON public.reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON public.reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_patient_id ON public.wishlists(patient_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_doctor_id ON public.wishlists(doctor_id);
