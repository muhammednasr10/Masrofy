-- Admin: list pending category suggestions with author profile fields.

create or replace function public.admin_list_pending_category_suggestions()
returns table (
  id uuid,
  user_id uuid,
  category_id uuid,
  name text,
  icon text,
  color text,
  parent_name text,
  status text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz,
  author_name text,
  author_email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.user_id,
    s.category_id,
    s.name,
    s.icon,
    s.color,
    s.parent_name,
    s.status,
    s.reviewed_at,
    s.reviewed_by,
    s.created_at,
    p.full_name as author_name,
    p.email as author_email
  from public.category_suggestions s
  left join public.profiles p on p.id = s.user_id
  where s.status = 'pending'
    and public.is_admin()
  order by s.created_at desc;
$$;

revoke all on function public.admin_list_pending_category_suggestions() from public;
grant execute on function public.admin_list_pending_category_suggestions() to authenticated;
