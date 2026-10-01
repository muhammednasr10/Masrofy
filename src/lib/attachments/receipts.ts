export const RECEIPT_BUCKET = "transaction-receipts";

export const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf";

export const RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

export function buildReceiptStoragePath(
  userId: string,
  transactionId: string,
  fileName: string,
) {
  const safeName = fileName.replace(/[^\w.\-()+\s]/g, "_").replace(/\.\.+/g, ".");
  return `${userId}/${transactionId}/${Date.now()}-${safeName}`;
}

export function isImageAttachment(mimeType: string) {
  return mimeType.startsWith("image/");
}
