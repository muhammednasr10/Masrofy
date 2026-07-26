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
