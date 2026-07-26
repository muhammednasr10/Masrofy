import * as Sentry from "@sentry/nextjs";
import { createSentryOptions } from "@/lib/sentry/options";

Sentry.init(createSentryOptions());
