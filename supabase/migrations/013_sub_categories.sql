-- Sub-categories (e.g. associations under a parent category)

alter table public.categories
  add column if not exists parent_category_id uuid references public.categories (id) on delete cascade,
  add column if not exists sort_order integer not null default 0;

alter table public.categories
  drop constraint if exists categories_user_id_name_key;

create unique index if not exists categories_top_level_name_idx
  on public.categories (user_id, name)
  where parent_category_id is null;

create unique index if not exists categories_sub_name_idx
  on public.categories (user_id, parent_category_id, name)
  where parent_category_id is not null;

create index if not exists categories_parent_category_id_idx
  on public.categories (parent_category_id);

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, parent_category_id
      order by name asc
    ) as position
  from public.categories
)
update public.categories c
set sort_order = ranked.position
from ranked
where c.id = ranked.id;

create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
as $$
declare
  parent_row public.categories%rowtype;
begin
  if new.parent_category_id is not null then
    select * into parent_row
    from public.categories
    where id = new.parent_category_id;

    if parent_row.id is null then
      raise exception 'parent category not found';
    end if;

    if parent_row.user_id <> new.user_id then
      raise exception 'parent category must belong to the same user';
    end if;

    if parent_row.parent_category_id is not null then
      raise exception 'sub-categories cannot be nested';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists categories_validate_hierarchy on public.categories;

create trigger categories_validate_hierarchy
  before insert or update on public.categories
  for each row
  execute function public.validate_category_hierarchy();
