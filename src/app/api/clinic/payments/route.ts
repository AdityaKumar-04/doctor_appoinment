export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
// removed unused import

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createAdminClient();

    // Verify Clinic
    const { data: roleData } = await adminSupabase.from("users").select("role").eq("id", user.id).single();
    if (roleData?.role !== "clinic") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Assuming clinic_id is user_id for the clinic users
    const clinic_id = user.id;

    const { data: rawPayments, error } = await adminSupabase
      .from("payments")
      .select(`
        id,
        amount_total,
        platform_commission,
        clinic_amount,
        status,
        created_at
      `)
      .eq("clinic_id", clinic_id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch dynamic commission rate in case there are missing
    const { data: settingData } = await adminSupabase.from("platform_settings").select("value").eq("key", "commission_rate").single();
    const dynamicRate = settingData ? (Number(settingData.value) / 100) : 0.10;

    let totalRevenue = 0;
    let totalClinicEarnings = 0;

    interface Payment {
      id: string;
      amount_total: number;
      platform_commission: number | null;
      clinic_amount: number | null;
      status: string;
      created_at: string;
    }

    const payments = (rawPayments as unknown as Payment[]).map((p) => {
        let commission = p.platform_commission;
        let cAmount = p.clinic_amount;

        if (commission == null || cAmount == null) {
            commission = Math.round(p.amount_total * dynamicRate);
            cAmount = p.amount_total - commission;
            
            // Auto update db async
            adminSupabase.from("payments")
              .update({ platform_commission: commission, clinic_amount: cAmount })
              .eq("id", p.id)
              .then(() => {});
        }

        totalRevenue += p.amount_total;
        totalClinicEarnings += cAmount;

        return {
            ...p,
            platform_commission: commission,
            clinic_amount: cAmount
        };
    });

    return NextResponse.json({ 
        payments, 
        metrics: { totalRevenue, totalClinicEarnings } 
    }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

