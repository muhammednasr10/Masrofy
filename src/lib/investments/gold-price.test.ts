import { describe, expect, it } from "vitest";
import {
  goldCostFromGrams,
  goldUnitLabel,
  parseGoldKarat,
  parseNahardaGoldResponse,
} from "@/lib/investments/gold-price";

describe("gold price helpers", () => {
  it("parses karat labels and builds the unit text", () => {
    expect(parseGoldKarat("عيار 21")).toBe(21);
    expect(parseGoldKarat("جرام عيار 18")).toBe(18);
    expect(parseGoldKarat("سهم")).toBeNull();
    expect(goldUnitLabel(24)).toBe("عيار 24");
  });

  it("multiplies grams by the gram price", () => {
    expect(goldCostFromGrams(2.5, 6271.45)).toBe(15678.63);
    expect(goldCostFromGrams(0, 6271.45)).toBe(0);
  });

  it("reads karat prices from the Naharda payload", () => {
    const quote = parseNahardaGoldResponse({
      data: {
        unit: "EGP per gram",
        world_derived: [
          { karat: 18, value_egp: 5375.53 },
          { karat: 21, value_egp: 6271.45 },
          { karat: 24, value_egp: 7167.37 },
        ],
      },
      meta: { cached_at: "2026-10-19T10:53:40Z", sources: [{ name: "gold-api.com × FX" }] },
    });

    expect(quote).toEqual({
      unit: "EGP per gram",
      prices: { 18: 5375.53, 21: 6271.45, 24: 7167.37 },
      fetchedAt: "2026-10-19T10:53:40Z",
      source: "gold-api.com × FX",
    });
  });
});
