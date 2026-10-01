import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { LEGAL_LAST_UPDATED, privacySections } from "@/lib/legal/content";

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout
      title="سياسة الخصوصية"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={privacySections}
    />
  );
}
