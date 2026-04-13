export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json({ error: "Missing doctorId or date" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch all active appointments for the given doctor on the specified date
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .neq('status', 'cancelled');

    if (error) {
      console.error("Supabase Error fetching availability:", error);
      return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
    }

    // Map to simple array of booked time strings (e.g. "14:30:00")
    const bookedTimeSlots = appointments.map(apt => apt.appointment_time);

    return NextResponse.json({ bookedTimeSlots }, { status: 200 });

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

