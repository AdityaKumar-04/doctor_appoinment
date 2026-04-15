// export const dynamic = "force-dynamic";
// import { NextResponse } from "next/server";
// import { createAdminClient } from "@/utils/supabase/admin";

// // GET /api/doctors — list all active doctors for patient booking
// export async function GET() {
//   try {
//     const supabase = createAdminClient();

//     const { data: doctors, error } = await supabase
//       .from("doctors")
//       .select(`
//         id,
//         user_id,
//         specialization,
//         experience_years,
//         consultation_fee,
//         bio,
//         is_active,
//         clinic_id,
//         clinics(id, name, address),
//         users!user_id(first_name, last_name, email, phone)
//       `)
//       .eq("is_active", true);

//     if (error) {
//       // Fallback: try with inner join on id if user_id relation fails
//       console.error("Doctors fetch error:", error.message);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     return NextResponse.json({ doctors }, { status: 200 });
//   } catch (err: unknown) {
//     return NextResponse.json(
//       { error: err instanceof Error ? err.message : "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }


export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  console.log("[Doctors API] Starting request...");
  try {
    const supabase = createAdminClient();

    console.log("[Doctors API] Fetching doctors...");
    // 1. Fetch doctors
    const { data: doctors, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("[Doctors API] Error fetching doctors:", error);
      throw error;
    }

    console.log(`[Doctors API] Fetched ${doctors?.length || 0} doctors successfully.`);

    // 2. Fetch users separately
    const userIds = doctors.map((d) => d.user_id);
    console.log("[Doctors API] Extracting user IDs for merge:", userIds);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone")
      .in("id", userIds);

    if (usersError) {
      console.error("[Doctors API] Error fetching users:", usersError);
    }

    console.log(`[Doctors API] Fetched ${users?.length || 0} users successfully.`);

    // 3. Merge manually
    const merged = doctors.map((doc) => ({
      ...doc,
      user: users?.find((u) => u.id === doc.user_id) || null,
    }));

    console.log("[Doctors API] Successfully merged data. Returning payload.");
    return NextResponse.json({ doctors: merged }, { status: 200 });

  } catch (err: any) {
    console.error("[Doctors API] Unhandled Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

