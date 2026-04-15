-- ============================================================
-- PRODUCTION RLS POLICIES — Run in Supabase SQL Editor
-- This file fixes "doctors show locally but not in production"
-- ============================================================

-- ── 1. doctors table ─────────────────────────────────────────
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Public read (for patient booking page, doctor listing)
DROP POLICY IF EXISTS "public_read_doctors" ON doctors;
CREATE POLICY "public_read_doctors"
  ON doctors FOR SELECT
  USING (true);

-- Doctors can update their own row
DROP POLICY IF EXISTS "doctors_update_own" ON doctors;
CREATE POLICY "doctors_update_own"
  ON doctors FOR UPDATE
  USING (auth.uid() = user_id);

-- ── 2. clinics table ─────────────────────────────────────────
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Public read (for clinic listing page)
DROP POLICY IF EXISTS "public_read_clinics" ON clinics;
CREATE POLICY "public_read_clinics"
  ON clinics FOR SELECT
  USING (true);

-- Clinic owners can update their own row
DROP POLICY IF EXISTS "clinics_update_own" ON clinics;
CREATE POLICY "clinics_update_own"
  ON clinics FOR UPDATE
  USING (auth.uid() = user_id);

-- ── 3. users (profiles) table ────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile (used by AuthContext)
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ── 4. patient_profiles table (if exists) ────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_profiles') THEN
    ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

    -- Drop and recreate
    DROP POLICY IF EXISTS "patient_profiles_read_own" ON patient_profiles;
    CREATE POLICY "patient_profiles_read_own"
      ON patient_profiles FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "patient_profiles_update_own" ON patient_profiles;
    CREATE POLICY "patient_profiles_update_own"
      ON patient_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. appointments table ─────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients can read their own appointments
DROP POLICY IF EXISTS "appointments_read_patient" ON appointments;
CREATE POLICY "appointments_read_patient"
  ON appointments FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can read appointments assigned to them
DROP POLICY IF EXISTS "appointments_read_doctor" ON appointments;
CREATE POLICY "appointments_read_doctor"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.user_id = auth.uid()
      AND doctors.id = appointments.doctor_id
    )
  );

-- ── 6. notifications table ────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
    CREATE POLICY "notifications_read_own"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
    CREATE POLICY "notifications_update_own"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
