import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { LEGAL_LAST_UPDATED, termsSections } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "شروط الاستخدام | Masrofy",
  description: "شروط استخدام تطبيق Masrofy (مصروفي).",
};

export default function TermsPage() {
  return (
    <LegalDocumentLayout
      title="شروط الاستخدام"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={termsSections}
    />
  );
}
