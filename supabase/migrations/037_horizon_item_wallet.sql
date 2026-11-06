-- Wallet a plan line is paid from or received into.
-- Safe to run more than once in the Supabase SQL editor.

alter table public.horizon_plan_items
  add column if not exists wallet_id uuid references public.wallets (id) on delete set null;
