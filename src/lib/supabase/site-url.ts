export function getSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getSafeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }

  return next;
}

export function getAuthCallbackUrl(next = "/dashboard") {
  const nextPath = getSafeNextPath(next);
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
