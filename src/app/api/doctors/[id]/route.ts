export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// GET /api/doctors/[id] — get a specific doctor's profile (id = user_id)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    // Try fetching by user_id first (new schema), fall back to id (old schema)
    let { data: doctor, error } = await supabase
      .from("doctors")
      .select(`
        id,
        user_id,
        specialization,
        experience_years,
        consultation_fee,
        bio,
        is_active,
        clinic_id,
        clinics(id, name, address, phone),
        users!user_id(first_name, last_name, email, phone)
      `)
      .eq("user_id", id)
      .maybeSingle();

    // Fallback: if user_id lookup returns nothing, try by id column
    if (!doctor && !error) {
      const fallback = await supabase
        .from("doctors")
        .select(`
          id,
          user_id,
          specialization,
          experience_years,
          consultation_fee,
          bio,
          is_active,
          clinic_id,
          clinics(id, name, address, phone),
          users!user_id(first_name, last_name, email, phone)
        `)
        .eq("id", id)
        .maybeSingle();
      doctor = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, patient:users!patient_id(first_name, last_name)")
      .eq("doctor_id", doctor.id)
      .order("created_at", { ascending: false });

    interface ReviewRow {
      id: string;
      rating: number;
      comment: string;
      created_at: string;
      patient: { first_name: string; last_name: string } | null;
    }

    const reviews = (reviewsData as unknown as ReviewRow[] | null)?.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        patient_name: r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : "Anonymous"
    })) || [];

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return NextResponse.json({ doctor, reviews, averageRating, totalReviews: reviews.length }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/doctors/[id] — update doctor's public profile
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const id = params.id;
    const { bio, consultation_fee, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (bio !== undefined) updatePayload.bio = bio;
    if (consultation_fee !== undefined) updatePayload.consultation_fee = consultation_fee;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Try updating by user_id first, fall back to id
    let { data: doctor, error } = await supabase
      .from("doctors")
      .update(updatePayload)
      .eq("user_id", id)
      .select()
      .maybeSingle();

    if (!doctor && !error) {
      const fallback = await supabase
        .from("doctors")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      doctor = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { doctor, message: "Profile updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
