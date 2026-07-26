import type { SupabaseClient } from "@supabase/supabase-js";
import type { Friendship, Profile, Wallet, WalletTransfer } from "@/lib/types/database";

export type FriendsPageData = {
  currentUserId: string;
  currency: string;
  myWallets: Wallet[];
  friendships: Friendship[];
  transfers: WalletTransfer[];
  defaultSenderWalletId: string;
};

export async function loadFriendsPageData(
  supabase: SupabaseClient,
): Promise<FriendsPageData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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

  const myWallets = (walletRows ?? []) as Wallet[];
  const defaultWallet = myWallets.find((wallet) => wallet.is_default) ?? myWallets[0];

  return {
    currentUserId: user.id,
    currency: profile?.currency ?? "EGP",
    myWallets,
    friendships: typedFriendships.map((friendship) => ({
      ...friendship,
      requester: profileMap.get(friendship.requester_id) ?? null,
      addressee: profileMap.get(friendship.addressee_id) ?? null,
    })),
    transfers: typedTransfers.map((transfer) => ({
      ...transfer,
      sender: profileMap.get(transfer.sender_id) ?? null,
      receiver: profileMap.get(transfer.receiver_id) ?? null,
    })),
    defaultSenderWalletId: defaultWallet?.id ?? "",
  };
}
