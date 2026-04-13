export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { rescheduleAppointment } from "@/services/mutations";

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, newDate, newTime, role } = body;

    if (!appointmentId || !newDate || !newTime || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await rescheduleAppointment(role, user.id, appointmentId, newDate, newTime);
    
    return NextResponse.json({ appointment, message: "Appointment rescheduled successfully" }, { status: 200 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

