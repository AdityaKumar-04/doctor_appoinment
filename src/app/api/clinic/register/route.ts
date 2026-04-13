export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";


export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Multipart form data required" }, { status: 400 });
    }

    const formData = await request.formData();
    const clinic_name = formData.get("clinic_name") as string;
    const doctor_name = formData.get("doctor_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const specialization = formData.get("specialization") as string;
    const experience_years = formData.get("experience_years")
      ? parseInt(formData.get("experience_years") as string)
      : 0;
    const document = formData.get("document") as File | null;

    if (!clinic_name || !doctor_name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload document to Supabase Storage
    let document_url: string | null = null;
    if (document && document.size > 0) {
      const fileName = `clinic/${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("clinic-documents")
        .upload(fileName, document, { upsert: true });

      if (uploadData && !uploadError) {
        const { data: urlData } = supabase.storage
          .from("clinic-documents")
          .getPublicUrl(fileName);
        document_url = urlData.publicUrl;
      }
    }

    // Insert clinic_request row
    const { error: insertError } = await supabase
      .from("clinic_requests")
      .insert({
        clinic_name,
        doctor_name,
        email,
        phone,
        address,
        specialization,
        experience_years,
        document_url,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }


    return NextResponse.json(
      { message: "Clinic registration submitted successfully. You will be notified once reviewed." },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Clinic register error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}

