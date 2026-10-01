import { readPublicEnv } from "@/lib/public-env";

function readNodeEnv(name: string) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  return process.env[name];
}

export function getSiteUrl() {
  const configured = readPublicEnv("NEXT_PUBLIC_SITE_URL");

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const productionHost = readNodeEnv("VERCEL_PROJECT_PRODUCTION_URL");

  if (productionHost) {
    return `https://${productionHost}`;
  }

  const vercelHost = readNodeEnv("VERCEL_URL");

  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return "http://localhost:3000";
}

export function getSafeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) {
    return fallback;
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    next.includes("%") ||
    next.includes("..") ||
    next.includes("://")
  ) {
    return fallback;
  }

  return next;
}

export function getAuthCallbackUrl(next = "/dashboard") {
  const nextPath = getSafeNextPath(next);
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export function getAuthRedirectAllowList() {
  const siteUrl = getSiteUrl();
  const localDevUrl = "http://localhost:3000";

  return Array.from(
    new Set([
      `${siteUrl}/auth/callback`,
      `${localDevUrl}/auth/callback`,
      "https://masrofy-sigma.vercel.app/auth/callback",
    ]),
  );
}
