export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the doctor is querying their own patient (has past appointments)
    const { data: aptCheck, error: checkErr } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", user.id)
      .eq("patient_id", id)
      .limit(1);

    if (checkErr || !aptCheck || aptCheck.length === 0) {
      return NextResponse.json(
        { error: "Unauthorized. Patient has no history with you." },
        { status: 403 }
      );
    }

    // Fetch Patient Details
    const { data: patient, error: pErr } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone")
      .eq("id", id)
      .single();

    if (pErr) throw pErr;

    // Fetch Appointments
    const { data: appointments, error: aptErr } = await supabase
      .from("appointments")
      .select("*, clinics(name, address)")
      .eq("patient_id", id)
      .eq("doctor_id", user.id)
      .order("appointment_date", { ascending: false });

    // Fetch Treatments
    const { data: treatments, error: treatErr } = await supabase
      .from("treatments")
      .select("*")
      .eq("patient_id", id)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch Followups
    const { data: followups, error: fupErr } = await supabase
      .from("followups")
      .select("*")
      .eq("patient_id", id)
      .eq("doctor_id", user.id)
      .order("followup_date", { ascending: false });

    if (aptErr) console.error("History fetch error (appointments):", aptErr);
    if (treatErr) console.error("History fetch error (treatments):", treatErr);
    if (fupErr) console.error("History fetch error (followups):", fupErr);

    return NextResponse.json({
      patient,
      appointments: appointments || [],
      treatments: treatments || [],
      followups: followups || [],
    });
  } catch (err: unknown) {
    console.error("Patient History API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
