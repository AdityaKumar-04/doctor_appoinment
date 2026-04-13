export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendEmail } from "@/utils/mail";
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let email: string,
      password: string,
      firstName: string,
      lastName: string,
      role: string,
      phone: string | undefined,
      gender: string | undefined,
      specialization: string | undefined,
      experience_years: number = 0;
    let documentUrl: string | null = null;

    const supabase = createAdminClient();

    // ── 1. Parse input ─────────────────────────────────────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      email = formData.get("email") as string;
      password = formData.get("password") as string;
      firstName = formData.get("firstName") as string;
      lastName = formData.get("lastName") as string;
      role = (formData.get("role") as string) || "doctor";
      gender = (formData.get("gender") as string) || undefined;
      phone = (formData.get("phone") as string) || undefined;
      specialization = (formData.get("specialization") as string) || undefined;
      experience_years = formData.get("experience_years")
        ? parseInt(formData.get("experience_years") as string)
        : 0;

      const file = formData.get("document") as File;
      if (file && file.size > 0) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("doctor_documents")
          .upload(fileName, file, { upsert: true });
        if (uploadData && !uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("doctor_documents")
            .getPublicUrl(fileName);
          documentUrl = publicUrlData.publicUrl;
        }
      }
    } else {
      const body = await request.json();
      email = body.email;
      password = body.password;
      firstName = body.firstName;
      lastName = body.lastName;
      role = body.role || "patient";
      phone = body.phone || undefined;
      gender = body.gender || undefined;
    }

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 2. Clean up orphaned records ───────────────────────────────────────────
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      const { data: authUser } = await supabase.auth.admin.getUserById(existingUser.id);
      if (!authUser.user) {

        await supabase.from("users").delete().eq("id", existingUser.id);
        // Also clean patient_profiles if exists
        await supabase.from("patient_profiles").delete().eq("user_id", existingUser.id);
      } else {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 400 }
        );
      }
    }

    // ── 3. Create Supabase Auth user ───────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError) {
      const isDuplicate =
        authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists");
      return NextResponse.json(
        { error: isDuplicate ? "An account with this email already exists." : authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // ── 4. Insert into public.users ────────────────────────────────────────────
    const userInsert: Record<string, unknown> = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
    };
    if (phone) userInsert.phone = phone;
    if (gender) userInsert.gender = gender;

    const { error: dbError } = await supabase.from("users").upsert(userInsert, { onConflict: "id" });

    if (dbError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: dbError.message || "Failed to create public user record." }, { status: 500 });
    }

    // ── 5. Role-specific inserts ───────────────────────────────────────────────
    if (role === "patient") {
      // Insert into patient_profiles
      const profileInsert: Record<string, unknown> = {
        user_id: userId,
        full_name: `${firstName} ${lastName}`.trim(),
      };
      if (phone) profileInsert.phone = phone;
      if (gender) profileInsert.gender = gender;

      const { error: profileError } = await supabase
        .from("patient_profiles")
        .upsert(profileInsert, { onConflict: "user_id" });

      if (profileError) {
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: profileError.message || "Failed to create patient profile." }, { status: 500 });
      }
    }

    if (role === "doctor") {
      const doctorInsert: Record<string, unknown> = {
        user_id: userId,
        specialization: specialization || "General Practice",
        experience_years: experience_years || 0,
        is_active: false, // Doctors start inactive until enabled by clinic
      };
      if (documentUrl) doctorInsert.document_url = documentUrl;

      const { error: doctorError } = await supabase.from("doctors").insert(doctorInsert);
      
      if (doctorError) {
        await supabase.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: doctorError.message || "Failed to create doctor profile." }, { status: 500 });
      }
    }

    // ── 6. Generate Verification Link ──────────────────────────────────────────
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: `${siteUrl}/verify`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Generate link error:", linkError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to generate verification link." }, { status: 500 });
    }

    const verificationLink = linkData.properties.action_link;

    // ── 7. Send verification email (using Nodemailer) ───────────────────────────
    sendEmail({
      to: email,
      subject: "Verify your Clinical Ethereal account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #0b5c5c; margin-bottom: 20px;">Welcome to Clinical Ethereal, ${firstName}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for creating an account. We're excited to have you on board.</p>
          <p style="font-size: 16px; line-height: 1.5;">To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="display:inline-block; padding: 14px 28px; background-color: #0b5c5c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Email</a>
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #888; border-top: 1px solid #eaeaea; padding-top: 15px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    }).catch((err) => console.error("Verification email failed:", err));

    return NextResponse.json(
      { message: "Account created successfully. Please check your email to verify.", email, role },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

