import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildReceiptStoragePath,
  MAX_RECEIPT_SIZE_BYTES,
  RECEIPT_BUCKET,
} from "@/lib/attachments/receipts";
import type { TransactionAttachment } from "@/lib/types/database";

export async function loadSignedAttachmentUrls(
  supabase: SupabaseClient,
  transactionIds: string[],
) {
  if (transactionIds.length === 0) {
    return {};
  }

  const { data: attachmentRows } = await supabase
    .from("transaction_attachments")
    .select("*")
    .in("transaction_id", transactionIds);

  if (!attachmentRows?.length) {
    return {};
  }

  const signedEntries = await Promise.all(
    (attachmentRows as TransactionAttachment[]).map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(attachment.storage_path, 3600);

      return [attachment.transaction_id, signed?.signedUrl ?? ""] as const;
    }),
  );

  return Object.fromEntries(signedEntries.filter(([, url]) => Boolean(url)));
}

export async function uploadTransactionReceipt(
  supabase: SupabaseClient,
  userId: string,
  transactionId: string,
  file: File,
) {
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error("حجم المرفق أكبر من 5 ميجابايت.");
  }

  const storagePath = buildReceiptStoragePath(userId, transactionId, file.name);
  const { error: uploadError } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: attachmentError } = await supabase.from("transaction_attachments").insert({
    user_id: userId,
    transaction_id: transactionId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  });

  if (attachmentError) {
    throw attachmentError;
  }

  const { data: signed } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(storagePath, 3600);

  return signed?.signedUrl ?? null;
}

export async function deleteTransactionAttachments(
  supabase: SupabaseClient,
  transactionId: string,
) {
  const { data: attachmentRows } = await supabase
    .from("transaction_attachments")
    .select("storage_path")
    .eq("transaction_id", transactionId);

  if (attachmentRows?.length) {
    await supabase.storage.from(RECEIPT_BUCKET).remove(
      attachmentRows.map((attachment) => attachment.storage_path),
    );
  }
}
