import * as Sentry from "@sentry/nextjs";
import { createSentryOptions } from "@/lib/sentry/options";

Sentry.init(
  createSentryOptions({
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
  }),
);
