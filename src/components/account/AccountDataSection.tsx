"use client";

import { useState } from "react";
import { useRouter } from "@/lib/router/navigation";
import { buildAccountExport, downloadAccountExport } from "@/lib/account/export-data";
import { createClient } from "@/lib/supabase/client";

type AccountDataSectionProps = {
  email: string;
  onFeedback: (error: string | null, message: string | null) => void;
};

export default function AccountDataSection({ email, onFeedback }: AccountDataSectionProps) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  async function handleExport() {
    setExporting(true);
    onFeedback(null, null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً.");
      }

      const payload = await buildAccountExport(supabase, user.id, user.email ?? null);
      downloadAccountExport(payload);
      onFeedback(null, "تم تنزيل نسخة من بياناتك.");
    } catch (exportError) {
      onFeedback(
        exportError instanceof Error ? exportError.message : "تعذر تصدير البيانات.",
        null,
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation.trim() !== email.trim()) {
      onFeedback("اكتب بريدك الإلكتروني بالضبط لتأكيد الحذف.", null);
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد؟ سيتم حذف حسابك وبياناتك نهائياً ولا يمكن التراجع.",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    onFeedback(null, null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("يجب تسجيل الدخول أولاً.");
      }

      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "تعذر حذف الحساب.");
      }

      await supabase.auth.signOut();
      router.push("/register");
      router.refresh();
    } catch (deleteError) {
      onFeedback(
        deleteError instanceof Error ? deleteError.message : "تعذر حذف الحساب.",
        null,
      );
      setDeleting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">البيانات والحساب</h3>

      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <p className="text-sm font-medium text-slate-900">تصدير البيانات</p>
          <p className="mt-1 text-sm text-slate-500">
            نزّل نسخة JSON من محافظك، معاملاتك، خططك، وأهدافك.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="mt-3 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
          >
            {exporting ? "جاري التصدير..." : "تصدير JSON"}
          </button>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
          <p className="text-sm font-medium text-red-800">حذف الحساب</p>
          <p className="mt-1 text-sm text-red-700">
            هذا الإجراء نهائي. اكتب بريدك الإلكتروني للتأكيد:{" "}
            <span className="font-medium">{email}</span>
          </p>
          <input
            type="email"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={email}
            className="mt-3 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400"
          />
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="mt-3 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "جاري الحذف..." : "حذف حسابي نهائياً"}
          </button>
        </div>
      </div>
    </section>
  );
}
