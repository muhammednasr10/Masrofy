-- Internal transfers, savings goals, onboarding, transaction attachments

alter type public.transaction_type add value if not exists 'transfer';

create type public.transfer_role as enum ('out', 'in');

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set onboarding_completed = true
where onboarding_completed = false;

create table public.internal_wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_wallet_id uuid not null references public.wallets (id) on delete restrict,
  to_wallet_id uuid not null references public.wallets (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id)
);

create index internal_wallet_transfers_user_idx
  on public.internal_wallet_transfers (user_id, created_at desc);

alter table public.transactions
  add column if not exists internal_transfer_id uuid
    references public.internal_wallet_transfers (id) on delete set null,
  add column if not exists transfer_role public.transfer_role;

create index transactions_internal_transfer_idx
  on public.transactions (internal_transfer_id);

alter table public.internal_wallet_transfers enable row level security;

create policy "Users can manage own internal transfers"
  on public.internal_wallet_transfers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  icon text not null default '🎯',
  color text not null default '#10b981',
  wallet_id uuid references public.wallets (id) on delete set null,
  notes text,
  is_completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index savings_goals_user_idx
  on public.savings_goals (user_id, sort_order, created_at desc);

alter table public.savings_goals enable row level security;

create policy "Users can manage own savings goals"
  on public.savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.transaction_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index transaction_attachments_transaction_idx
  on public.transaction_attachments (transaction_id);

alter table public.transaction_attachments enable row level security;

create policy "Users can manage own transaction attachments"
  on public.transaction_attachments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transaction-receipts',
  'transaction-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "Users can upload own receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'transaction-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'transaction-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own receipts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'transaction-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.transfer_between_own_wallets(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_amount numeric,
  p_note text default null,
  p_transaction_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_from_wallet public.wallets;
  v_to_wallet public.wallets;
  v_transfer_id uuid;
  v_note text := nullif(trim(p_note), '');
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_from_wallet_id = p_to_wallet_id then
    raise exception 'Cannot transfer to the same wallet';
  end if;

  select * into v_from_wallet
  from public.wallets
  where id = p_from_wallet_id
    and user_id = v_user_id;

  if not found then
    raise exception 'Source wallet not found';
  end if;

  select * into v_to_wallet
  from public.wallets
  where id = p_to_wallet_id
    and user_id = v_user_id;

  if not found then
    raise exception 'Destination wallet not found';
  end if;

  if v_from_wallet.wallet_type = 'investment' or v_to_wallet.wallet_type = 'investment' then
    raise exception 'Cannot transfer to or from investment wallets';
  end if;

  insert into public.internal_wallet_transfers (
    user_id,
    from_wallet_id,
    to_wallet_id,
    amount,
    note,
    transaction_date
  )
  values (
    v_user_id,
    p_from_wallet_id,
    p_to_wallet_id,
    p_amount,
    v_note,
    p_transaction_date
  )
  returning id into v_transfer_id;

  insert into public.transactions (
    user_id,
    wallet_id,
    amount,
    type,
    transfer_role,
    note,
    transaction_date,
    internal_transfer_id
  )
  values
    (
      v_user_id,
      p_from_wallet_id,
      p_amount,
      'transfer',
      'out',
      coalesce(v_note, 'تحويل إلى ' || v_to_wallet.name),
      p_transaction_date,
      v_transfer_id
    ),
    (
      v_user_id,
      p_to_wallet_id,
      p_amount,
      'transfer',
      'in',
      coalesce(v_note, 'تحويل من ' || v_from_wallet.name),
      p_transaction_date,
      v_transfer_id
    );

  return v_transfer_id;
end;
$$;

revoke all on function public.transfer_between_own_wallets(uuid, uuid, numeric, text, date) from public;
grant execute on function public.transfer_between_own_wallets(uuid, uuid, numeric, text, date) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, onboarding_completed)
  values (new.id, new.raw_user_meta_data ->> 'full_name', false);

  return new;
end;
$$;
