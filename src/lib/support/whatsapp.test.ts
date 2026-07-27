import { describe, expect, it } from "vitest";
import {
  buildWhatsAppSupportMessage,
  getWhatsAppSupportUrl,
} from "@/lib/support/whatsapp";

describe("whatsapp support", () => {
  it("builds a prefilled support message", () => {
    const message = buildWhatsAppSupportMessage({
      fullName: "محمد",
      email: "user@example.com",
    });

    expect(message).toContain("Masrofy");
    expect(message).toContain("محمد");
    expect(message).toContain("user@example.com");
  });

  it("returns wa.me link when phone is configured", () => {
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = "+20 101 234 5678";

    const url = getWhatsAppSupportUrl({ email: "user@example.com" });

    expect(url).toMatch(/^https:\/\/wa\.me\/201012345678\?text=/);
  });

  it("returns null when phone is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;

    expect(getWhatsAppSupportUrl()).toBeNull();
  });
});
