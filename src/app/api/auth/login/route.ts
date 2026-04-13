export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, loginType } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? "Invalid credentials" }, { status: 400 });
    }

    // 2. Fetch role from DB — NEVER from user_metadata
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.admin.signOut(data.user.id);
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const actualRole = profile.role;

    // 3. Portal cross-validation: reject if role doesn't match the intended portal
    if (loginType && loginType !== actualRole) {
      await supabase.auth.admin.signOut(data.user.id);
      const portalName = loginType === "doctor" ? "Provider" : loginType === "clinic" ? "Clinic" : "Patient";
      return NextResponse.json(
        { error: `This account is not registered as a ${portalName}.` },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { session: data.session, user: data.user, role: actualRole },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

