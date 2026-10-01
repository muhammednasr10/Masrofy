export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export type RelationshipType = "friend" | "spouse" | "child" | "parent" | "sibling";

export const relationshipOptions: Array<{ value: RelationshipType; label: string }> = [
  { value: "friend", label: "صديق" },
  { value: "spouse", label: "زوج / زوجة" },
  { value: "child", label: "ابن / ابنة" },
  { value: "parent", label: "أب / أم" },
  { value: "sibling", label: "أخ / أخت" },
];

export function getRelationshipLabel(
  relationship: RelationshipType,
  isRequester: boolean,
): string {
  const labels: Record<RelationshipType, { self: string; other: string }> = {
    friend: { self: "صديق", other: "صديق" },
    spouse: { self: "زوج/ة", other: "زوج/ة" },
    child: { self: "ابن/ة", other: "ولي أمر" },
    parent: { self: "أب/ أم", other: "ابن/ة" },
    sibling: { self: "أخ/أخت", other: "أخ/أخت" },
  };

  return isRequester ? labels[relationship].self : labels[relationship].other;
}

export function shouldDefaultShareActivity(relationship: RelationshipType): boolean {
  return relationship === "spouse" || relationship === "child" || relationship === "parent";
}

export function canBeDependent(relationship: RelationshipType): boolean {
  return relationship === "spouse" || relationship === "child" || relationship === "parent";
}

export function getDependentLink(friendship: {
  requester_id: string;
  addressee_id: string;
  dependent_user_id: string | null;
}, currentUserId: string) {
  const otherUserId =
    friendship.requester_id === currentUserId ? friendship.addressee_id : friendship.requester_id;

  return {
    otherUserId,
    otherIsDependent: friendship.dependent_user_id === otherUserId,
    iAmDependent: friendship.dependent_user_id === currentUserId,
  };
}
