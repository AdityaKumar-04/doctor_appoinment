export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
// removed unused import
import { sendEmail } from "@/utils/mail";

// Helper: get the authenticated clinic user + their clinic record
async function getClinicContext() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "clinic") return null;

  const { data: clinic } = await adminSupabase
    .from("clinics")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .single();

  if (!clinic) return null;

  return { user, clinic, supabase: adminSupabase };
}

// Generate a temporary password
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const all = upper + lower + digits + special;
  let pwd = upper[Math.floor(Math.random() * upper.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 3; i < 12; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

// GET /api/clinic/doctors — list all doctors for this clinic
export async function GET() {
  try {
    const ctx = await getClinicContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { data: doctors, error } = await ctx.supabase
      .from("doctors")
      .select(`
        id,
        specialization,
        experience_years,
        consultation_fee,
        bio,
        is_active,
        users!inner(first_name, last_name, email, phone)
      `)
      .eq("clinic_id", ctx.clinic.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ doctors }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/clinic/doctors — create a new doctor under this clinic
export async function POST(request: Request) {
  try {
    const ctx = await getClinicContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { first_name, last_name, email, specialization, experience_years, phone } = await request.json();

    if (!first_name || !last_name || !email || !specialization) {
      return NextResponse.json({ error: "Missing required fields: first_name, last_name, email, specialization" }, { status: 400 });
    }

    const tempPassword = generateTempPassword();
    const supabase = ctx.supabase;

    // 1. Check if a user already exists with this email
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    let doctorUserId: string;

    if (existingUser) {
      // Reuse existing user
      doctorUserId = existingUser.id;
    } else {
      // Create auth user for the new doctor
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      doctorUserId = authData.user.id;
    }

    // 2. UPSERT into public.users
    const { error: usersError } = await supabase.from("users").upsert({
      id: doctorUserId,
      email,
      first_name,
      last_name,
      role: "doctor",
      phone: phone || null,
    }, { onConflict: "id" });

    if (usersError) {
      if (!existingUser) await supabase.auth.admin.deleteUser(doctorUserId);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 3. UPSERT into public.doctors with clinic_id (Ensures user_id is used not id)
    const { error: doctorError } = await supabase.from("doctors").upsert({
      user_id: doctorUserId,
      specialization,
      experience_years: experience_years || 0,
      clinic_id: ctx.clinic.id,
      is_active: true,
    }, { onConflict: "user_id" });

    if (doctorError) {
      if (!existingUser) await supabase.auth.admin.deleteUser(doctorUserId);
      return NextResponse.json({ error: doctorError.message }, { status: 500 });
    }

    // 4. Email the doctor their credentials
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const loginDetailsHtml = existingUser 
      ? `<p>Your account is already set up. Please login using your existing credentials.</p>`
      : `<p><strong>Login Details:</strong></p>
         <ul style="background: #f5f5f5; padding: 15px; border-radius: 5px; list-style: none;">
           <li>Email: <strong>${email}</strong></li>
           <li>Password: <strong>${tempPassword}</strong></li>
         </ul>
         <p style="color: #666; font-size: 13px; margin-top: 10px;">For security, please change your password after logging in.</p>`;

    sendEmail({
      to: email,
      subject: "You've been added to Clinical Ethereal",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0b5c5c;">Welcome, Dr. ${first_name} ${last_name}!</h2>
          <p>Your clinic has added you as a provider on Clinical Ethereal.</p>
          ${loginDetailsHtml}
          <a href="${siteUrl}/login" style="display:inline-block; padding: 10px 20px; background-color: #0b5c5c; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px;">Login to Your Account</a>
        </div>
      `,
    }).catch(console.error);

    return NextResponse.json({
      message: existingUser 
        ? `Doctor added! They have been notified to login with their existing account.` 
        : `Doctor account created. Login credentials emailed to ${email}.`,
      doctor_user_id: doctorUserId,
    }, { status: 201 });

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

