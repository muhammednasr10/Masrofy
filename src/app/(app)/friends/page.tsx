"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getRelationshipLabel,
  relationshipOptions,
  shouldDefaultShareActivity,
} from "@/lib/constants/friendship-options";
import type {
  FriendActivity,
  Friendship,
  Profile,
  Wallet,
  WalletTransfer,
} from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import WalletSelect from "@/components/wallets/WalletSelect";

type FriendWallet = Pick<Wallet, "id" | "name" | "icon" | "color" | "is_default">;

export default function FriendsPage() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [myWallets, setMyWallets] = useState<Wallet[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [friendWallets, setFriendWallets] = useState<FriendWallet[]>([]);
  const [friendActivity, setFriendActivity] = useState<FriendActivity | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<(typeof relationshipOptions)[number]["value"]>("friend");
  const [shareMyActivity, setShareMyActivity] = useState(false);

  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [senderWalletId, setSenderWalletId] = useState("");
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setShareMyActivity(shouldDefaultShareActivity(relationshipType));
  }, [relationshipType]);

  async function loadPageData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    const [{ data: profile }, { data: walletRows }, { data: friendshipRows }, { data: transferRows }] =
      await Promise.all([
        supabase.from("profiles").select("currency").maybeSingle(),
        supabase.from("wallets").select("*").order("sort_order", { ascending: true }),
        supabase.from("friendships").select("*").order("updated_at", { ascending: false }),
        supabase
          .from("wallet_transfers")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    const typedFriendships = (friendshipRows ?? []) as Friendship[];
    const typedTransfers = (transferRows ?? []) as WalletTransfer[];
    const userIds = [
      ...new Set(
        [
          ...typedFriendships.flatMap((friendship) => [
            friendship.requester_id,
            friendship.addressee_id,
          ]),
          ...typedTransfers.flatMap((transfer) => [transfer.sender_id, transfer.receiver_id]),
        ].filter(Boolean),
      ),
    ];

    const { data: profileRows } = userIds.length
      ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
      : { data: [] };

    const profileMap = new Map(
      ((profileRows ?? []) as Pick<Profile, "id" | "full_name" | "email">[]).map((item) => [
        item.id,
        item,
      ]),
    );

    setCurrency(profile?.currency ?? "EGP");
    setMyWallets((walletRows ?? []) as Wallet[]);
    setFriendships(
      typedFriendships.map((friendship) => ({
        ...friendship,
        requester: profileMap.get(friendship.requester_id) ?? null,
        addressee: profileMap.get(friendship.addressee_id) ?? null,
      })),
    );
    setTransfers(
      typedTransfers.map((transfer) => ({
        ...transfer,
        sender: profileMap.get(transfer.sender_id) ?? null,
        receiver: profileMap.get(transfer.receiver_id) ?? null,
      })),
    );

    const defaultWallet =
      (walletRows as Wallet[] | null)?.find((wallet) => wallet.is_default) ??
      (walletRows as Wallet[] | null)?.[0];

    if (defaultWallet) {
      setSenderWalletId(defaultWallet.id);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPageData();
  }, []);

  const incomingRequests = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.status === "pending" && friendship.addressee_id === currentUserId,
      ),
    [friendships, currentUserId],
  );

  const acceptedFriends = useMemo(
    () => friendships.filter((friendship) => friendship.status === "accepted"),
    [friendships],
  );

  function getFriendProfile(friendship: Friendship) {
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

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data: foundUsers, error: lookupError } = await supabase.rpc("find_user_by_email", {
      search_email: inviteEmail.trim(),
    });

    if (lookupError) {
      setError(lookupError.message);
      setSubmitting(false);
      return;
    }

    const foundUser = (foundUsers as Pick<Profile, "id" | "full_name" | "email">[] | null)?.[0];

    if (!foundUser) {
      setError("لم يتم العثور على مستخدم بهذا البريد.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      addressee_id: foundUser.id,
      relationship_type: relationshipType,
      requester_shares_activity: shareMyActivity,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setInviteEmail("");
    setMessage(`تم إرسال طلب اتصال إلى ${foundUser.full_name ?? foundUser.email}.`);
    setSubmitting(false);
    await loadPageData();
  }

  async function handleRespond(
    friendshipId: string,
    status: "accepted" | "declined",
    shareBack = false,
  ) {
    const supabase = createClient();
    const updates =
      status === "accepted"
        ? {
            status,
            addressee_shares_activity: shareBack,
            updated_at: new Date().toISOString(),
          }
        : { status, updated_at: new Date().toISOString() };

    const { error: updateError } = await supabase
      .from("friendships")
      .update(updates)
      .eq("id", friendshipId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(status === "accepted" ? "تم قبول طلب الاتصال." : "تم رفض طلب الاتصال.");
    await loadPageData();
  }

  async function handleSelectFriend(friendId: string) {
    setSelectedFriendId(friendId);
    setFriendActivity(null);
    setFriendWallets([]);
    setReceiverWalletId("");
    setError(null);

    const supabase = createClient();
    const { data, error: walletsError } = await supabase.rpc("get_friend_wallets", {
      p_friend_id: friendId,
    });

    if (walletsError) {
      setError(walletsError.message);
      return;
    }

    const wallets = (data ?? []) as FriendWallet[];
    setFriendWallets(wallets);

    const defaultWallet = wallets.find((wallet) => wallet.is_default) ?? wallets[0];
    if (defaultWallet) {
      setReceiverWalletId(defaultWallet.id);
    }
  }

  async function handleViewActivity(friendId: string) {
    setError(null);
    setFriendActivity(null);

    const supabase = createClient();
    const { data, error: activityError } = await supabase.rpc("get_friend_activity", {
      p_friend_id: friendId,
    });

    if (activityError) {
      setError(activityError.message);
      return;
    }

    setFriendActivity(((data as FriendActivity[] | null) ?? [])[0] ?? null);
  }

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: transferError } = await supabase.rpc("send_wallet_transfer", {
      p_sender_wallet_id: senderWalletId,
      p_receiver_wallet_id: receiverWalletId,
      p_amount: Number(transferAmount),
      p_note: transferNote.trim() || null,
    });

    if (transferError) {
      setError(transferError.message);
      setSubmitting(false);
      return;
    }

    setTransferAmount("");
    setTransferNote("");
    setMessage("تم إرسال التحويل بنجاح.");
    setSubmitting(false);
    await loadPageData();
  }

  if (loading) {
    return <p className="text-sm text-slate-500">جاري تحميل العلاقات...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">إضافة شخص</h2>
        <p className="mt-2 text-sm text-slate-500">
          ابعت طلب اتصال بالبريد الإلكتروني لمتابعة المصروفات أو إرسال فلوس بين المحافظ.
        </p>

        <form onSubmit={handleInvite} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">نوع العلاقة</span>
            <select
              value={relationshipType}
              onChange={(event) =>
                setRelationshipType(
                  event.target.value as (typeof relationshipOptions)[number]["value"],
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            >
              {relationshipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 lg:col-span-2">
            <input
              type="checkbox"
              checked={shareMyActivity}
              onChange={(event) => setShareMyActivity(event.target.checked)}
            />
            <span className="text-sm text-slate-700">
              اسمح له بمتابعة ملخص مصروفاتي الشهرية
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60 lg:col-span-2"
          >
            {submitting ? "جاري الإرسال..." : "إرسال طلب اتصال"}
          </button>
        </form>
      </section>

      {incomingRequests.length > 0 ? (
        <section className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">طلبات واردة</h3>
          <ul className="mt-4 space-y-3">
            {incomingRequests.map((friendship) => {
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
                      onClick={() => handleRespond(friendship.id, "accepted", defaultShare)}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
                    >
                      قبول
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(friendship.id, "declined")}
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
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900"> علاقاتي</h3>

          {acceptedFriends.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">لسه مفيش علاقات مقبولة.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {acceptedFriends.map((friendship) => {
                const friend = getFriendProfile(friendship);
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
                          onClick={() => handleSelectFriend(friend.id)}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
                        >
                          تحويل فلوس
                        </button>
                        {friend.sharesWithMe ? (
                          <button
                            type="button"
                            onClick={() => handleViewActivity(friend.id)}
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

        <div className="space-y-6">
          {selectedFriendId ? (
            <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">تحويل مبلغ</h3>
              <form onSubmit={handleTransfer} className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">من محفظتي</span>
                  <WalletSelect
                    wallets={myWallets}
                    value={senderWalletId}
                    onChange={setSenderWalletId}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">إلى محفظة الشخص</span>
                  <select
                    value={receiverWalletId}
                    onChange={(event) => setReceiverWalletId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  >
                    {friendWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.icon} {wallet.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">المبلغ</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">ملاحظة</span>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(event) => setTransferNote(event.target.value)}
                    placeholder="مثال: مصروف الشهر"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting || !receiverWalletId}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? "جاري التحويل..." : "إرسال التحويل"}
                </button>
              </form>
            </section>
          ) : null}

          {friendActivity ? (
            <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">ملخص الشهر</h3>
              <p className="mt-1 text-sm text-slate-500">
                {friendActivity.full_name ?? "مستخدم"} •{" "}
                {getRelationshipLabel(friendActivity.relationship_type, true)}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ActivityCard
                  title="مصروفات"
                  value={formatCurrency(Number(friendActivity.month_expenses), currency)}
                />
                <ActivityCard
                  title="دخل"
                  value={formatCurrency(Number(friendActivity.month_income), currency)}
                />
                <ActivityCard
                  title="عمليات"
                  value={String(friendActivity.month_transactions)}
                />
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-white bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">آخر التحويلات</h3>

        {transfers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">لسه مفيش تحويلات.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {transfers.map((transfer) => {
              const isSender = transfer.sender_id === currentUserId;

              return (
                <li
                  key={transfer.id}
                  className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {isSender ? "أرسلت إلى" : "استلمت من"}{" "}
                      {isSender
                        ? transfer.receiver?.full_name
                        : transfer.sender?.full_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {transfer.sender_wallet_name} → {transfer.receiver_wallet_name}
                      {" • "}
                      {formatDate(transfer.created_at.slice(0, 10))}
                      {transfer.note ? ` • ${transfer.note}` : ""}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      isSender ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {isSender ? "-" : "+"}
                    {formatCurrency(Number(transfer.amount), currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      ) : null}
    </div>
  );
}

function ActivityCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </article>
  );
}
