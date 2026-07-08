-- Phase 8B-1: Quick Notes Features with Archive Migration

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'title') then
    alter table public.notes add column title text not null default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'is_pinned') then
    alter table public.notes add column is_pinned boolean not null default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'is_archived') then
    alter table public.notes add column is_archived boolean not null default false;
  end if;

  -- Mevcut 'archived' kolonu varsa verileri 'is_archived' kolonuna aktar
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notes' and column_name = 'archived') then
    update public.notes 
    set is_archived = true 
    where archived = true and is_archived = false;
  end if;
end
$$;
