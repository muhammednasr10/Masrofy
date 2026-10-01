import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import AppRoutes from "@/AppRoutes";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import PwaRegister from "@/components/pwa/PwaRegister";
import { createSentryOptions, isSentryEnabled } from "@/lib/sentry/options";
import "@/app/globals.css";

if (isSentryEnabled()) {
  Sentry.init({
    ...createSentryOptions(),
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
  });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root is missing.");
}

createRoot(root).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <p className="p-6 text-sm text-slate-600">حدث خطأ غير متوقع. حدّث الصفحة وحاول مرة أخرى.</p>
      }
    >
      <BrowserRouter>
        <LocaleProvider>
          <PwaRegister />
          <AppRoutes />
        </LocaleProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
