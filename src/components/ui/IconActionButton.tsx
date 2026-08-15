"use client";

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  amber: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  slate: "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
  red: "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600",
} as const;

export type IconActionTone = keyof typeof toneClasses;

export default function IconActionButton({
  icon,
  label,
  onClick,
  tone = "slate",
  disabled = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: IconActionTone;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition disabled:pointer-events-none disabled:opacity-40 ${toneClasses[tone]}`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
