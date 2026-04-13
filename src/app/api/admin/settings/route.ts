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

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("platform_settings").select("*");
    
    if (error) throw error;

    const settings = (data as { key: string; value: unknown }[]).reduce((acc: Record<string, unknown>, row) => {
        acc[row.key] = row.value;
        return acc;
    }, {});

    return NextResponse.json({ settings });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    
        const body = await request.json();
        const settingsToUpdate = Object.entries(body);
        
        const supabase = createAdminClient();
        
        for (const [key, value] of settingsToUpdate) {
             const { error } = await supabase.from("platform_settings")
                .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
                .eq("key", key);

             if (error) {
                 // Try inserting if it doesn't exist
                 await supabase.from("platform_settings").insert({ key, value: JSON.stringify(value) });
             }
        }
    
        return NextResponse.json({ success: true });
      } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
      }
}

