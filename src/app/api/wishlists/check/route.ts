export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get("doctor_id");
    if (!doctor_id) return NextResponse.json({ error: "missing doctor_id" }, { status: 400 });

    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase.from("wishlists").select("id").eq("patient_id", user.id).eq("doctor_id", doctor_id).single();

    return NextResponse.json({ isWishlisted: !!data });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

