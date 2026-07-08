-- Faz 7A: Realtime Publication İdempotent Migration
-- Zaten yayında olan tabloları kontrol eder ve sadece eksik olanları supabase_realtime publication'ına ekler.

DO $$
BEGIN
  -- boards
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'boards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
  END IF;

  -- columns
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'columns') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
  END IF;

  -- tasks
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;

  -- board_members
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'board_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;
  END IF;

  -- activity_logs
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
  END IF;
END $$;
