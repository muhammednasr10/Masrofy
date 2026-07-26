import {
  getRelationshipLabel,
  shouldDefaultShareActivity,
} from "@/lib/constants/friendship-options";
import type { Friendship } from "@/lib/types/database";

type IncomingRequestsListProps = {
  requests: Friendship[];
  onRespond: (
    friendshipId: string,
    status: "accepted" | "declined",
    shareBack?: boolean,
  ) => void;
};

export default function IncomingRequestsList({ requests, onRespond }: IncomingRequestsListProps) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">طلبات واردة</h3>
      <ul className="mt-4 space-y-3">
        {requests.map((friendship) => {
          const requester = friendship.requester;
          const defaultShare = shouldDefaultShareActivity(friendship.relationship_type);

          return (
            <li
              key={friendship.id}
              className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {requester?.full_name ?? requester?.email}
                </p>
                <p className="text-sm text-slate-500">
                  {getRelationshipLabel(friendship.relationship_type, false)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRespond(friendship.id, "accepted", defaultShare)}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
                >
                  قبول
                </button>
                <button
                  type="button"
                  onClick={() => onRespond(friendship.id, "declined")}
                  className="rounded-full bg-white px-4 py-2 text-sm text-slate-600"
                >
                  رفض
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
