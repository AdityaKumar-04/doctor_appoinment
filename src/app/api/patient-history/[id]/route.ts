export const dynamic = "force-dynamic";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: patientId } = params;

    const supabase = createAdminClient();

    const [aptRes, trtRes, fupRes] = await Promise.all([
      supabase.from("appointments").select("*, clinics(*)").eq("patient_id", patientId).order("appointment_date", { ascending: false }),
      supabase.from("treatments").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("followups").select("*").eq("patient_id", patientId).order("followup_date", { ascending: false })
    ]);

    return NextResponse.json({
      appointments: aptRes.data || [],
      treatments: trtRes.data || [],
      followups: fupRes.data || []
    }, { status: 200 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
