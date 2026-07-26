"use client";

import { PWA_OPEN_INSTALL_EVENT } from "@/lib/pwa/events";
import { usePwaInstallContext } from "@/components/pwa/PwaInstallContext";

export default function AccountAppSection() {
  const { installed, canInstall, platform, openPrompt } = usePwaInstallContext();

  function handleInstallClick() {
    openPrompt();
  }

  if (installed) {
    return (
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">تطبيق Masrofy</h3>
        <p className="mt-2 text-sm text-emerald-700">
          التطبيق مثبت على جهازك ويمكنك فتحه من الشاشة الرئيسية.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">تطبيق Masrofy</h3>
      <p className="mt-2 text-sm text-slate-500">
        ثبّت مصروفي على هاتفك للوصول السريع والعمل بدون إنترنت.
      </p>

      {canInstall ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {platform === "ios" ? "كيف أثبت التطبيق؟" : "تثبيت التطبيق"}
        </button>
      ) : (
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          التثبيت متاح من Chrome أو Edge على Android، أو Safari على iPhone.
        </p>
      )}
    </section>
  );
}
