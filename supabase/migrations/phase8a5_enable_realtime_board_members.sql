-- 1. board_members tablosunu realtime yayınına ekle (Idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'board_members'
  ) then
    alter publication supabase_realtime
    add table public.board_members;
  end if;
end
$$;
