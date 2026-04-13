export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/clinics — returns all active clinics with doctor count
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let query = supabase
      .from("clinics")
      .select(`
        id,
        name,
        address,
        phone,
        email,
        specializations,
        is_active,
        doctors(count)
      `)
      .eq("is_active", true)
      .order("name");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: clinics, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinics }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

