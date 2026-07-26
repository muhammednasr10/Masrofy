type AccountProfileHeaderProps = {
  initials: string;
  fullName: string;
  email: string;
};

export default function AccountProfileHeader({
  initials,
  fullName,
  email,
}: AccountProfileHeaderProps) {
  return (
    <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-semibold text-white">
          {initials}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{fullName.trim() || "حسابي"}</h2>
          <p className="text-sm text-slate-500">{email}</p>
        </div>
      </div>
    </section>
  );
}
