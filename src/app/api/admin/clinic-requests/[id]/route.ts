export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
// removed unused import
import { sendEmail } from "@/utils/mail";

// Helper: verify the caller is an admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from("users").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

// Generate a secure temporary password
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const all = upper + lower + digits + special;
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 3; i < 12; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

// PATCH /api/admin/clinic-requests/[id]
// Body: { action: "approve" | "reject", rejection_reason?: string }
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const caller = await verifyAdmin();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { action, rejection_reason } = await request.json();
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch the clinic request
    const { data: request_data, error: fetchError } = await supabase
      .from("clinic_requests")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !request_data) {
      return NextResponse.json({ error: "Clinic request not found" }, { status: 404 });
    }

    if (request_data.status !== "pending") {
      return NextResponse.json({ error: `Request already ${request_data.status}` }, { status: 409 });
    }

    // ── REJECT FLOW ──────────────────────────────────────────────────────────
    if (action === "reject") {
      const { error: updateError } = await supabase
        .from("clinic_requests")
        .update({ status: "rejected" })
        .eq("id", params.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Send rejection email
      sendEmail({
        to: request_data.email,
        subject: "Clinic Registration Update - Clinical Ethereal",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0b5c5c;">Application Update</h2>
            <p>We're sorry to inform you that your clinic registration for <strong>${request_data.clinic_name}</strong> was not approved at this time.</p>
            ${rejection_reason ? `<p><strong>Reason:</strong> ${rejection_reason}</p>` : ""}
            <p>For further assistance, please reach out to our support team.</p>
          </div>
        `
      }).catch(console.error);

      return NextResponse.json({ message: "Clinic registration rejected" }, { status: 200 });
    }

    // ── APPROVE FLOW ─────────────────────────────────────────────────────────
    const tempPassword = generateTempPassword();

    // 1. Check if user already exists
    let clinicUserId: string;
    let isNewUser = false;

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", request_data.email)
      .single();

    if (existingUser) {
      clinicUserId = existingUser.id;
      // Update role to clinic
      await supabase.from("users").update({ role: "clinic" }).eq("id", clinicUserId);
    } else {
      isNewUser = true;
      // Create Supabase auth user for the clinic
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request_data.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      clinicUserId = authData.user.id;

      // UPSERT into public.users (role = 'clinic')
      const { error: usersError } = await supabase.from("users").upsert({
        id: clinicUserId,
        email: request_data.email,
        first_name: request_data.clinic_name,
        last_name: "",
        role: "clinic",
        phone: request_data.phone || null,
      }, { onConflict: "id" });

      if (usersError) {
        await supabase.auth.admin.deleteUser(clinicUserId);
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }
    }

    // 3. Insert into public.clinics
    const { error: clinicError } = await supabase.from("clinics").insert({
      owner_user_id: clinicUserId,
      name: request_data.clinic_name,
      address: request_data.address || null,
      phone: request_data.phone || null,
      email: request_data.email,
      specializations: request_data.specialization ? [request_data.specialization] : [],
      is_active: true,
    });

    if (clinicError) {
      if (isNewUser) await supabase.auth.admin.deleteUser(clinicUserId);
      return NextResponse.json({ error: clinicError.message }, { status: 500 });
    }

    // 4. Update clinic_requests status to approved
    await supabase
      .from("clinic_requests")
      .update({ status: "approved" })
      .eq("id", params.id);

    // 5. Send approval email with credentials
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0b5c5c;">Clinic Approved!</h2>
        <p>Your clinic <strong>${request_data.clinic_name}</strong> has been officially approved on Clinical Ethereal.</p>
        <p><strong>Login Details:</strong></p>
        <ul style="background: #f5f5f5; padding: 15px; border-radius: 5px; list-style: none;">
          <li>Email: <strong>${request_data.email}</strong></li>
          ${isNewUser ? `<li>Password: <strong>${tempPassword}</strong></li>` : `<li>Password: <em>Your existing password</em></li>`}
        </ul>
        <a href="${siteUrl}/login" style="display:inline-block; padding: 10px 20px; background-color: #0b5c5c; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Login to Your Clinic Dashboard</a>
      </div>
    `;

    sendEmail({
      to: request_data.email,
      subject: "Clinic Registration Approved - Clinical Ethereal",
      html: emailHtml,
    }).catch(console.error);

    return NextResponse.json({
      message: "Clinic approved and account status updated successfully",
      clinic_user_id: clinicUserId,
    }, { status: 200 });

  } catch (err: unknown) {
    console.error("Admin approve/reject error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
