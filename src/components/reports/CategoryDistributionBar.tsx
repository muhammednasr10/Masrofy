type CategoryDistributionBarProps = {
  total: number;
  maxTotal: number;
  color: string;
  trackClassName?: string;
  minWidthPercent?: number;
};

export default function CategoryDistributionBar({
  total,
  maxTotal,
  color,
  trackClassName = "h-2 rounded-full bg-slate-100",
  minWidthPercent = 8,
}: CategoryDistributionBarProps) {
  const widthPercent = Math.max(minWidthPercent, (total / maxTotal) * 100);

  return (
    <div className={trackClassName}>
      <div
        className="h-2 rounded-full"
        style={{ width: `${widthPercent}%`, backgroundColor: color }}
      />
    </div>
  );
}
