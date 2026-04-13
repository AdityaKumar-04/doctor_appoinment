export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getAppointments } from "@/services/queries";
import { createAppointment, updateAppointmentStatus } from "@/services/mutations";

export async function POST(request: Request) {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, notes } = await request.json();

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
    }

    const appointment = await createAppointment(patient_id, doctor_id, appointment_date, appointment_time, notes);

    return NextResponse.json({ appointment, message: "Appointment booked successfully" }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    const status = error.message.includes("booked") ? 409 : (error.message.includes("not found") ? 404 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const roleParam = searchParams.get("role");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!requestedUserId || !roleParam) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIdToFetch = roleParam === "admin" ? user.id : requestedUserId;

    if (roleParam !== "admin" && roleParam !== "clinic" && requestedUserId !== user.id) {
       return NextResponse.json({ error: "Forbidden: Cannot access other users' data" }, { status: 403 });
    }

    const { data, count } = await getAppointments(roleParam, userIdToFetch, status, page);
    const limit = 6;

    return NextResponse.json({ 
      appointments: data ?? [], 
      count, 
      page, 
      totalPages: count ? Math.ceil(count / limit) : 0 
    }, { status: 200 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    const status = error.message.includes("not found") ? 404 : (error.message.includes("Invalid role") ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, status, role } = body;

    if (!appointmentId || !status || !role || !["pending", "confirmed", "scheduled", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const targetUserId = user.id;

    const appointment = await updateAppointmentStatus(role, targetUserId, appointmentId, status);
    return NextResponse.json({ message: "Status updated successfully", appointment }, { status: 200 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Internal Server Error");
    const status = error.message.includes("not found") || error.message.includes("owned") ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

