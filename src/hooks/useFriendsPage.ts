"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  canBeDependent,
  relationshipOptions,
  shouldDefaultShareActivity,
} from "@/lib/constants/friendship-options";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import {
  inviteFriendByEmail,
  loadDependentWallets,
  loadFriendActivity,
  loadFriendsPageData,
  loadFriendWallets,
  respondToFriendRequest,
  sendFriendTransfer,
  updateFriendshipLink,
} from "@/lib/friends";
import type { FriendActivity, Friendship, RelationshipType, Wallet, WalletTransfer } from "@/lib/types/database";
import type { DependentWallet } from "@/lib/friends/dependent";
import type { FriendWallet } from "@/lib/friends/types";

export function useFriendsPage() {
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

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
  const [makeDependent, setMakeDependent] = useState(false);
  const [dependentWallets, setDependentWallets] = useState<DependentWallet[]>([]);

  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [senderWalletId, setSenderWalletId] = useState("");
  const [receiverWalletId, setReceiverWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setShareMyActivity(shouldDefaultShareActivity(relationshipType));
    setMakeDependent(relationshipType === "spouse");
  }, [relationshipType]);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const data = await loadFriendsPageData(supabase);

    if (!data) {
      setLoading(false);
      return;
    }

    setCurrentUserId(data.currentUserId);
    setCurrency(data.currency);
    setMyWallets(data.myWallets);
    setFriendships(data.friendships);
    setTransfers(data.transfers);
    setSenderWalletId(data.defaultSenderWalletId);
    const dependent = await loadDependentWallets(supabase);
    setDependentWallets(dependent.wallets);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    const supabase = createClient();
    const result = await inviteFriendByEmail(supabase, {
      currentUserId,
      email: inviteEmail,
      relationshipType,
      shareMyActivity,
      makeDependent: canBeDependent(relationshipType) && makeDependent,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setInviteEmail("");
    setMessage(result.message ?? "تم إرسال طلب الاتصال.");
    setSubmitting(false);
    await loadData();
  }

  async function handleRespond(
    friendshipId: string,
    status: "accepted" | "declined",
    shareBack = false,
  ) {
    clearFeedback();
    const supabase = createClient();
    const result = await respondToFriendRequest(supabase, friendshipId, status, shareBack);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.message ?? "");
    await loadData();
  }

  async function handleRelationshipChange(friendshipId: string, nextType: RelationshipType) {
    clearFeedback();
    const supabase = createClient();
    const result = await updateFriendshipLink(supabase, friendshipId, {
      relationshipType: nextType,
      ...(canBeDependent(nextType) ? {} : { dependentUserId: null }),
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(result.message ?? "");
    await loadData();
  }

  async function handleDependentChange(friendshipId: string, dependentUserId: string | null) {
    clearFeedback();
    const supabase = createClient();
    const result = await updateFriendshipLink(supabase, friendshipId, { dependentUserId });

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage(dependentUserId ? "الحساب بقى تابع، ومحافظه هتظهر عندك." : "اتوقف ظهور المحافظ.");
    await loadData();
  }

  async function handleSelectFriend(friendId: string) {
    setSelectedFriendId(friendId);
    setFriendActivity(null);
    setFriendWallets([]);
    setReceiverWalletId("");
    clearFeedback();

    const supabase = createClient();
    const result = await loadFriendWallets(supabase, friendId);

    if (result.error) {
      setError(result.error);
      return;
    }

    setFriendWallets(result.wallets ?? []);
    setReceiverWalletId(result.defaultReceiverWalletId ?? "");
  }

  async function handleViewActivity(friendId: string) {
    clearFeedback();
    setFriendActivity(null);

    const supabase = createClient();
    const result = await loadFriendActivity(supabase, friendId);

    if (result.error) {
      setError(result.error);
      return;
    }

    setFriendActivity(result.activity ?? null);
  }

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    clearFeedback();

    const supabase = createClient();
    const result = await sendFriendTransfer(supabase, {
      senderWalletId,
      receiverWalletId,
      amount: Number(transferAmount),
      note: transferNote.trim() || null,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setTransferAmount("");
    setTransferNote("");
    setMessage(result.message ?? "تم إرسال التحويل.");
    setSubmitting(false);
    await loadData();
  }

  return {
    loading,
    submitting,
    error,
    message,
    currency,
    myWallets,
    incomingRequests,
    acceptedFriends,
    friendWallets,
    friendActivity,
    selectedFriendId,
    senderWalletId,
    receiverWalletId,
    transferAmount,
    transferNote,
    inviteEmail,
    relationshipType,
    shareMyActivity,
    makeDependent,
    dependentWallets,
    transfers,
    currentUserId,
    setInviteEmail,
    setRelationshipType,
    setShareMyActivity,
    setMakeDependent,
    setSenderWalletId,
    setReceiverWalletId,
    setTransferAmount,
    setTransferNote,
    handleInvite,
    handleRespond,
    handleRelationshipChange,
    handleDependentChange,
    handleSelectFriend,
    handleViewActivity,
    handleTransfer,
  };
}
