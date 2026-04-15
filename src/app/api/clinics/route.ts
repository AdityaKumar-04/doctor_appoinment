export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/clinics — returns all active clinics with doctor count
export async function GET(request: Request) {
  console.log("[Clinics API] Starting request...");
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    console.log("[Clinics API] Search param:", search);

    // Fetch clinics first (bypassing joins to avoid PGRST errors)
    let query = supabase
      .from("clinics")
      .select("id, name, address, phone, email, specializations, is_active")
      .eq("is_active", true)
      .order("name");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    console.log("[Clinics API] Executing query for clinics...");
    const { data: clinics, error: clinicsError } = await query;

    if (clinicsError) {
      console.error("[Clinics API] Error fetching clinics:", clinicsError);
      throw clinicsError;
    }

    console.log(`[Clinics API] Fetched ${clinics?.length || 0} clinics successfully.`);

    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ clinics: [] }, { status: 200 });
    }

    // Manual join: fetch doctors for these clinics to get the count
    const clinicIds = clinics.map(c => c.id);
    console.log("[Clinics API] Extracting counts from doctors for clinics:", clinicIds);

    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select("clinic_id, is_active")
      .in("clinic_id", clinicIds)
      .eq("is_active", true);

    if (doctorsError) {
      console.error("[Clinics API] Error fetching doctors for counts:", doctorsError);
      throw doctorsError;
    }

    // Map counts back to clinics
    const clinicWithCounts = clinics.map(clinic => {
      const docsInClinic = doctors?.filter(d => d.clinic_id === clinic.id) || [];
      return {
        ...clinic,
        doctors: [{ count: docsInClinic.length }]
      };
    });

    console.log("[Clinics API] Successfully merged data. Returning payload.");
    return NextResponse.json({ clinics: clinicWithCounts }, { status: 200 });
  } catch (err: unknown) {
    console.error("[Clinics API] Unhandled Exception:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

