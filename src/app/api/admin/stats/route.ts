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
  return profile?.role === "admin" ? user : null;
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = createAdminClient();

    // Promises for parallel fetching
    const usersP = supabase.from("users").select("id", { count: "exact", head: true });
    const clinicsP = supabase.from("clinics").select("id", { count: "exact", head: true }).eq("is_active", true);
    const doctorsP = supabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_active", true);
    const apptsP = supabase.from("appointments").select("id", { count: "exact", head: true });
    const paymentsP = supabase.from("payments").select("platform_commission").eq("status", "completed");
    const logsP = supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(5);

    const [users, clinics, doctors, appointments, payments, logs] = await Promise.all([
      usersP, clinicsP, doctorsP, apptsP, paymentsP, logsP
    ]);

    const revenue = payments.data?.reduce((sum, p) => sum + (p.platform_commission || 0), 0) || 0;

    return NextResponse.json({
      users: users.count || 0,
      clinics: clinics.count || 0,
      doctors: doctors.count || 0,
      appointments: appointments.count || 0,
      revenue,
      recentActivity: logs.data || [],
    });
  } catch (err: unknown) {
    console.error("Stats API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

