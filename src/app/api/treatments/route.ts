export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Always derive doctor_id from the authenticated session — never trust client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = user.id; 

    // Fetch the doctor's UUID from the doctors table
    const { data: doctorRow, error: doctorErr } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", authUserId)
      .single();

    if (doctorErr || !doctorRow) {
      return NextResponse.json(
        { error: "Doctor profile not found." },
        { status: 403 }
      );
    }

    const doctorId = doctorRow.id;

    const { appointmentId, patientId, notes, followupDate } = await req.json();

    if (!appointmentId || !patientId || !notes?.trim()) {
      return NextResponse.json(
        { error: "appointmentId, patientId, and notes are required." },
        { status: 400 }
      );
    }

    // 1. Fetch appointment safely to validate ownership before updating
    const adminSupabase = createAdminClient();
    const { data: apt, error: fetchErr } = await adminSupabase
      .from("appointments")
      .select("doctor_id, clinic_id")
      .eq("id", appointmentId)
      .single();

    if (fetchErr || !apt) {
      return NextResponse.json(
        { error: "Appointment not found." },
        { status: 404 }
      );
    }

    // 2. Compare doctor_id
    if (apt.doctor_id !== doctorId) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have permission to update this appointment." },
        { status: 403 }
      );
    }

    // 3. Update appointment status → completed
    const { error: updateErr } = await adminSupabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId);

    if (updateErr) {
      console.error("Appointment update error:", updateErr);
      throw new Error("Failed to update appointment status: " + updateErr.message);
    }

    // 2. Insert treatment record
    const { data: treatment, error: treatmentErr } = await supabase
      .from("treatments")
      .insert({
        appointment_id: appointmentId,
        doctor_id: authUserId,
        patient_id: patientId,
        notes: notes.trim(),
        followup_date: followupDate || null,
      })
      .select("id")
      .single();

    if (treatmentErr) {
      console.error("Treatment insert error:", treatmentErr);
      throw new Error("Failed to save treatment notes: " + treatmentErr.message);
    }

    // 3. Create a notification if a followup is scheduled
    if (followupDate && treatment?.id) {
      const formattedDate = new Date(followupDate).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
      
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: patientId,
        title: "Follow-up Scheduled",
        message: `Your doctor has scheduled a follow-up for you on ${formattedDate}.`,
        is_read: false,
      });

      if (notifErr) {
        console.error("Follow-up notification insert error:", notifErr);
      }
    }

    return NextResponse.json({ success: true, data: { appointmentId, treatmentId: treatment.id } });
  } catch (err: unknown) {
    console.error("Treatment API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // "clinic" or "patient"
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 6;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ⚠️ Use adminClient for ALL data queries — regular client RLS blocks cross-user reads
    const admin = createAdminClient();

    let rawTreatments: Record<string, unknown>[] = [];
    let count = 0;

    if (role === "clinic") {
      // Step 1: Find this clinic owner's clinic
      const { data: clinic } = await admin
        .from("clinics")
        .select("id")
        .eq("owner_user_id", user.id)
        .single();



      if (!clinic) {
        return NextResponse.json({ error: "Clinic profile not found" }, { status: 404 });
      }

      // Step 2: Fetch doctors belonging to this clinic
      const { data: doctors } = await admin
        .from("doctors")
        .select("user_id")
        .eq("clinic_id", clinic.id);



      const doctorUserIds = doctors?.map((d: { user_id: string }) => d.user_id) || [];

      if (doctorUserIds.length === 0) {
        return NextResponse.json({ treatments: [], count: 0, page, totalPages: 0 });
      }

      // Step 3: Fetch treatments for these doctors with pagination
      const { data, count: c, error: tErr } = await admin
        .from("treatments")
        .select("id, notes, followup_date, created_at, patient_id, doctor_id", { count: "exact" })
        .in("doctor_id", doctorUserIds)
        .order("created_at", { ascending: false })
        .range(from, to);



      if (tErr) throw tErr;
      rawTreatments = data || [];
      count = c || 0;

    } else if (role === "patient") {
      const { data, count: c, error: tErr } = await admin
        .from("treatments")
        .select("id, notes, followup_date, created_at, patient_id, doctor_id", { count: "exact" })
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (tErr) throw tErr;
      rawTreatments = data || [];
      count = c || 0;

    } else {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    if (rawTreatments.length === 0) {
      return NextResponse.json({ treatments: [], count, page, totalPages: 0 });
    }

    // ── Extract unique IDs ────────────────────────────────────────────────
    const patientIds  = Array.from(new Set(rawTreatments.map((t: { patient_id?: string | unknown }) => t.patient_id).filter(Boolean))) as string[];
    const doctorIds   = Array.from(new Set(rawTreatments.map((t: { doctor_id?: string | unknown }) => t.doctor_id).filter(Boolean))) as string[];



    // ── Patient name: patient_profiles.full_name (user_id = patient_id) ──
    const patientsMap: Record<string, { full_name: string | null; email: string }> = {};

    if (patientIds.length > 0) {
      const { data: profiles } = await admin
        .from("patient_profiles")
        .select("user_id, full_name")
        .in("user_id", patientIds);


      const { data: patientUsers } = await admin
        .from("users")
        .select("id, email")
        .in("id", patientIds);


      // Build email lookup
      const emailById: Record<string, string> = {};
      patientUsers?.forEach((u: { id: string; email?: string }) => { emailById[u.id] = u.email ?? ""; });

      // Merge: prefer patient_profiles.full_name, always attach email
      profiles?.forEach((p: { user_id: string; full_name?: string | null }) => {
        patientsMap[p.user_id] = { full_name: p.full_name ?? null, email: emailById[p.user_id] ?? "" };
      });
      // Fallback for patients with no patient_profiles row
      patientUsers?.forEach((u: { id: string; email?: string }) => {
        if (!patientsMap[u.id]) {
          patientsMap[u.id] = { full_name: null, email: u.email ?? "" };
        }
      });
    }

    // ── Doctor name: users.first_name + last_name (id = doctor_id) ────────
    const doctorsMap: Record<string, { name: string; email: string }> = {};

    if (doctorIds.length > 0) {
      const { data: doctorUsers } = await admin
        .from("users")
        .select("id, email, first_name, last_name")
        .in("id", doctorIds);


      doctorUsers?.forEach((u: { id: string; first_name?: string; last_name?: string; email?: string }) => {
        const parts = [u.first_name, u.last_name].filter(Boolean);
        doctorsMap[u.id] = {
          name:  parts.length > 0 ? `Dr. ${parts.join(" ")}` : (u.email ?? "Unknown Doctor"),
          email: u.email ?? "",
        };
      });
    }

    // ── Merge ─────────────────────────────────────────────────────────────
    const finalizedData = rawTreatments.map((t: Record<string, unknown> & { patient_id?: string; doctor_id?: string; id?: string }) => {
      const patient = t.patient_id ? patientsMap[t.patient_id as string] : undefined;
      const doctor  = t.doctor_id ? doctorsMap[t.doctor_id as string] : undefined;



      return {
        ...t,
        patientName:  patient?.full_name?.trim() || patient?.email || "Unknown Patient",
        patientEmail: patient?.email || "",
        doctorName:   doctor?.name  || "Unknown Doctor",
      };
    });

    return NextResponse.json({
      treatments: finalizedData,
      count,
      page,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });

  } catch (err: unknown) {
    console.error("[Treatments GET] error:", err);
    return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 });
  }
}

