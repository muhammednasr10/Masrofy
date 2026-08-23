-- Import active default categories for the current user.
-- Exact name match (same parent context) reuses the existing row and syncs icon/color.

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
          color = rec.color
      where c.user_id = v_user_id
        and c.parent_category_id is null
        and c.name = rec.name
        and (c.icon is distinct from rec.icon or c.color is distinct from rec.color);

      get diagnostics v_row_count = row_count;
      v_synced := v_synced + v_row_count;
    else
      insert into public.categories (user_id, name, icon, color, sort_order)
      values (v_user_id, rec.name, rec.icon, rec.color, rec.sort_order);

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
          color = rec.color
      where c.user_id = v_user_id
        and c.parent_category_id = parent_id
        and c.name = rec.name
        and (c.icon is distinct from rec.icon or c.color is distinct from rec.color);

      get diagnostics v_row_count = row_count;
      v_synced := v_synced + v_row_count;
    else
      insert into public.categories (
        user_id,
        name,
        icon,
        color,
        parent_category_id,
        sort_order
      )
      values (
        v_user_id,
        rec.name,
        rec.icon,
        rec.color,
        parent_id,
        rec.sort_order
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
