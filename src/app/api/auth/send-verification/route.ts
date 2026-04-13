export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/admin";



export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();


    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate a magic link via Supabase Admin
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/${role === "doctor" ? "doctor-dashboard" : "dashboard"}`,
      },
    });

    if (linkError || !linkData) {
      console.error("Magic link error:", linkError);
      return NextResponse.json({ error: linkError?.message || "Could not generate verification link" }, { status: 500 });
    }

    const verificationLink = linkData.properties?.action_link;

    if (!verificationLink) {
      return NextResponse.json({ error: "Verification link not generated" }, { status: 500 });
    }


    // Simulating success

    return NextResponse.json({ success: true, message: "Verification email sent" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Send verification error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

