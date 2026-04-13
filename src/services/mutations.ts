import { createAdminClient } from "@/utils/supabase/admin";

export async function createAppointment(
  patient_id: string,
  doctor_idString: string,
  appointment_date: string,
  appointment_time: string,
  notes?: string | null
) {
  const supabase = createAdminClient();

  // Fetch doctor to extract clinic_id
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("id, clinic_id")
    .eq("id", doctor_idString)
    .single();

  let resolvedDoctorId = doctor_idString;
  let clinicIdContext = null;

  if (doctorError || !doctor) {
    // try by user_id
    const { data: doctorByUserId } = await supabase
      .from("doctors")
      .select("id, clinic_id")
      .eq("user_id", doctor_idString)
      .single();

    if (!doctorByUserId) {
      throw new Error("Doctor not found");
    }

    resolvedDoctorId = doctorByUserId.id;
    clinicIdContext = doctorByUserId.clinic_id;
  } else {
    resolvedDoctorId = doctor.id;
    clinicIdContext = doctor.clinic_id;
  }

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id")
    .eq("doctor_id", resolvedDoctorId)
    .eq("appointment_date", appointment_date)
    .eq("appointment_time", appointment_time)
    .neq("status", "cancelled");

  if (conflicts && conflicts.length > 0) {
    throw new Error("This time slot is already booked");
  }

  const { data: newAppointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      patient_id,
      doctor_id: resolvedDoctorId,
      clinic_id: clinicIdContext,
      appointment_date,
      appointment_time,
      notes: notes || null,
      status: "scheduled",
    })
    .select()
    .single();

  if (insertError) {
    // Fallback: try with status "pending"
    const { data: fallback, error: fallbackError } = await supabase
      .from("appointments")
      .insert({
        patient_id,
        doctor_id: resolvedDoctorId,
        clinic_id: clinicIdContext,
        appointment_date,
        appointment_time,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (fallbackError) throw new Error(fallbackError.message);
    return fallback;
  }

  return newAppointment;
}

export async function updateAppointmentStatus(
  role: string,
  userId: string,
  appointmentId: string,
  status: string
) {
  const supabase = createAdminClient();

  if (role === "admin") {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Appointment not found");
    return data;
  }

  if (role === "clinic") {
    const { data: clinic } = await supabase.from("clinics").select("id").eq("owner_user_id", userId).single();
    if (!clinic) throw new Error("Clinic not found");

    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .eq("clinic_id", clinic.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Appointment not found or not owned");
    return data;
  }

  if (role === "doctor") {
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).single();
    if (!doctor) throw new Error("Doctor not found");

    const { data, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("doctor_id", doctor.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Appointment not found or not owned");
    return data;
  }

  if (role === "patient") {
    // allow patient to cancel their own appointment
    if (status !== "cancelled") throw new Error("Action not permitted");
    
    const { data, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("patient_id", userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error("Appointment not found or not owned");
    return data;
  }

  throw new Error("Invalid role or permission denied");
}

export async function rescheduleAppointment(
  role: string,
  userId: string,
  appointmentId: string,
  newDate: string,
  newTime: string
) {
  const supabase = createAdminClient();

  if (role !== "doctor" && role !== "admin") {
    throw new Error("Only doctors and admins can reschedule appointments");
  }

  if (role === "doctor") {
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).single();
    if (!doctor) throw new Error("Doctor not found");
  }

  // Update
  const { data, error } = await supabase
    .from("appointments")
    .update({ 
      status: "rescheduled",
      appointment_date: newDate,
      appointment_time: newTime,
      rescheduled_date: newDate,
      rescheduled_by: userId,
      updated_at: new Date().toISOString() 
    })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Appointment not found");

  // Create notifications for patient and clinic
  await supabase.from("notifications").insert([
    {
      user_id: data.patient_id,
      title: "Appointment Rescheduled",
      message: `Your appointment has been rescheduled to ${newDate} at ${newTime}.`,
      type: "appointment_update"
    },
    {
      user_id: data.clinic_id,
      title: "Doctor Rescheduled Appointment",
      message: `An appointment was rescheduled to ${newDate} at ${newTime}.`,
      type: "appointment_update"
    }
  ]);

  return data;
}
