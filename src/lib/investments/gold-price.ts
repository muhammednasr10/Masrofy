export const GOLD_KARATS = [18, 21, 24] as const;

export type GoldKarat = (typeof GOLD_KARATS)[number];

export type GoldPriceQuote = {
  unit: string;
  prices: Record<GoldKarat, number>;
  fetchedAt: string | null;
  source: string | null;
};

export function isGoldKarat(value: number): value is GoldKarat {
  return (GOLD_KARATS as readonly number[]).includes(value);
}

export function parseGoldKarat(unitLabel: string | null | undefined): GoldKarat | null {
  if (!unitLabel) {
    return null;
  }

  const match = unitLabel.match(/عيار\s*(18|21|24)/);
  return match ? (Number(match[1]) as GoldKarat) : null;
}

export function goldUnitLabel(karat: GoldKarat) {
  return `عيار ${karat}`;
}

export function goldCostFromGrams(grams: number, pricePerGram: number) {
  if (!Number.isFinite(grams) || !Number.isFinite(pricePerGram) || grams <= 0 || pricePerGram <= 0) {
    return 0;
  }

  return Math.round(grams * pricePerGram * 100) / 100;
}

type NahardaGoldResponse = {
  data?: {
    unit?: string;
    world_derived?: Array<{ karat?: number; value_egp?: number }>;
  };
  meta?: {
    cached_at?: string;
    sources?: Array<{ name?: string }>;
  };
};

export function parseNahardaGoldResponse(payload: NahardaGoldResponse): GoldPriceQuote | null {
  const rows = payload.data?.world_derived ?? [];
  const prices = {} as Record<GoldKarat, number>;

  for (const karat of GOLD_KARATS) {
    const row = rows.find((item) => item.karat === karat);
    const value = Number(row?.value_egp);

    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    prices[karat] = Math.round(value * 100) / 100;
  }

  return {
    unit: payload.data?.unit ?? "EGP per gram",
    prices,
    fetchedAt: payload.meta?.cached_at ?? null,
    source: payload.meta?.sources?.[0]?.name ?? "naharda",
  };
}

export async function fetchLiveGoldPrices(signal?: AbortSignal): Promise<GoldPriceQuote> {
  const response = await fetch("https://api.naharda.com/v1/gold", {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("تعذر جلب سعر الذهب الآن.");
  }

  const payload = (await response.json()) as NahardaGoldResponse;
  const quote = parseNahardaGoldResponse(payload);

  if (!quote) {
    throw new Error("سعر الذهب وصل ناقص.");
  }

  return quote;
}
