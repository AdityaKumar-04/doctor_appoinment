import { User } from "@supabase/supabase-js";

export type UserRole = "patient" | "doctor" | "clinic" | "admin";

export interface UserProfile {
  id: string;
  role: UserRole | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface Doctor {
  id: string;
  user_id: string;
  clinic_id: string;
  specialization: string;
  experience_years: number;
  bio: string;
  consultation_fee: number;
  rating?: number;
  is_active: boolean;
  users?: UserProfile;
  clinics?: Clinic;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  is_verified: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "scheduled" | "rescheduled";
  notes?: string;
  rescheduled_date?: string;
  rescheduled_by?: string;
  created_at: string;
  updated_at: string;
  doctors?: Doctor;
  users?: UserProfile;
  clinics?: Clinic;
}

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  appointments?: Appointment;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
