const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || "muhammednasr10@gmail.com";

export function getAdminEmail() {
  return ADMIN_EMAIL;
}

export async function sendAdminEmail(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { sent: false as const, reason: "resend_not_configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Masrofy <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    return { sent: false as const, reason: `resend_${response.status}` };
  }

  return { sent: true as const };
}
