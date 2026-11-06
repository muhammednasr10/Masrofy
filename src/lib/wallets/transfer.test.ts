import { describe, expect, it } from "vitest";
import { getTransferableWallets, prefillWalletTransferForm } from "@/lib/wallets/transfer";
import { makeWallet } from "@/test/factories";

describe("getTransferableWallets", () => {
  it("excludes investment wallets from transfer pickers", () => {
    const cash = makeWallet({ id: "cash", wallet_type: "cash" });
    const bank = makeWallet({ id: "bank", wallet_type: "bank" });
    const invest = makeWallet({
      id: "invest",
      wallet_type: "investment",
      investment_id: "inv-1",
    });

    expect(getTransferableWallets([cash, bank, invest]).map((wallet) => wallet.id)).toEqual([
      "cash",
      "bank",
    ]);
  });
});

describe("prefillWalletTransferForm", () => {
  it("picks a different destination wallet so the to field is not visually selected with an empty value", () => {
    const form = prefillWalletTransferForm(["anoda", "cash", "cib"], "anoda");

    expect(form.fromWalletId).toBe("anoda");
    expect(form.toWalletId).toBe("cash");
  });
});
