export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
// removed unused import
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();
    
    // Get doctor info to match doctor_id
    const { data: doctor } = await adminClient.from("doctors").select("id").eq("user_id", user.id).single();
    if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

    // Fetch availability
    const { data, error } = await adminClient
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", doctor.id)
      .order("day_of_week", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ availability: data || [] }, { status: 200 });
  } catch (err: unknown) {
    console.error("Fetch doctor availability error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createAdminClient();
    
    const { data: doctor } = await adminClient.from("doctors").select("id, clinic_id").eq("user_id", user.id).single();
    if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

    const body = await request.json();
    const { availability } = body; // Array of availability schedules

    if (!Array.isArray(availability)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Delete existing
    const { error: delError } = await adminClient
      .from("doctor_availability")
      .delete()
      .eq("doctor_id", doctor.id);

    if (delError) throw delError;

    // Insert new
    interface AvailabilityInput {
      day_of_week: number;
      start_time: string;
      end_time: string;
      slot_duration?: number;
      is_active?: boolean;
    }

    const inserts = (availability as unknown as AvailabilityInput[]).map((a) => ({
      doctor_id: doctor.id,
      clinic_id: doctor.clinic_id,
      day_of_week: a.day_of_week,
      start_time: a.start_time,
      end_time: a.end_time,
      slot_duration: a.slot_duration || 30,
      is_active: a.is_active !== undefined ? a.is_active : true
    }));

    if (inserts.length > 0) {
      const { error: insError } = await adminClient
        .from("doctor_availability")
        .insert(inserts);

      if (insError) throw insError;
    }

    return NextResponse.json({ message: "Availability updated successfully" }, { status: 200 });
  } catch (err: unknown) {
    console.error("Update doctor availability error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

