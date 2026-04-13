export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/clinics/[id] — returns clinic details + list of active doctors
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Clinic ID required" }, { status: 400 });
    }

    // Fetch clinic details
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, address, phone, email, specializations, is_active")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Fetch doctors for this clinic (join with users for name)
    const { data: doctors, error: doctorsError } = await supabase
      .from("doctors")
      .select(`
        id,
        user_id,
        specialization,
        experience_years,
        consultation_fee,
        bio,
        is_active,
        users!user_id(first_name, last_name, email)
      `)
      .eq("clinic_id", id)
      .eq("is_active", true);

    if (doctorsError) {
      console.error("Doctors fetch error:", doctorsError.message);
    }

    return NextResponse.json(
      { clinic, doctors: doctors || [] },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
