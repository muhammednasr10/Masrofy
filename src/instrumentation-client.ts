import { isSentryEnabled } from "@/lib/sentry/options";

if (isSentryEnabled()) {
  void import("./sentry-client-init");
}

export const onRouterTransitionStart = (...args: unknown[]) => {
  if (!isSentryEnabled()) {
    return;
  }

  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureRouterTransitionStart(...(args as Parameters<typeof Sentry.captureRouterTransitionStart>));
  });
};
