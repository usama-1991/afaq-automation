import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, industry, message } = body;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "First name, last name, email, and phone number are required." },
        { status: 400 }
      );
    }

    // Insert submission into Supabase contact_submissions table
    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from("contact_submissions").insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        industry: industry || "Other",
        message: message || "",
        created_at: new Date().toISOString(),
        status: "pending",
      });

      if (error) {
        console.error("[contact-api] Supabase insert error:", error);
      }
    } catch (dbErr) {
      console.error("[contact-api] Database error (falling back to logging):", dbErr);
    }

    // Console log submission for server monitoring
    console.log("[contact-api] New Demo / Contact Form Submission Received:", {
      name: `${firstName} ${lastName}`,
      email,
      phone,
      industry,
      message,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your demo request has been received. Our team will contact you within 2 hours.",
    });
  } catch (err: any) {
    console.error("[contact-api] Route exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
