export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/doctor/profile — load doctor profile data
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();

    // Validate role from users table
    const { data: userProfile, error: userErr } = await adminClient
      .from("users")
      .select("first_name, last_name, phone, email, role")
      .eq("id", user.id)
      .single();

    if (userErr || userProfile?.role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get doctor-specific data
    const { data: doctor, error: docErr } = await adminClient
      .from("doctors")
      .select("id, specialization, experience_years, consultation_fee, bio, document_url, is_active")
      .eq("user_id", user.id)
      .single();

    if (docErr && docErr.code !== "PGRST116") {
      console.error("Doctor fetch error:", docErr);
    }

    return NextResponse.json({
      profile: { ...userProfile, email: user.email },
      doctor: doctor || null,
    }, { status: 200 });
  } catch (err: unknown) {
    console.error("Doctor profile GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/doctor/profile — update professional details
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();

    // Validate role
    const { data: userProfile } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { first_name, last_name, phone, specialization, experience_years, consultation_fee, bio, document_url } = body;

    // Validate required fields
    if (!specialization?.trim()) {
      return NextResponse.json({ error: "Specialization is required" }, { status: 400 });
    }

    // Update public.users (personal info)
    const { error: userUpdateErr } = await adminClient
      .from("users")
      .update({
        first_name: first_name?.trim() || undefined,
        last_name: last_name?.trim() || undefined,
        phone: phone?.trim() || undefined,
      })
      .eq("id", user.id);

    if (userUpdateErr) throw userUpdateErr;

    // Update professional fields in doctors table
    const { error: doctorUpdateErr } = await adminClient
      .from("doctors")
      .update({
        specialization: specialization.trim(),
        experience_years: Number(experience_years) || 0,
        consultation_fee: Number(consultation_fee) || 0,
        bio: bio?.trim() || null,
        document_url: document_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (doctorUpdateErr) throw doctorUpdateErr;

    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Update doctor profile PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

