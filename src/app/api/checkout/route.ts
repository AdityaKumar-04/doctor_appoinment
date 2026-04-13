export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
// removed unused import

// PATCH /api/checkout — confirm payment, update appointment status
export async function PATCH(request: Request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    // Verify the caller is authenticated
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Only allow the patient who owns the appointment to confirm it
    const { data: appointment, error: fetchError } = await adminSupabase
      .from("appointments")
      .select("id, patient_id, status")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.patient_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appointment.status === "confirmed") {
      return NextResponse.json({ message: "Already confirmed" }, { status: 200 });
    }

    // Update status to confirmed
    const { error: updateError } = await adminSupabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointmentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Payment confirmed. Appointment status updated to confirmed." },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/checkout?appointmentId=xxx — fetch appointment details for the checkout page
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: appointment, error } = await adminSupabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        notes,
        status,
        patient_id,
        doctor_id,
        doctors!doctor_id(
          id,
          user_id,
          specialization,
          consultation_fee,
          clinic_id,
          clinics(name, address),
          users!user_id(first_name, last_name)
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

