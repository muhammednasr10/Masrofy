import { getRelationshipLabel } from "@/lib/constants/friendship-options";
import type { Friendship } from "@/lib/types/database";

export function getFriendProfile(friendship: Friendship, currentUserId: string) {
  const isRequester = friendship.requester_id === currentUserId;
  const profile = isRequester ? friendship.addressee : friendship.requester;

  return {
    id: isRequester ? friendship.addressee_id : friendship.requester_id,
    name: profile?.full_name ?? profile?.email ?? "مستخدم",
    relationshipLabel: getRelationshipLabel(friendship.relationship_type, isRequester),
    sharesWithMe: isRequester
      ? friendship.addressee_shares_activity
      : friendship.requester_shares_activity,
  };
}
