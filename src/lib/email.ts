import { Resend } from "resend";

const hasRealApiKey =
  !!process.env.RESEND_API_KEY &&
  process.env.RESEND_API_KEY !== "your_resend_api_key";

const resend = hasRealApiKey ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendAccountabilityEmail(
  to: string,
  subject: string,
  message: string,
  partnerLink: string
) {
  if (!resend || !to) {
    console.log("[email skipped - no RESEND_API_KEY or recipient]", {
      to,
      subject,
      message,
    });
    return;
  }

  try {
    await resend.emails.send({
      from: "Tether <onboarding@resend.dev>",
      to,
      subject,
      html: `<p>${message}</p><p><a href="${partnerLink}">View their progress →</a></p>`,
    });
  } catch (err) {
    console.error("sendAccountabilityEmail failed:", err);
  }
}
