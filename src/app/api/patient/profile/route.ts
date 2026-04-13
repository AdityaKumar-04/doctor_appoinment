export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/patient/profile — load patient profile from patient_profiles table
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();

    // Validate role
    const { data: userRow } = await adminClient
      .from("users")
      .select("first_name, last_name, role, email")
      .eq("id", user.id)
      .single();

    if (userRow?.role !== "patient") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try to get patient profile record
    const { data: patientProfile } = await adminClient
      .from("patient_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user: { ...userRow, email: user.email },
      profile: patientProfile || null,
    }, { status: 200 });
  } catch (err: unknown) {
    console.error("Patient profile GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/patient/profile — upsert patient profile in patient_profiles
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();

    // Validate role
    const { data: userRow } = await adminClient
      .from("users")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (userRow?.role !== "patient") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      full_name,
      phone,
      gender,
      dob,
      address,
      city,
      pincode,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
    } = body;

    // Upsert patient_profiles record
    const { data: updatedProfile, error: profileErr } = await adminClient
      .from("patient_profiles")
      .upsert({
        user_id: user.id,
        full_name: full_name?.trim() || null,
        phone: phone?.trim() || null,
        gender: gender || null,
        dob: dob || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        pincode: pincode?.trim() || null,
        blood_group: blood_group || null,
        emergency_contact_name: emergency_contact_name?.trim() || null,
        emergency_contact_phone: emergency_contact_phone?.trim() || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (profileErr) throw profileErr;

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Patient profile PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

