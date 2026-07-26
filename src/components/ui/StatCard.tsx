export default function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </article>
  );
}
