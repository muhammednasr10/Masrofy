type WhatsAppSupportMessageOptions = {
  email?: string;
  fullName?: string;
};

export function getSupportWhatsAppNumber() {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "";
  return raw.replace(/\D/g, "");
}

export function buildWhatsAppSupportMessage(options: WhatsAppSupportMessageOptions = {}) {
  const lines = ["مرحباً، أحتاج دعم فني في تطبيق Masrofy (مصروفي)."];

  if (options.fullName?.trim()) {
    lines.push(`الاسم: ${options.fullName.trim()}`);
  }

  if (options.email?.trim()) {
    lines.push(`البريد: ${options.email.trim()}`);
  }

  lines.push("الرسالة:");
  return lines.join("\n");
}

export function getWhatsAppSupportUrl(options: WhatsAppSupportMessageOptions = {}) {
  const phone = getSupportWhatsAppNumber();

  if (!phone) {
    return null;
  }

  const message = encodeURIComponent(buildWhatsAppSupportMessage(options));
  return `https://wa.me/${phone}?text=${message}`;
}
