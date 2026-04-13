export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = createAdminClient();

    let query = supabase
      .from("users")
      .select("id, first_name, last_name, email, created_at")
      .eq("role", "patient")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with appointment count
    const patients = await Promise.all(
      (data || []).map(async (p) => {
        const { count } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", p.id);
        return {
          ...p,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unnamed",
          appointment_count: count || 0,
        };
      })
    );

    return NextResponse.json({ patients });
  } catch (err: unknown) {
    console.error("Admin Patients GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

