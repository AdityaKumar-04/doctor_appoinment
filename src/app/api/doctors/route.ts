export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/doctors — list all active doctors for patient booking
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: doctors, error } = await supabase
      .from("doctors")
      .select(`
        id,
        user_id,
        specialization,
        experience_years,
        consultation_fee,
        bio,
        is_active,
        clinic_id,
        clinics(id, name, address),
        users!user_id(first_name, last_name, email, phone)
      `)
      .eq("is_active", true);

    if (error) {
      // Fallback: try with inner join on id if user_id relation fails
      console.error("Doctors fetch error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ doctors }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

