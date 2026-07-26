import { describe, expect, it, vi } from "vitest";
import type { Category } from "@/lib/types/database";
import { parsePlannedIncome, persistMonthlyPlan } from "@/lib/plan/persistence";

const categories: Category[] = [
  {
    id: "cat-food",
    user_id: "user-1",
    name: "طعام",
    icon: "🍔",
    color: "#f97316",
    parent_category_id: null,
    sort_order: 1,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

function createSupabaseMock() {
  const savedPlan = {
    id: "plan-1",
    user_id: "user-1",
    plan_month: "2026-07-01",
    planned_income: 5000,
    notes: "July plan",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };

  const monthlyPlansQuery = {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: savedPlan, error: null }),
  };

  const planItemsQuery = {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "user@example.com" } },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "monthly_plans") {
        return monthlyPlansQuery;
      }

      if (table === "plan_items") {
        return planItemsQuery;
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    mocks: {
      monthlyPlansQuery,
      planItemsQuery,
    },
  };
}

describe("parsePlannedIncome", () => {
  it("accepts valid non-negative numbers", () => {
    expect(parsePlannedIncome("5000")).toBe(5000);
    expect(parsePlannedIncome("0")).toBe(0);
  });

  it("rejects invalid values", () => {
    expect(parsePlannedIncome("")).toBe(0);
    expect(parsePlannedIncome("-10")).toBeNull();
    expect(parsePlannedIncome("abc")).toBeNull();
  });
});

describe("persistMonthlyPlan", () => {
  it("upserts the monthly plan and replaces plan items", async () => {
    const supabase = createSupabaseMock();

    const savedPlan = await persistMonthlyPlan(
      supabase as never,
      categories,
      "2026-07-01",
      "5000",
      "July plan",
      { "cat-food": "800" },
    );

    expect(savedPlan.id).toBe("plan-1");
    expect(supabase.from).toHaveBeenCalledWith("monthly_plans");
    expect(supabase.from).toHaveBeenCalledWith("plan_items");
    expect(supabase.mocks.monthlyPlansQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        plan_month: "2026-07-01",
        planned_income: 5000,
        notes: "July plan",
      }),
      { onConflict: "user_id,plan_month" },
    );
    expect(supabase.mocks.planItemsQuery.delete).toHaveBeenCalled();
    expect(supabase.mocks.planItemsQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-1",
        plan_id: "plan-1",
        category_id: "cat-food",
        planned_amount: 800,
      }),
    ]);
  });

  it("throws when planned income is invalid", async () => {
    const supabase = createSupabaseMock();

    await expect(
      persistMonthlyPlan(
        supabase as never,
        categories,
        "2026-07-01",
        "-1",
        "",
        {},
      ),
    ).rejects.toThrow("أدخل دخلًا مخططًا صحيحًا.");
  });
});
