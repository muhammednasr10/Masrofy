import { getDependentLink, getRelationshipLabel } from "@/lib/constants/friendship-options";
import type { Friendship } from "@/lib/types/database";

export function getFriendProfile(friendship: Friendship, currentUserId: string) {
  const isRequester = friendship.requester_id === currentUserId;
  const profile = isRequester ? friendship.addressee : friendship.requester;
  const dependent = getDependentLink(friendship, currentUserId);

  return {
    id: dependent.otherUserId,
    name: profile?.full_name ?? profile?.email ?? "مستخدم",
    relationshipLabel: getRelationshipLabel(friendship.relationship_type, isRequester),
    sharesWithMe: isRequester
      ? friendship.addressee_shares_activity
      : friendship.requester_shares_activity,
    otherIsDependent: dependent.otherIsDependent,
    iAmDependent: dependent.iAmDependent,
  };
}
