import { describe, expect, it } from "vitest";
import {
  getWalletTransferErrorMessage,
  validateWalletTransferForm,
} from "@/lib/wallets/transfer-service";
import { emptyWalletTransferForm } from "@/lib/wallets/transfer";

describe("validateWalletTransferForm", () => {
  it("rejects a destination that looks selected but has an empty value", () => {
    expect(
      validateWalletTransferForm({
        ...emptyWalletTransferForm("anoda"),
        amount: "800",
      }),
    ).toBe("اختر المحفظة المصدر والوجهة.");
  });
});

describe("getWalletTransferErrorMessage", () => {
  it("reads the hidden PostgREST object instead of the generic fallback", () => {
    expect(
      getWalletTransferErrorMessage({
        code: "22P02",
        message: 'invalid input syntax for type uuid: ""',
      }),
    ).toBe("بيانات التحويل غير مكتملة. تأكد من اختيار المحفظتين والتاريخ.");
  });

  it("explains a missing transfer RPC", () => {
    expect(
      getWalletTransferErrorMessage({
        code: "PGRST202",
        message:
          "Could not find the function public.transfer_between_own_wallets in the schema cache",
      }),
    ).toBe(
      "دالة التحويل غير موجودة على قاعدة البيانات. طبّق ملف الهجرة 034_ensure_wallet_transfers.sql.",
    );
  });
});
