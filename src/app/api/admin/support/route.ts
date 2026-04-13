export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

// GET all tickets (admin view) — filterable by type, status, role
export async function GET(request: Request) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");     // "complaint" | "help"
    const status = searchParams.get("status"); // "open" | "in_progress" | "resolved"
    const role = searchParams.get("role");     // "patient" | "doctor" | "clinic"
    const search = searchParams.get("search"); // subject search

    const supabase = createAdminClient();

    // Use a simple select — no FK join to avoid schema cache issues.
    // We enrich with user data in a second query below.
    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    // NO role filter by default — admin sees ALL tickets regardless of submitter role
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);
    if (role) query = query.eq("role", role);
    if (search) query = query.ilike("subject", `%${search}%`);

    const { data: tickets, error } = await query;
    if (error) {
      console.error("Admin support query error:", error);
      throw error;
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ tickets: [] });
    }

    // Enrich with user data (separate query to avoid FK join issues)
    const userIds = Array.from(new Set(tickets.map((t) => t.user_id)));
    const { data: usersData } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .in("id", userIds);

    const usersMap = (usersData || []).reduce<Record<string, { first_name: string | null; last_name: string | null; email: string | null }>>(
      (acc, u) => ({ ...acc, [u.id]: u }),
      {}
    );

    const enriched = tickets.map((t) => ({
      ...t,
      users: usersMap[t.user_id] || null,
    }));

    return NextResponse.json({ tickets: enriched });
  } catch (err: unknown) {
    console.error("Admin Support GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

