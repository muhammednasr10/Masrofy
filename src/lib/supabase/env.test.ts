import { describe, expect, it } from "vitest";
import {
  getSafeNextPath,
  getAuthCallbackUrl,
} from "@/lib/supabase/site-url";
import { isMisconfiguredSupabaseUrl, normalizeSupabaseUrl } from "@/lib/supabase/env";

describe("normalizeSupabaseUrl", () => {
  it("strips trailing /rest/v1 from pasted dashboard URLs", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/rest/v1")).toBe(
      "https://abc.supabase.co",
    );
    expect(normalizeSupabaseUrl("https://abc.supabase.co/rest/v1/")).toBe(
      "https://abc.supabase.co",
    );
  });

  it("keeps a valid project URL unchanged", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co");
  });
});

describe("isMisconfiguredSupabaseUrl", () => {
  it("detects /rest/v1 suffix", () => {
    expect(isMisconfiguredSupabaseUrl("https://abc.supabase.co/rest/v1")).toBe(true);
    expect(isMisconfiguredSupabaseUrl("https://abc.supabase.co")).toBe(false);
  });
});

describe("getSafeNextPath", () => {
  it("allows internal paths only", () => {
    expect(getSafeNextPath("/dashboard")).toBe("/dashboard");
    expect(getSafeNextPath("https://evil.com")).toBe("/dashboard");
    expect(getSafeNextPath("//evil.com")).toBe("/dashboard");
  });
});

describe("getAuthCallbackUrl", () => {
  it("builds a callback URL with encoded next path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://masrofy-sigma.vercel.app";
    expect(getAuthCallbackUrl("/dashboard")).toBe(
      "https://masrofy-sigma.vercel.app/auth/callback?next=%2Fdashboard",
    );
  });
});
