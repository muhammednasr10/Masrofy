export type SupabaseErrorFields = {
  message: string;
  code: string;
  details: string;
  hint: string;
};

function readErrorField(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function readSupabaseError(error: unknown): SupabaseErrorFields {
  if (!error) {
    return { message: "", code: "", details: "", hint: "" };
  }

  if (typeof error === "string") {
    return { message: error, code: "", details: "", hint: "" };
  }

  if (typeof error === "object") {
    const fields = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    return {
      message: readErrorField(fields.message),
      code: readErrorField(fields.code),
      details: readErrorField(fields.details),
      hint: readErrorField(fields.hint),
    };
  }

  return { message: String(error), code: "", details: "", hint: "" };
}

export function isMissingSupabaseTableError(
  error: { code?: string; message?: string } | null | undefined,
  tableName: string,
) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "PGRST205" ||
    message.includes(`'public.${tableName}'`) ||
    message.includes(`public.${tableName}`) ||
    message.includes(tableName)
  );
}
