import CategorySearchSelect from "@/components/categories/CategorySearchSelect";
import type { TransactionDraftLine } from "@/lib/expenses/batch-draft";
import type { Category } from "@/lib/types/database";

function FlowArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d={direction === "down" ? "M8 3v10M4.5 9.5 8 13l3.5-3.5" : "M8 13V3M4.5 6.5 8 3l3.5 3.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TransactionDraftLineRow({
  line,
  index,
  categories,
  fieldClass,
  showRemove,
  autoFocus,
  amountRef,
  expenseLabel,
  incomeLabel,
  categoryPlaceholder,
  amountLabel,
  noteLabel,
  notePlaceholder,
  removeLabel,
  onChange,
  onPicked,
  onCreateCategory,
  onAddAfter,
  onRemove,
}: {
  line: TransactionDraftLine;
  index: number;
  categories: Category[];
  fieldClass: string;
  showRemove: boolean;
  autoFocus: boolean;
  amountRef: (node: HTMLInputElement | null) => void;
  expenseLabel: string;
  incomeLabel: string;
  categoryPlaceholder: string;
  amountLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  removeLabel: string;
  onChange: (patch: Partial<TransactionDraftLine>) => void;
  onPicked: () => void;
  onCreateCategory: (name: string) => void;
  onAddAfter: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex shrink-0 rounded-xl bg-white p-0.5">
          <button
            type="button"
            onClick={() => onChange({ type: "expense" })}
            aria-pressed={line.type === "expense"}
            aria-label={expenseLabel}
            title={expenseLabel}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              line.type === "expense"
                ? "bg-red-100 text-red-600"
                : "text-red-300 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <FlowArrow direction="down" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ type: "income" })}
            aria-pressed={line.type === "income"}
            aria-label={incomeLabel}
            title={incomeLabel}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              line.type === "income"
                ? "bg-emerald-100 text-emerald-600"
                : "text-emerald-300 hover:bg-emerald-50 hover:text-emerald-500"
            }`}
          >
            <FlowArrow direction="up" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <CategorySearchSelect
            categories={categories}
            value={line.categoryId}
            onChange={(categoryId) => onChange({ categoryId })}
            onPicked={onPicked}
            autoFocus={autoFocus}
            allowEmpty
            listInFlow
            placeholder={categoryPlaceholder}
            className={fieldClass}
            onCreateNew={onCreateCategory}
          />
        </div>
        <input
          ref={amountRef}
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={line.amount}
          placeholder={amountLabel}
          aria-label={`${amountLabel} ${index + 1}`}
          onChange={(event) => onChange({ amount: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddAfter();
            }
          }}
          className="w-[4.75rem] shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500 sm:w-24 sm:px-3"
        />
        <input
          type="text"
          value={line.note}
          placeholder={notePlaceholder}
          aria-label={noteLabel}
          onChange={(event) => onChange({ note: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddAfter();
            }
          }}
          className="w-[4.75rem] shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500 sm:w-36 sm:px-3"
        />
        {showRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label={removeLabel}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
