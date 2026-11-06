"use client";

import WalletSelect from "@/components/wallets/WalletSelect";
import { categoryHasChildren } from "@/lib/categories/hierarchy";
import {
  defaultHorizonEndDate,
  HORIZON_CADENCES,
  isDateKey,
  isOpenEndedDate,
  occurrenceCount,
  type HorizonCadence,
  type HorizonCertainty,
  type HorizonLineDraft,
} from "@/lib/plan/horizon";
import { isHorizonRollupParent } from "@/lib/plan/horizon-rollup";
import { lineDatesReady } from "@/lib/plan/full-plan-rows";
import { formatCurrency } from "@/lib/utils/format";
import type { Category, Wallet } from "@/lib/types/database";

const CADENCE_LABELS: Record<HorizonCadence, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري",
  yearly: "سنوي",
};

const CERTAINTY_LABELS: Record<HorizonCertainty, string> = {
  confirmed: "مؤكد",
  contingent: "محتمل",
};

export default function FullPlanRow({
  category,
  depth,
  line,
  scopedCategories,
  lines,
  currency,
  wallets,
  amountAriaPrefix,
  isOpen,
  onToggleParent,
  onLineChange,
  onSyncParentDates,
}: {
  category: Category;
  depth: number;
  line: HorizonLineDraft;
  scopedCategories: Category[];
  lines: Record<string, HorizonLineDraft>;
  currency: string;
  wallets: Wallet[];
  amountAriaPrefix: string;
  isOpen: boolean;
  onToggleParent: (categoryId: string) => void;
  onLineChange: (categoryId: string, patch: Partial<HorizonLineDraft>) => void;
  onSyncParentDates: (categoryId: string) => void;
}) {
  const isRollup = isHorizonRollupParent(category.id, scopedCategories, lines);
  const ready = lineDatesReady(line);
  const openEnded = isOpenEndedDate(line.endDate);
  const amount = Number(line.amount || 0);
  const repeats =
    ready && !openEnded ? occurrenceCount(line.cadence, line.startDate, line.endDate) : 0;
  const periodAmount =
    !isRollup && ready && amount > 0
      ? amount * repeats
      : isRollup && amount > 0
        ? amount
        : null;
  const hasChildren = categoryHasChildren(category.id, scopedCategories);
  const contingent = line.certainty === "contingent";
  const isRoot = depth === 0;
  const fieldClass = `w-full min-w-0 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm outline-none focus:border-emerald-500 md:px-1 md:py-1.5 md:text-xs sm:text-sm ${
    isRollup ? "bg-white/80 text-slate-600" : "bg-white"
  }`;
  const rowClass = contingent
    ? isRoot
      ? "bg-amber-200"
      : "bg-amber-50"
    : isRoot
      ? "bg-emerald-200"
      : "bg-emerald-50";

  return (
    <tr className={`border-b border-emerald-100/80 last:border-0 ${rowClass}`}>
      <td data-span className="px-2 py-2 text-center align-middle md:text-center">
        <span
          className="inline-flex max-w-full flex-wrap items-center justify-start gap-1 font-medium text-slate-900 md:justify-center"
          style={{ paddingInlineStart: depth > 0 ? `${depth * 0.5}rem` : undefined }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleParent(category.id)}
              aria-expanded={isOpen}
              aria-label={
                isOpen ? `إخفاء فئات ${category.name}` : `عرض فئات ${category.name}`
              }
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            >
              <span className={`inline-block transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
          ) : null}
          <span>{category.icon}</span>
          <span className="truncate">{category.name}</span>
          {isRollup ? (
            <span className="rounded-md bg-slate-200/80 px-1 py-0.5 text-[10px] font-medium text-slate-600">
              مجموع
            </span>
          ) : null}
        </span>
      </td>
      <td data-label="المبلغ" className="px-1 py-2 text-center align-middle">
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={line.amount}
          readOnly={isRollup}
          onChange={(event) => onLineChange(category.id, { amount: event.target.value })}
          placeholder="0"
          aria-label={`${amountAriaPrefix} ${category.name}`}
          className={fieldClass}
        />
      </td>
      <td data-label="التكرار" className="px-1 py-2 text-center align-middle">
        {isRollup ? (
          <span className={`${fieldClass} inline-flex items-center justify-center`}>—</span>
        ) : (
          <select
            value={line.cadence}
            onChange={(event) =>
              onLineChange(category.id, {
                cadence: event.target.value as HorizonCadence,
              })
            }
            aria-label={`تكرار ${category.name}`}
            className={fieldClass}
          >
            {HORIZON_CADENCES.map((cadence) => (
              <option key={cadence} value={cadence}>
                {CADENCE_LABELS[cadence]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td data-label="الحالة" className="px-1 py-2 text-center align-middle">
        {isRollup ? (
          <span className={`${fieldClass} inline-flex items-center justify-center`}>—</span>
        ) : (
          <select
            value={line.certainty ?? "confirmed"}
            onChange={(event) =>
              onLineChange(category.id, {
                certainty: event.target.value as HorizonCertainty,
              })
            }
            aria-label={`حالة ${category.name}`}
            className={`${fieldClass} ${
              contingent ? "border-amber-200 bg-amber-50 text-amber-800" : ""
            }`}
          >
            {(Object.keys(CERTAINTY_LABELS) as HorizonCertainty[]).map((certainty) => (
              <option key={certainty} value={certainty}>
                {CERTAINTY_LABELS[certainty]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td data-label="اليوم" className="px-1 py-2 text-center align-middle">
        {isRollup ? (
          <span className={`${fieldClass} inline-flex items-center justify-center`}>—</span>
        ) : (
          <input
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            value={line.expectedDay ?? ""}
            onChange={(event) =>
              onLineChange(category.id, {
                expectedDay: event.target.value,
              })
            }
            placeholder="—"
            aria-label={`اليوم المتوقع لـ ${category.name}`}
            className={fieldClass}
          />
        )}
      </td>
      <td data-label="المحفظة" className="px-1 py-2 text-center align-middle">
        {isRollup ? (
          <span className={`${fieldClass} inline-flex items-center justify-center`}>—</span>
        ) : (
          <WalletSelect
            wallets={wallets}
            value={line.walletId ?? ""}
            allowEmpty
            emptyLabel="افتراضي"
            onChange={(walletId) => onLineChange(category.id, { walletId })}
            className={fieldClass}
          />
        )}
      </td>
      <td data-label="البداية" className="px-1 py-2 text-center align-middle">
        <input
          type="date"
          value={line.startDate}
          onChange={(event) =>
            onLineChange(category.id, {
              startDate: event.target.value,
              ...(isRollup ? { datesManual: true } : {}),
            })
          }
          aria-label={`بداية ${category.name}`}
          className={fieldClass}
        />
        {isRollup && line.datesManual ? (
          <button
            type="button"
            onClick={() => onSyncParentDates(category.id)}
            className="mt-1 text-[10px] text-emerald-700 hover:underline"
          >
            من الفروع
          </button>
        ) : null}
      </td>
      <td data-label="النهاية" className="px-1 py-2 text-center align-middle">
        <label className="mb-1 flex items-center justify-center gap-1 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={openEnded}
            onChange={(event) =>
              onLineChange(category.id, {
                endDate: event.target.checked
                  ? ""
                  : isDateKey(line.startDate)
                    ? defaultHorizonEndDate(line.startDate)
                    : "",
                ...(isRollup ? { datesManual: true } : {}),
              })
            }
            aria-label={`${category.name} مستمرة`}
          />
          مستمرة
        </label>
        {openEnded ? null : (
          <input
            type="date"
            value={line.endDate}
            min={line.startDate || undefined}
            onChange={(event) =>
              onLineChange(category.id, {
                endDate: event.target.value,
                ...(isRollup ? { datesManual: true } : {}),
              })
            }
            aria-label={`نهاية ${category.name}`}
            className={fieldClass}
          />
        )}
      </td>
      <td
        data-label="إجمالي الفترة"
        className={`px-1 py-2 text-center align-middle text-xs sm:text-sm ${
          contingent ? "text-amber-700" : "text-slate-600"
        }`}
      >
        {isRollup
          ? amount > 0
            ? openEnded
              ? "مستمرة"
              : `${formatCurrency(amount, currency)}`
            : "—"
          : openEnded && amount > 0
            ? "مستمرة"
            : periodAmount != null
              ? `${formatCurrency(periodAmount, currency)}${contingent ? " *" : ""}`
              : ready
                ? "—"
                : "راجع"}
      </td>
    </tr>
  );
}
