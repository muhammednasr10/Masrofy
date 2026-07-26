"use client";

export default function ReorderButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
      aria-label={direction === "up" ? "تحريك لأعلى" : "تحريك لأسفل"}
    >
      {direction === "up" ? "↑" : "↓"}
    </button>
  );
}
