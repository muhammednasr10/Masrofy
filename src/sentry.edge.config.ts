import * as Sentry from "@sentry/nextjs";
import { createSentryOptions } from "@/lib/sentry/options";

Sentry.init(
  createSentryOptions({
    tracesSampleRate: 0.05,
  }),
);
