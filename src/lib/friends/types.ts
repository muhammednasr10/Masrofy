import type { Wallet } from "@/lib/types/database";

export type FriendWallet = Pick<Wallet, "id" | "name" | "icon" | "color" | "is_default">;
