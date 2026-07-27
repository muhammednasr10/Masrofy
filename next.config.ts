import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/ssr", "@sentry/nextjs"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

const sentryWebpackPluginOptions = {
  org: sentryOrg,
  project: sentryProject,
  authToken: sentryAuthToken,
  silent: !sentryAuthToken,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !sentryAuthToken,
  },
};

const shouldWrapWithSentry =
  process.env.NODE_ENV === "production" && Boolean(sentryAuthToken);

export default shouldWrapWithSentry
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
