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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (admin.id === params.id) {
        return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify user is not another admin (optional safeguard)
    const { data: targetUser } = await supabase.from("users").select("role, email").eq("id", params.id).single();
    if (targetUser?.role === "admin") {
         return NextResponse.json({ error: "Cannot delete another administrator." }, { status: 403 });
    }

    // Auth delete cascades if constraints are setup. Assuming Auth Delete is required first.
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id);
    if (authError) {
        throw authError; // if user not found in auth, it's ok, maybe orphaned? 
    }

    // Delete from public.users
    const { error: dbError } = await supabase.from("users").delete().eq("id", params.id);
    if (dbError) throw dbError;

    // Optional: add to admin_logs
    await supabase.from("admin_logs").insert({
        admin_id: admin.id,
        action: "DELETED_USER",
        details: { target_id: params.id, target_email: targetUser?.email }
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (err: unknown) {
    console.error("Admin User DELETE Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { role } = body;
    const allowedRoles = ["patient", "doctor", "clinic", "admin"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: target } = await supabase.from("users").select("role").eq("id", params.id).single();
    if (target?.role === "admin") {
      return NextResponse.json({ error: "Cannot change admin role." }, { status: 403 });
    }

    const { error } = await supabase.from("users").update({ role }).eq("id", params.id);
    if (error) throw error;

    await supabase.from("admin_logs").insert({
      admin_id: admin.id,
      action: "UPDATED_USER_ROLE",
      details: { target_id: params.id, new_role: role },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Admin User PATCH Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
