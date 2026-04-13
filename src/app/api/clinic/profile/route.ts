export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/clinic/profile — load clinic profile
export async function GET() {
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

    if (userProfile?.role !== "clinic") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get clinic info — select ALL fields but return only what's needed
    const { data: clinic, error } = await adminClient
      .from("clinics")
      .select(
        "id, name, address, phone, email, is_active, created_at, updated_at, " +
        "medical_license, license_verified, owner_user_id"
      )
      .eq("owner_user_id", user.id)
      .single();

    if (error || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json({ clinic }, { status: 200 });
  } catch (err: unknown) {
    console.error("Clinic profile GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/clinic/profile — update ONLY allowed fields
// CANNOT modify: medical_license, license_verified, is_active
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

    if (userProfile?.role !== "clinic") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // STRICT allowlist — only these fields can be updated
    const { name, address, phone, email } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from("clinics")
      .update({
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        updated_at: new Date().toISOString(),
        // ⛔ DO NOT include: medical_license, license_verified, is_active
      })
      .eq("owner_user_id", user.id)
      .select("id, name, address, phone, email, is_active, medical_license, license_verified, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Profile updated successfully", clinic: data }, { status: 200 });
  } catch (error: unknown) {
    console.error("Update clinic profile PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

