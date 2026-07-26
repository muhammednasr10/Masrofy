import { getFriendProfile } from "@/lib/friends/display";
import type { Friendship } from "@/lib/types/database";

type FriendsListProps = {
  friendships: Friendship[];
  currentUserId: string;
  selectedFriendId: string;
  onSelectFriend: (friendId: string) => void;
  onViewActivity: (friendId: string) => void;
};

export default function FriendsList({
  friendships,
  currentUserId,
  selectedFriendId,
  onSelectFriend,
  onViewActivity,
}: FriendsListProps) {
  return (
    <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900"> علاقاتي</h3>

      {friendships.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">لسه مفيش علاقات مقبولة.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {friendships.map((friendship) => {
            const friend = getFriendProfile(friendship, currentUserId);
            const isSelected = selectedFriendId === friend.id;

            return (
              <li
                key={friendship.id}
                className={`rounded-2xl border px-4 py-4 ${
                  isSelected ? "border-emerald-300 bg-emerald-50" : "border-slate-100"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{friend.name}</p>
                    <p className="text-sm text-slate-500">{friend.relationshipLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectFriend(friend.id)}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
                    >
                      تحويل فلوس
                    </button>
                    {friend.sharesWithMe ? (
                      <button
                        type="button"
                        onClick={() => onViewActivity(friend.id)}
                        className="rounded-full bg-white px-4 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200"
                      >
                        متابعة المصروفات
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
