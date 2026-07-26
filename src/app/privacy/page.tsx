import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { LEGAL_LAST_UPDATED, privacySections } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Masrofy",
  description: "سياسة الخصوصية لتطبيق Masrofy (مصروفي).",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout
      title="سياسة الخصوصية"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={privacySections}
    />
  );
}
