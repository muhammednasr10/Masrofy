-- A linked person can be marked dependent so the other account sees every wallet.

alter table public.friendships
  add column if not exists dependent_user_id uuid references auth.users (id) on delete set null;

alter table public.friendships
  drop constraint if exists friendships_dependent_party_check;

alter table public.friendships
  add constraint friendships_dependent_party_check
  check (
    dependent_user_id is null
    or dependent_user_id = requester_id
    or dependent_user_id = addressee_id
  );

create or replace function public.get_dependent_wallets()
returns table (
  id uuid,
  owner_id uuid,
  owner_name text,
  name text,
  icon text,
  color text,
  wallet_type text,
  parent_wallet_id uuid,
  balance numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with visible as (
    select f.dependent_user_id as owner_id
    from public.friendships f
    where f.status = 'accepted'
      and f.dependent_user_id is not null
      and f.dependent_user_id <> auth.uid()
      and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  ),
  nets as (
    select
      t.wallet_id,
      coalesce(sum(
        case
          when t.type = 'income' then t.amount
          when t.type = 'transfer' and t.transfer_role = 'in' then t.amount
          when t.type = 'transfer' then -t.amount
          else -t.amount
        end
      ), 0) as net
    from public.transactions t
    where t.user_id in (select owner_id from visible)
    group by t.wallet_id
  )
  select
    w.id,
    w.user_id,
    coalesce(p.full_name, p.email, 'مستخدم'),
    w.name,
    w.icon,
    w.color,
    w.wallet_type::text,
    w.parent_wallet_id,
    case
      when w.wallet_type = 'investment' then coalesce(i.current_value, w.opening_balance)
      when w.card_kind = 'credit' then w.opening_balance - coalesce(n.net, 0)
      else w.opening_balance + coalesce(n.net, 0)
    end
  from public.wallets w
  join visible v on v.owner_id = w.user_id
  join public.profiles p on p.id = w.user_id
  left join nets n on n.wallet_id = w.id
  left join public.investments i on i.id = w.investment_id
  where auth.uid() is not null
  order by p.full_name, w.parent_wallet_id nulls first, w.sort_order, w.name;
$$;

revoke all on function public.get_dependent_wallets() from public;
grant execute on function public.get_dependent_wallets() to authenticated;
