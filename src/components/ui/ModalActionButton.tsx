"use client";

type ModalActionButtonProps = {
  onClick: () => void;
  label: string;
  icon: string;
  className: string;
};

export default function ModalActionButton({
  onClick,
  label,
  icon,
  className,
}: ModalActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${className}`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </button>
  );
}
