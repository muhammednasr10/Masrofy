export type ParsedImportRow = {
  transaction_date: string;
  amount: number;
  type: "expense" | "income";
  note: string | null;
  categoryName: string | null;
};

export type CsvParseResult = {
  rows: ParsedImportRow[];
  skipped: number;
  errors: string[];
};

function stripBom(content: string) {
  return content.replace(/^\uFEFF/, "");
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], candidates: string[]) {
  const normalized = headers.map(normalizeHeader);

  for (const candidate of candidates) {
    const index = normalized.indexOf(normalizeHeader(candidate));
    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

function parseAmount(value: string) {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    const year =
      slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3].padStart(4, "0");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function parseTypeCell(value: string) {
  const normalized = normalizeHeader(value);

  if (
    ["expense", "مصروف", "debit", "withdrawal", "مدين", "سحب", "withdraw"].includes(normalized)
  ) {
    return "expense" as const;
  }

  if (["income", "دخل", "credit", "deposit", "دائن", "إيداع"].includes(normalized)) {
    return "income" as const;
  }

  return null;
}

function parseMasrofyRow(cells: string[], indexes: Record<string, number>) {
  const date = parseDate(cells[indexes.date] ?? "");
  const amount = parseAmount(cells[indexes.amount] ?? "");

  if (!date || amount == null || amount <= 0) {
    return null;
  }

  const type = parseTypeCell(cells[indexes.type] ?? "") ?? "expense";
  const note = (cells[indexes.note] ?? "").trim() || null;
  const categoryName = (cells[indexes.category] ?? "").trim() || null;

  return {
    transaction_date: date,
    amount,
    type,
    note,
    categoryName,
  } satisfies ParsedImportRow;
}

function parseBankRow(
  cells: string[],
  indexes: {
    date: number;
    description: number;
    debit: number;
    credit: number;
    amount: number;
    type: number;
  },
) {
  const date = parseDate(cells[indexes.date] ?? "");
  if (!date) {
    return null;
  }

  const description =
    indexes.description >= 0 ? (cells[indexes.description] ?? "").trim() || null : null;
  const explicitType = indexes.type >= 0 ? parseTypeCell(cells[indexes.type] ?? "") : null;

  if (indexes.debit >= 0 || indexes.credit >= 0) {
    const debit = indexes.debit >= 0 ? parseAmount(cells[indexes.debit] ?? "") : null;
    const credit = indexes.credit >= 0 ? parseAmount(cells[indexes.credit] ?? "") : null;

    if (debit != null && debit > 0) {
      return {
        transaction_date: date,
        amount: debit,
        type: explicitType ?? "expense",
        note: description,
        categoryName: null,
      } satisfies ParsedImportRow;
    }

    if (credit != null && credit > 0) {
      return {
        transaction_date: date,
        amount: credit,
        type: explicitType ?? "income",
        note: description,
        categoryName: null,
      } satisfies ParsedImportRow;
    }

    return null;
  }

  if (indexes.amount >= 0) {
    const amount = parseAmount(cells[indexes.amount] ?? "");
    if (amount == null || amount === 0) {
      return null;
    }

    return {
      transaction_date: date,
      amount: Math.abs(amount),
      type: explicitType ?? (amount < 0 ? "expense" : "income"),
      note: description,
      categoryName: null,
    } satisfies ParsedImportRow;
  }

  return null;
}

export function parseTransactionsCsv(content: string): CsvParseResult {
  const lines = stripBom(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], skipped: 0, errors: ["importEmptyFile"] };
  }

  const headers = parseCsvLine(lines[0]);
  const dataLines = lines.slice(1);
  const rows: ParsedImportRow[] = [];
  let skipped = 0;
  const errors: string[] = [];

  const masrofyIndexes = {
    date: findColumnIndex(headers, ["التاريخ", "date", "transaction date", "تاريخ"]),
    type: findColumnIndex(headers, ["النوع", "type"]),
    category: findColumnIndex(headers, ["الفئة", "category"]),
    note: findColumnIndex(headers, ["ملاحظة", "note", "description", "details", "الوصف", "البيان"]),
    amount: findColumnIndex(headers, ["المبلغ", "amount"]),
  };

  const isMasrofyFormat =
    masrofyIndexes.date >= 0 && masrofyIndexes.amount >= 0 && masrofyIndexes.type >= 0;

  const bankIndexes = {
    date: findColumnIndex(headers, ["التاريخ", "date", "transaction date", "posting date", "تاريخ"]),
    description: findColumnIndex(headers, [
      "الوصف",
      "description",
      "details",
      "narrative",
      "البيان",
      "ملاحظة",
      "note",
      "memo",
    ]),
    debit: findColumnIndex(headers, ["debit", "withdrawal", "مدين", "سحب", "withdraw"]),
    credit: findColumnIndex(headers, ["credit", "deposit", "دائن", "إيداع"]),
    amount: findColumnIndex(headers, ["amount", "المبلغ", "value"]),
    type: findColumnIndex(headers, ["type", "النوع"]),
  };

  for (const line of dataLines) {
    const cells = parseCsvLine(line);

    const parsed = isMasrofyFormat
      ? parseMasrofyRow(cells, masrofyIndexes)
      : parseBankRow(cells, bankIndexes);

    if (!parsed) {
      skipped += 1;
      continue;
    }

    rows.push(parsed);
  }

  if (rows.length === 0) {
    errors.push("importNoValidRows");
  }

  return { rows, skipped, errors };
}
