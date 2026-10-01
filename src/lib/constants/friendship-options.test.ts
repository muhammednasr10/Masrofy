import { describe, expect, it } from "vitest";
import { canBeDependent, getDependentLink } from "@/lib/constants/friendship-options";

describe("dependent relationship", () => {
  it("allows a spouse, child, or parent to be marked dependent", () => {
    expect(canBeDependent("spouse")).toBe(true);
    expect(canBeDependent("child")).toBe(true);
    expect(canBeDependent("friend")).toBe(false);
  });

  it("treats the other person as dependent when their id is stored", () => {
    const link = getDependentLink(
      {
        requester_id: "me",
        addressee_id: "wife",
        dependent_user_id: "wife",
      },
      "me",
    );

    expect(link).toEqual({
      otherUserId: "wife",
      otherIsDependent: true,
      iAmDependent: false,
    });
  });
});
