type EmptyStateProps = {
  message: string;
  className?: string;
};

export default function EmptyState({ message, className = "mt-4" }: EmptyStateProps) {
  return (
    <p
      className={`${className} rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500`}
    >
      {message}
    </p>
  );
}
