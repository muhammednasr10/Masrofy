import { relationshipOptions } from "@/lib/constants/friendship-options";

type RelationshipType = (typeof relationshipOptions)[number]["value"];

type FriendInviteFormProps = {
  inviteEmail: string;
  relationshipType: RelationshipType;
  shareMyActivity: boolean;
  submitting: boolean;
  onInviteEmailChange: (value: string) => void;
  onRelationshipTypeChange: (value: RelationshipType) => void;
  onShareMyActivityChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function FriendInviteForm({
  inviteEmail,
  relationshipType,
  shareMyActivity,
  submitting,
  onInviteEmailChange,
  onRelationshipTypeChange,
  onShareMyActivityChange,
  onSubmit,
}: FriendInviteFormProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">إضافة شخص</h2>
      <p className="mt-2 text-sm text-slate-500">
        ابعت طلب اتصال بالبريد الإلكتروني لمتابعة المصروفات أو إرسال فلوس بين المحافظ.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => onInviteEmailChange(event.target.value)}
            placeholder="example@email.com"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">نوع العلاقة</span>
          <select
            value={relationshipType}
            onChange={(event) =>
              onRelationshipTypeChange(event.target.value as RelationshipType)
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {relationshipOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 lg:col-span-2">
          <input
            type="checkbox"
            checked={shareMyActivity}
            onChange={(event) => onShareMyActivityChange(event.target.checked)}
          />
          <span className="text-sm text-slate-700">اسمح له بمتابعة ملخص مصروفاتي الشهرية</span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 lg:col-span-2"
        >
          {submitting ? "جاري الإرسال..." : "إرسال طلب اتصال"}
        </button>
      </form>
    </section>
  );
}
