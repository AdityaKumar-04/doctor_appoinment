export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

// GET /api/appointments/[id] — fetch a single appointment with full relations
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseSsr = await createClient();
    const { data: { user }, error: authError } = await supabaseSsr.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`
        *,
        doctors (
          id,
          user_id,
          specialization,
          experience_years,
          consultation_fee,
          bio,
          users (first_name, last_name, email, phone),
          clinics (id, name, address, phone)
        ),
        clinics (name, address),
        payments (status, amount, payment_method, created_at)
      `)
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Security: patients can only see their own appointments
    if (appointment.patient_id !== user.id) {
      // Allow doctors to also see their own appointments
      const { data: doctorProfile } = await supabase
        .from("doctors")
        .select("id, user_id")
        .eq("user_id", user.id)
        .single();
      if (!doctorProfile || appointment.doctor_id !== doctorProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ appointment });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] — update status, date, time
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, appointment_date, appointment_time } = await request.json();

    const updatePayload: Record<string, unknown> = {};

    if (status) {
      const validStatuses = ['pending', 'scheduled', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updatePayload.status = status;
    }

    if (appointment_date) {
      updatePayload.appointment_date = appointment_date;
      updatePayload.status = "pending"; // force re-confirmation
    }

    if (appointment_time) {
      updatePayload.appointment_time = appointment_time;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment, message: "Appointment updated" }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
