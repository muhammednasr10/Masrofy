import type { SupabaseClient } from "@supabase/supabase-js";
import type { FriendActivity, Profile } from "@/lib/types/database";
import type { FriendWallet } from "@/lib/friends/types";

export async function inviteFriendByEmail(
  supabase: SupabaseClient,
  params: {
    currentUserId: string;
    email: string;
    relationshipType: string;
    shareMyActivity: boolean;
  },
) {
  const { data: foundUsers, error: lookupError } = await supabase.rpc("find_user_by_email", {
    search_email: params.email.trim(),
  });

  if (lookupError) {
    return { error: lookupError.message as string };
  }

  const foundUser = (foundUsers as Pick<Profile, "id" | "full_name" | "email">[] | null)?.[0];

  if (!foundUser) {
    return { error: "لم يتم العثور على مستخدم بهذا البريد." };
  }

  const { error: insertError } = await supabase.from("friendships").insert({
    requester_id: params.currentUserId,
    addressee_id: foundUser.id,
    relationship_type: params.relationshipType,
    requester_shares_activity: params.shareMyActivity,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  return {
    message: `تم إرسال طلب اتصال إلى ${foundUser.full_name ?? foundUser.email}.`,
  };
}

export async function respondToFriendRequest(
  supabase: SupabaseClient,
  friendshipId: string,
  status: "accepted" | "declined",
  shareBack = false,
) {
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
    return { error: updateError.message };
  }

  return {
    message: status === "accepted" ? "تم قبول طلب الاتصال." : "تم رفض طلب الاتصال.",
  };
}

export async function loadFriendWallets(supabase: SupabaseClient, friendId: string) {
  const { data, error: walletsError } = await supabase.rpc("get_friend_wallets", {
    p_friend_id: friendId,
  });

  if (walletsError) {
    return { error: walletsError.message };
  }

  const wallets = (data ?? []) as FriendWallet[];
  const defaultWallet = wallets.find((wallet) => wallet.is_default) ?? wallets[0];

  return {
    wallets,
    defaultReceiverWalletId: defaultWallet?.id ?? "",
  };
}

export async function loadFriendActivity(supabase: SupabaseClient, friendId: string) {
  const { data, error: activityError } = await supabase.rpc("get_friend_activity", {
    p_friend_id: friendId,
  });

  if (activityError) {
    return { error: activityError.message };
  }

  return {
    activity: ((data as FriendActivity[] | null) ?? [])[0] ?? null,
  };
}

export async function sendFriendTransfer(
  supabase: SupabaseClient,
  params: {
    senderWalletId: string;
    receiverWalletId: string;
    amount: number;
    note: string | null;
  },
) {
  const { error: transferError } = await supabase.rpc("send_wallet_transfer", {
    p_sender_wallet_id: params.senderWalletId,
    p_receiver_wallet_id: params.receiverWalletId,
    p_amount: params.amount,
    p_note: params.note,
  });

  if (transferError) {
    return { error: transferError.message };
  }

  return { message: "تم إرسال التحويل بنجاح." };
}
