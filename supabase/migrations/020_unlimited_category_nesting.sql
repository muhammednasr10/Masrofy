-- Allow unlimited category nesting (with cycle protection)

create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_row public.categories%rowtype;
  ancestor_id uuid;
  depth integer := 0;
begin
  if new.parent_category_id is not null then
    if new.parent_category_id = new.id then
      raise exception 'category cannot be its own parent';
    end if;

    select * into parent_row
    from public.categories
    where id = new.parent_category_id;

    if parent_row.id is null then
      raise exception 'parent category not found';
    end if;

    if parent_row.user_id <> new.user_id then
      raise exception 'parent category must belong to the same user';
    end if;

    ancestor_id := parent_row.parent_category_id;

    while ancestor_id is not null and depth < 50 loop
      if ancestor_id = new.id then
        raise exception 'category hierarchy cannot contain cycles';
      end if;

      select parent_category_id into ancestor_id
      from public.categories
      where id = ancestor_id;

      depth := depth + 1;
    end loop;
  end if;

  return new;
end;
$$;
