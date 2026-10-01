import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { LEGAL_LAST_UPDATED, termsSections } from "@/lib/legal/content";

export default function TermsPage() {
  return (
    <LegalDocumentLayout
      title="شروط الاستخدام"
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={termsSections}
    />
  );
}
