export const dynamic = "force-dynamic";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    // First fetch the basic user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to fetch profile details
    const { data: profileDetails } = await supabase
      .from("profile_details")
      .select("*")
      .eq("user_id", id)
      .single();

    // It's perfectly fine if profile_details doesn't exist yet
    return NextResponse.json({
      user: userData,
      profile_details: profileDetails || null
    }, { status: 200 });

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
