export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { doctor_id } = await request.json();
    if (!doctor_id) return NextResponse.json({ error: "missing doctor_id" }, { status: 400 });

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("wishlists").insert({
        patient_id: user.id,
        doctor_id
    });

    if (error && error.code !== "23505") throw error; // Ignore unique violation if already wishlisted

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const doctor_id = searchParams.get("doctor_id");
    if (!doctor_id) return NextResponse.json({ error: "missing doctor_id" }, { status: 400 });

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from("wishlists").delete()
        .eq("patient_id", user.id)
        .eq("doctor_id", doctor_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
    try {
        const supabase = await createClient();
    
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase.from("wishlists").select("doctor_id, doctors(user_id, specialization, users!inner(first_name, last_name))").eq("patient_id", user.id);
        
        if (error) throw error;
        return NextResponse.json({ wishlists: data });
      } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
      }
}

