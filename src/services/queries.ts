import { createAdminClient } from "@/utils/supabase/admin";

export async function getAppointments(role: string, userId: string, status?: string | null, page: number = 1) {
  const supabase = createAdminClient();
  const limit = 6;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  if (role === "admin") {
    let query = supabase
      .from("appointments")
      .select(`
        id, appointment_date, appointment_time, status, created_at,
        patient:patient_id(first_name, last_name, email, phone),
        doctor:doctor_id(id, specialization, user_id, clinics!inner(name)),
        clinic:clinic_id(name)
      `, { count: "exact" })
      .order("appointment_date", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data, count };
  }

  if (role === "clinic") {
    const { data: clinic } = await supabase.from("clinics").select("id").eq("owner_user_id", userId).single();
    if (!clinic) throw new Error("Clinic not found");

    let query = supabase
      .from("appointments")
      .select(`
        id, appointment_date, appointment_time, status, created_at,
        users!patient_id(first_name, last_name, email, phone),
        doctors!doctor_id(id, specialization, consultation_fee, users!user_id(first_name, last_name))
      `, { count: "exact" })
      .eq("clinic_id", clinic.id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data, count };
  }

  if (role === "doctor") {
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).single();
    if (!doctor) throw new Error("Doctor not found");

    let query = supabase
      .from("appointments")
      .select(`
        id, appointment_date, appointment_time, status, clinic_id, patient_id, doctor_id, created_at,
        users!patient_id(first_name, last_name, email, phone),
        doctors!doctor_id(id, specialization, consultation_fee, users!user_id(first_name, last_name)),
        clinics!clinic_id(id, name, address, phone)
      `, { count: "exact" })
      .eq("doctor_id", doctor.id)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
      
    if (status && status !== "all") {
       query = query.eq("status", status);
    }
    
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data, count };
  }

  if (role === "patient") {
    let query = supabase
      .from("appointments")
      .select(`
        id, appointment_date, appointment_time, status, clinic_id, patient_id, doctor_id, created_at,
        users!patient_id(first_name, last_name, email, phone),
        doctors!doctor_id(id, specialization, consultation_fee, users!user_id(first_name, last_name)),
        clinics!clinic_id(id, name, address, phone)
      `, { count: "exact" })
      .eq("patient_id", userId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
      
    if (status && status !== "all") {
       query = query.eq("status", status);
    }
    
    const { data, count, error } = await query.range(from, to);
    if (error) throw error;
    return { data, count };
  }

  throw new Error("Invalid role");
}
