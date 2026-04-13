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

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = createAdminClient();

    let query = supabase.from("clinics").select("id, name, email, phone, is_active, created_at").order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: clinicsData, error } = await query;
    if (error) throw error;

    interface ClinicRow {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      is_active: boolean;
      created_at: string;
    }

    // Fetch aggregates
    const clinics = await Promise.all(
      (clinicsData as unknown as ClinicRow[]).map(async (c) => {
        const { count: dCount } = await supabase.from("doctors").select("id", { count: "exact", head: true }).eq("clinic_id", c.id);
        const { count: aCount } = await supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinic_id", c.id);
        
        return {
          ...c,
          doctorCount: dCount || 0,
          appointmentCount: aCount || 0,
        };
      })
    );

    return NextResponse.json({ clinics });
  } catch (err: unknown) {
    console.error("Admin Clinics GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

