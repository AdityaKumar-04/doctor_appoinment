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
    const status = searchParams.get("status"); // "active" | "inactive" | "all"

    const supabase = createAdminClient();

    let query = supabase
      .from("doctors")
      .select(`
        id, user_id, specialization, experience_years, consultation_fee, is_active, created_at,
        users!user_id(first_name, last_name, email),
        clinics!clinic_id(name)
      `)
      .order("created_at", { ascending: false });

    if (status === "active") query = query.eq("is_active", true);
    if (status === "inactive") query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) throw error;

    interface DoctorRow {
      id: string;
      user_id: string;
      specialization: string;
      experience_years: number;
      consultation_fee: number;
      is_active: boolean;
      created_at: string;
      users: { first_name: string | null; last_name: string | null; email: string } | null;
      clinics: { name: string } | null;
    }

    let doctors = (data as unknown as DoctorRow[]).map((d) => ({
      id: d.id,
      user_id: d.user_id,
      name: `${d.users?.first_name || ""} ${d.users?.last_name || ""}`.trim() || "Unknown",
      email: d.users?.email || "",
      specialization: d.specialization,
      experience_years: d.experience_years,
      consultation_fee: d.consultation_fee,
      is_active: d.is_active,
      clinic_name: d.clinics?.name || "Unaffiliated",
      created_at: d.created_at,
    }));

    if (search) {
      const q = search.toLowerCase();
      doctors = doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ doctors });
  } catch (err: unknown) {
    console.error("Admin Doctors GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { doctorId, is_active } = await request.json();
    if (!doctorId) return NextResponse.json({ error: "doctorId required" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase.from("doctors").update({ is_active }).eq("id", doctorId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Admin Doctors PATCH Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

