export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
// removed unused import

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? { ...user, dbRole: profile.role } : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { is_active } = await request.json();
    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "is_active boolean is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error: dbError } = await supabase
      .from("clinics")
      .update({ is_active })
      .eq("id", params.id);

    if (dbError) throw dbError;

    // Optional: Log it
    await supabase.from("admin_logs").insert({
        admin_id: admin.id,
        action: is_active ? "ENABLED_CLINIC" : "DISABLED_CLINIC",
        details: { target_id: params.id }
    });

    return NextResponse.json({ message: "Clinic status updated successfully" });
  } catch (err: unknown) {
    console.error("Admin Clinic PATCH Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
