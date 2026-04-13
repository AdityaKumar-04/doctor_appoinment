export const dynamic = "force-dynamic";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Query followups for the specific doctor
    const { data: followups, error } = await supabase
      .from("followups")
      .select(`
        *,
        patient:users!followups_patient_id_fkey(first_name, last_name, email)
      `)
      .eq("doctor_id", user.id)
      .order("followup_date", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ followups: followups || [] }, { status: 200 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

