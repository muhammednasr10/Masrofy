import Link from "next/link";

type MasrofyLogoProps = {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md";
};

export function MasrofyLogo({
  href = "/dashboard",
  showText = true,
  size = "md",
}: MasrofyLogoProps) {
  const iconSize = size === "sm" ? 36 : 44;
  const titleClass = size === "sm" ? "text-base" : "text-lg";

  const content = (
    <div className="flex items-center gap-3">
      <div
        className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm shadow-emerald-200"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden
          className={size === "sm" ? "h-5 w-5" : "h-6 w-6"}
          fill="none"
        >
          <path
            d="M8 12h16a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z"
            stroke="white"
            strokeWidth="2"
          />
          <path
            d="M11 12V10a5 5 0 0 1 10 0v2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="21" cy="19" r="1.5" fill="white" />
        </svg>
      </div>

      {showText ? (
        <div className="leading-tight">
          <p className="text-xs font-medium text-emerald-700">Masrofy</p>
          <p className={`${titleClass} font-semibold text-slate-900`}>مصروفي</p>
        </div>
      ) : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="transition hover:opacity-90">
      {content}
    </Link>
  );
}
