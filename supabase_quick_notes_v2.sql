-- Hızlı Notlar Tablosuna Yeni Alanların Eklenmesi (V2 Güncellemesi)
-- Bu SQL kodunu Supabase projenizdeki SQL Editor üzerinden çalıştırın.

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS converted_task_id uuid NULL;
