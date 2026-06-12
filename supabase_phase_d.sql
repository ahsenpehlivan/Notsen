-- Notsen Faz D: Kart yorumları
-- Supabase SQL Editor'da çalıştırın.

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;

-- Realtime zaten tasks tablosunu dinliyor; yorum güncellemeleri task UPDATE ile senkronize olur.
