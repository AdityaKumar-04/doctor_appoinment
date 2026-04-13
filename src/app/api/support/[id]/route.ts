export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET a single ticket (must belong to user, or user is admin) + its messages
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Determine admin status
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";

    // Fetch ticket — admin sees any ticket, user only sees their own
    let query = admin.from("support_tickets").select("*").eq("id", id);
    if (!isAdmin) query = query.eq("user_id", user.id);

    const { data: ticket, error: ticketError } = await query.single();
    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Fetch messages ordered by created_at ASC (DO NOT filter by user_id)
    const { data: messages, error: msgError } = await admin
      .from("ticket_messages")
      .select("id, message, sender_id, sender_role, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("ticket_messages fetch error:", msgError);
    }

    return NextResponse.json({ ticket, messages: messages || [] });
  } catch (err: unknown) {
    console.error("Support [id] GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST — add a reply message (works for both user and admin)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Fetch sender role from users table
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Derive sender_role — admin is always "admin", others use their table role
    const senderRole: string = isAdmin ? "admin" : (profile?.role ?? "patient");

    const body = await request.json();
    const { message } = body;
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Non-admin: verify the ticket belongs to the requesting user
    if (!isAdmin) {
      const { data: ticket, error: tErr } = await admin
        .from("support_tickets")
        .select("user_id")
        .eq("id", id)
        .single();
      if (tErr || !ticket || ticket.user_id !== user.id) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
    }

    // Admin reply → move ticket to "in_progress" if currently "open"
    if (isAdmin) {
      const { error: statusErr } = await admin
        .from("support_tickets")
        .update({ status: "in_progress" })
        .eq("id", id)
        .eq("status", "open");

      if (statusErr) {
        console.error("Status update error:", statusErr);
      }
    }

    // Insert the message with correct sender_role
    const { data, error: insertErr } = await admin
      .from("ticket_messages")
      .insert({
        ticket_id: id,
        sender_id: user.id,
        sender_role: senderRole,
        message: message.trim(),
      })
      .select("id, message, sender_id, sender_role, created_at")
      .single();

    if (insertErr) {
      console.error("ticket_messages insert error:", insertErr);
      throw insertErr;
    }

    return NextResponse.json({ message: data });
  } catch (err: unknown) {
    console.error("Support [id] POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH — update ticket status (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { status } = await request.json();
    const validStatuses = ["open", "in_progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { error } = await admin
      .from("support_tickets")
      .update({ status })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Support [id] PATCH Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
