export const dynamic = "force-dynamic";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    
    // Fallback: If clinicId is not provided, we infer it from the user's role
    // Ideally we pass it from the frontend or look up the clinic they manage
    const supabase = createAdminClient();
    
    let targetClinicId = clinicId;
    if (!targetClinicId) {
       const { data: clinic } = await supabase.from("clinics").select("id").eq("owner_user_id", user.id).single();
       if (clinic) targetClinicId = clinic.id;
    }

    if (!targetClinicId) {
      return NextResponse.json({ followups: [] });
    }

    const { data: followups, error } = await supabase
      .from("followups")
      .select(`
        *,
        patient:users!followups_patient_id_fkey(first_name, last_name, email),
        doctor:users!followups_doctor_id_fkey(first_name, last_name, email)
      `)
      .eq("clinic_id", targetClinicId)
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

