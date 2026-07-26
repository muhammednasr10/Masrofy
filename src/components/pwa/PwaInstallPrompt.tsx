"use client";

import Image from "next/image";
import ModalShell from "@/components/ui/ModalShell";
import type { PwaInstallPlatform } from "@/hooks/usePwaInstall";

type PwaInstallPromptProps = {
  open: boolean;
  platform: PwaInstallPlatform;
  installing: boolean;
  onClose: () => void;
  onInstall: () => void;
};

export default function PwaInstallPrompt({
  open,
  platform,
  installing,
  onClose,
  onInstall,
}: PwaInstallPromptProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} maxWidthClassName="sm:max-w-md">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-emerald-50">
          <Image
            src="/icons/icon-192.png"
            alt="Masrofy"
            width={80}
            height={80}
            className="h-20 w-20 object-cover"
            priority
          />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-slate-900">ثبّت مصروفي على جهازك</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          افتح التطبيق بسرعة من الشاشة الرئيسية، واستخدمه حتى بدون إنترنت لإضافة المصروفات.
        </p>

        {platform === "ios" ? (
          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-right text-sm leading-7 text-slate-700">
            <p className="font-medium text-slate-900">على iPhone أو iPad:</p>
            <ol className="mt-2 list-decimal space-y-1 pr-5">
              <li>اضغط زر المشاركة في Safari</li>
              <li>اختر «إضافة إلى الشاشة الرئيسية»</li>
              <li>اضغط «إضافة»</li>
            </ol>
          </div>
        ) : (
          <ul className="mt-5 space-y-2 text-right text-sm text-slate-600">
            <li className="rounded-2xl bg-emerald-50 px-4 py-3">فتح سريع بدون متصفح</li>
            <li className="rounded-2xl bg-emerald-50 px-4 py-3">يعمل بدون إنترنت للمصروفات</li>
            <li className="rounded-2xl bg-emerald-50 px-4 py-3">مزامنة تلقائية عند عودة النت</li>
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        {platform === "chromium" ? (
          <button
            type="button"
            onClick={onInstall}
            disabled={installing}
            className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {installing ? "جاري التثبيت..." : "تثبيت التطبيق"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          {platform === "ios" ? "فهمت" : "ليس الآن"}
        </button>
      </div>
    </ModalShell>
  );
}
