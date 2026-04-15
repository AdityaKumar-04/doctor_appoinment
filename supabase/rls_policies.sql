-- Enable Row Level Security (RLS) on all core tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- 1. DOCTORS 
-- Public read access so patients can see doctors on the frontend
CREATE POLICY "public_read_doctors" 
ON doctors FOR SELECT 
TO public 
USING (true);

CREATE POLICY "doctor_update_self" 
ON doctors FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- 2. CLINICS
-- Public read access so patients can see clinics on the frontend
CREATE POLICY "public_read_clinics" 
ON clinics FOR SELECT 
TO public 
USING (true);

CREATE POLICY "clinic_update_self" 
ON clinics FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- 3. USERS (Patient Profiles & Role Data)
-- Users need basic public read so that doctor/clinic APIs joining users can resolve names publicly!
CREATE POLICY "public_read_users" 
ON users FOR SELECT 
TO public 
USING (true);

CREATE POLICY "users_update_self" 
ON users FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- 4. APPOINTMENTS
-- Patients see their own, doctors see theirs, clinics see theirs
CREATE POLICY "appointments_select_access" 
ON appointments FOR SELECT 
TO authenticated 
USING (
  patient_id = auth.uid() OR 
  doctor_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.clinic_id = (SELECT id FROM clinics WHERE user_id = auth.uid()))
);

CREATE POLICY "appointments_insert_access" 
ON appointments FOR INSERT 
TO authenticated 
WITH CHECK (patient_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "appointments_update_access" 
ON appointments FOR UPDATE 
TO authenticated 
USING (
  patient_id = auth.uid() OR 
  doctor_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM doctors WHERE doctors.id = appointments.doctor_id AND doctors.clinic_id = (SELECT id FROM clinics WHERE user_id = auth.uid()))
);

-- 5. TREATMENTS
-- Patients see their own treatments, doctors see theirs, etc.
CREATE POLICY "treatments_select_access" 
ON treatments FOR SELECT 
TO authenticated 
USING (
  patient_id = auth.uid() OR 
  doctor_id = auth.uid()
);

-- Note: Ensure Supabase triggers update cache or refresh schemas if needed
-- To reload PostgREST schema cache:
NOTIFY pgrst, 'reload schema';
