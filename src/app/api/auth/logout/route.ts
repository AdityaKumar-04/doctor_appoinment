export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Server-side signOut securely kills cookies inside the Next.js runtime
    await supabase.auth.signOut({ scope: "global" });
    
    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
