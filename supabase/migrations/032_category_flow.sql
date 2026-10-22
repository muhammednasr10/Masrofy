-- Distinguish income vs expense categories explicitly.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'category_flow'
  ) then
    create type public.category_flow as enum ('income', 'expense');
  end if;
end;
$$;

alter table public.categories
  add column if not exists flow public.category_flow not null default 'expense';

update public.categories
set flow = 'income'
where flow = 'expense'
  and (
    name = 'إيراد غير معروف'
    or name like 'إيراد%'
  );

alter table public.default_categories
  add column if not exists flow public.category_flow not null default 'expense';

update public.default_categories
set flow = 'income'
where flow = 'expense'
  and (
    name = 'إيراد غير معروف'
    or name like 'إيراد%'
  );

create or replace function public.get_or_create_reconciliation_category(
  p_user_id uuid,
  p_name text,
  p_icon text default '❓'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id uuid;
  v_flow public.category_flow := case
    when p_name = 'إيراد غير معروف' or p_name like 'إيراد%' then 'income'::public.category_flow
    else 'expense'::public.category_flow
  end;
begin
  select id into v_category_id
  from public.categories
  where user_id = p_user_id
    and name = p_name
  limit 1;

  if v_category_id is null then
    insert into public.categories (user_id, name, icon, color, flow)
    values (p_user_id, p_name, p_icon, '#64748b', v_flow)
    returning id into v_category_id;
  else
    update public.categories
    set flow = v_flow
    where id = v_category_id
      and flow is distinct from v_flow;
  end if;

  return v_category_id;
end;
$$;

grant execute on function public.get_or_create_reconciliation_category(uuid, text, text)
  to authenticated;

create or replace function public.import_default_categories()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  rec public.default_categories%rowtype;
  parent_id uuid;
  v_inserted integer := 0;
  v_synced integer := 0;
  v_row_count integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  for rec in
    select *
    from public.default_categories d
    where d.is_active
      and d.parent_name is null
    order by d.sort_order, d.name
  loop
    if exists (
      select 1
      from public.categories c
      where c.user_id = v_user_id
        and c.parent_category_id is null
        and c.name = rec.name
    ) then
      update public.categories c
      set icon = rec.icon,
          color = rec.color,
          flow = rec.flow
      where c.user_id = v_user_id
        and c.parent_category_id is null
        and c.name = rec.name
        and (
          c.icon is distinct from rec.icon
          or c.color is distinct from rec.color
          or c.flow is distinct from rec.flow
        );

      get diagnostics v_row_count = row_count;
      v_synced := v_synced + v_row_count;
    else
      insert into public.categories (user_id, name, icon, color, sort_order, flow)
      values (v_user_id, rec.name, rec.icon, rec.color, rec.sort_order, rec.flow);

      v_inserted := v_inserted + 1;
    end if;
  end loop;

  for rec in
    select *
    from public.default_categories d
    where d.is_active
      and d.parent_name is not null
    order by d.sort_order, d.name
  loop
    select c.id
    into parent_id
    from public.categories c
    where c.user_id = v_user_id
      and c.parent_category_id is null
      and c.name = rec.parent_name
    limit 1;

    if parent_id is null then
      continue;
    end if;

    if exists (
      select 1
      from public.categories c
      where c.user_id = v_user_id
        and c.parent_category_id = parent_id
        and c.name = rec.name
    ) then
      update public.categories c
      set icon = rec.icon,
          color = rec.color,
          flow = rec.flow
      where c.user_id = v_user_id
        and c.parent_category_id = parent_id
        and c.name = rec.name
        and (
          c.icon is distinct from rec.icon
          or c.color is distinct from rec.color
          or c.flow is distinct from rec.flow
        );

      get diagnostics v_row_count = row_count;
      v_synced := v_synced + v_row_count;
    else
      insert into public.categories (
        user_id,
        name,
        icon,
        color,
        parent_category_id,
        sort_order,
        flow
      )
      values (
        v_user_id,
        rec.name,
        rec.icon,
        rec.color,
        parent_id,
        rec.sort_order,
        rec.flow
      );

      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return json_build_object(
    'inserted', v_inserted,
    'synced', v_synced
  );
end;
$$;

revoke all on function public.import_default_categories() from public;
grant execute on function public.import_default_categories() to authenticated;
