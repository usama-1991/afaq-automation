import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

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

    // 1. Insert submission into Supabase contact_submissions table
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
      console.error("[contact-api] Database error (falling back to logging/email):", dbErr);
    }

    // 2. Send instant Email Notification via Resend if RESEND_API_KEY is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        const targetEmail = process.env.NOTIFICATION_EMAIL || "Ittisaloai@gmail.com";
        const fromDomain = process.env.RESEND_FROM_DOMAIN || "onboarding@resend.dev";
        const fromAddress = fromDomain.includes("@")
          ? `Ittisalo Leads <${fromDomain}>`
          : `Ittisalo Leads <leads@${fromDomain}>`;

        const emailResponse = await resend.emails.send({
          from: fromAddress,
          to: [targetEmail],
          subject: `🔥 New Demo Request: ${firstName} ${lastName} (${industry || "SMB"})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #EFEBE4; border-radius: 16px; background-color: #FDFCFB;">
              <div style="background-color: #240710; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px;">
                <h1 style="color: #FFFFFF; font-size: 20px; margin: 0;">🔥 New Demo Request Received</h1>
                <p style="color: #E63946; font-size: 12px; margin: 4px 0 0 0; font-weight: bold; text-transform: uppercase;">Ittisalo Marketing Web Lead</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1A1517;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA; font-weight: bold; width: 140px;">Full Name:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA; font-weight: bold;">WhatsApp / Phone:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA;">
                    <a href="https://wa.me/${phone.replace(/\D/g, "")}" style="color: #25D366; text-decoration: none; font-weight: bold;">
                      ${phone} (Click to Chat on WhatsApp)
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA; font-weight: bold;">Email Address:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA;">
                    <a href="mailto:${email}" style="color: #C81E3A; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA; font-weight: bold;">Industry Vertical:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #FFE8EA;">
                    <span style="background-color: #FFF5F5; color: #8B1531; padding: 4px 10px; border-radius: 20px; border: 1px solid #FFE8EA; font-weight: bold; font-size: 12px;">
                      ${industry || "Other"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Message / Notes:</td>
                  <td style="padding: 10px 0; color: #5C5255; line-height: 1.5;">${message || "No additional message provided."}</td>
                </tr>
              </table>

              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EFEBE4; text-align: center; font-size: 11px; color: #8C8285;">
                Submitted on ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT via <strong>https://www.ittisalo.com/contact</strong>
              </div>
            </div>
          `,
        });

        console.log("[contact-api] Resend email dispatch result:", emailResponse);
      } catch (emailErr) {
        console.error("[contact-api] Resend email dispatch failed:", emailErr);
      }
    }

    // 3. Console log submission for server monitoring
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
