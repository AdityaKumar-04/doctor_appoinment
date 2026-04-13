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

    const { data: rawPayments, error } = await supabase
      .from("payments")
      .select(`
        id, amount_total, platform_commission, clinic_amount, status, created_at,
        patient:patient_id(first_name, last_name),
        clinic:clinic_id(name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalClinicEarnings = 0;

    // Fetch dynamic commission rate
    const { data: settingData } = await supabase.from("platform_settings").select("value").eq("key", "commission_rate").single();
    const dynamicRate = settingData ? (Number(settingData.value) / 100) : 0.10;

    interface AdminPaymentRow {
      id: string;
      amount_total: number;
      platform_commission: number | null;
      clinic_amount: number | null;
      status: string;
      created_at: string;
      clinic: { name: string } | null;
      patient: { first_name: string | null; last_name: string | null } | null;
    }

    const payments = (rawPayments as unknown as AdminPaymentRow[]).map((p) => {
        // Enforce dynamic fee if missing
        let commission = p.platform_commission;
        let cAmount = p.clinic_amount;

        if (commission == null || cAmount == null) {
            commission = Math.round(p.amount_total * dynamicRate);
            cAmount = p.amount_total - commission;
            
            // Auto update db async behind the scenes if miscalculated/null
            supabase.from("payments")
              .update({ platform_commission: commission, clinic_amount: cAmount })
              .eq("id", p.id)
              .then(() => {});
        }

        if (p.status === "completed") {
            totalRevenue += p.amount_total;
            totalCommission += commission;
            totalClinicEarnings += cAmount;
        }

        return {
            id: p.id,
            amount_total: p.amount_total,
            platform_commission: commission,
            clinic_amount: cAmount,
            status: p.status,
            created_at: p.created_at,
            clinic_name: p.clinic?.name || "Unknown Clinic",
            patient_name: p.patient ? `${p.patient.first_name || ""} ${p.patient.last_name || ""}`.trim() : "Unknown",
        };
    });

    return NextResponse.json({ 
        payments, 
        metrics: { totalRevenue, totalCommission, totalClinicEarnings } 
    });
  } catch (err: unknown) {
    console.error("Admin Payments GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

