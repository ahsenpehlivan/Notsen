-- Hızlı Notlar (Quick Notes) Tablosu ve Ayarları
-- Bu SQL kodunu Supabase projenizdeki SQL Editor üzerinden çalıştırın.

-- 1. Tabloyu Oluştur
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tags Dizisi İçin GIN İndeksi (Filtreleme performansını artırır)
CREATE INDEX IF NOT EXISTS notes_tags_idx ON public.notes USING GIN (tags);

-- İçerik araması için de isterseniz trigram veya text index eklenebilir ancak şimdilik Supabase ILIKE iş görecektir.

-- 3. Row Level Security (RLS) Etkinleştir
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Politikaları (Kullanıcı SADECE kendi notlarını görebilir, ekleyebilir, silebilir ve güncelleyebilir)

-- Seçme (SELECT) İzni
CREATE POLICY "Kullanicilar sadece kendi notlarini gorebilir"
  ON public.notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Ekleme (INSERT) İzni
CREATE POLICY "Kullanicilar sadece kendi adina not ekleyebilir"
  ON public.notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Güncelleme (UPDATE) İzni
CREATE POLICY "Kullanicilar sadece kendi notlarini guncelleyebilir"
  ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Silme (DELETE) İzni
CREATE POLICY "Kullanicilar sadece kendi notlarini silebilir"
  ON public.notes
  FOR DELETE
  USING (auth.uid() = user_id);
