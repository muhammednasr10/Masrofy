import DependentWalletsList from "@/components/friends/DependentWalletsList";
import {
  canBeDependent,
  relationshipOptions,
} from "@/lib/constants/friendship-options";
import { getFriendProfile } from "@/lib/friends/display";
import type { DependentWallet } from "@/lib/friends/dependent";
import type { Friendship, RelationshipType } from "@/lib/types/database";

type FriendsListProps = {
  friendships: Friendship[];
  currentUserId: string;
  selectedFriendId: string;
  currency: string;
  dependentWallets: DependentWallet[];
  onSelectFriend: (friendId: string) => void;
  onViewActivity: (friendId: string) => void;
  onRelationshipChange: (friendshipId: string, relationshipType: RelationshipType) => void;
  onDependentChange: (friendshipId: string, dependentUserId: string | null) => void;
};

export default function FriendsList({
  friendships,
  currentUserId,
  selectedFriendId,
  currency,
  dependentWallets,
  onSelectFriend,
  onViewActivity,
  onRelationshipChange,
  onDependentChange,
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
            const wallets = dependentWallets.filter((wallet) => wallet.owner_id === friend.id);
            const showDependentChoice = canBeDependent(friendship.relationship_type);

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

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-xs text-slate-500">نوع العلاقة</span>
                    <select
                      value={friendship.relationship_type}
                      onChange={(event) =>
                        onRelationshipChange(friendship.id, event.target.value as RelationshipType)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    >
                      {relationshipOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {showDependentChoice && !friend.iAmDependent ? (
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <input
                        type="checkbox"
                        checked={friend.otherIsDependent}
                        onChange={(event) =>
                          onDependentChange(friendship.id, event.target.checked ? friend.id : null)
                        }
                      />
                      <span className="text-sm text-slate-700">تابعة لي، كل محافظها تظهر عندي</span>
                    </label>
                  ) : null}
                </div>

                {friend.iAmDependent ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <span>محافظك ظاهرة للحساب ده.</span>
                    <button
                      type="button"
                      onClick={() => onDependentChange(friendship.id, null)}
                      className="rounded-full bg-white px-3 py-1 text-xs text-slate-700"
                    >
                      إيقاف الظهور
                    </button>
                  </div>
                ) : null}

                {friend.otherIsDependent ? (
                  <div className="mt-3">
                    {wallets.length > 0 ? (
                      <DependentWalletsList wallets={wallets} currency={currency} />
                    ) : (
                      <p className="text-sm text-slate-500">لسه مفيش محافظ على الحساب ده.</p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
