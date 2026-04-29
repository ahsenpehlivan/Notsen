-- Notsen: Pano Paylaşımı ve Davet Sistemi İçin Veritabanı Kurulumu
-- Lütfen bu kodları Supabase kontrol panelinizdeki "SQL Editor" bölümüne yapıştırıp çalıştırın (Run).

-- 1. board_members Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.board_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(board_id, user_email)
);

-- 2. board_members tablosu için RLS (Row Level Security) aktif et
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- 3. Pano sahibi kendi panosuna üye ekleyebilir, silebilir ve görebilir
CREATE POLICY "Pano sahibi üyeleri yonetebilir" ON public.board_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.user_id = auth.uid()
    )
  );

-- 4. Davet edilen e-posta sahibi üyelik kaydını görebilir
CREATE POLICY "Davetli kullanici uyeligi gorebilir" ON public.board_members
  FOR SELECT
  USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 5. Davet edilen kullanıcılar, panoyu görebilir
CREATE POLICY "Davetliler paylasilan panoyu gorebilir" ON public.boards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = boards.id 
      AND bm.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Davet edilen kullanıcılar, panoyu silebilir veya güncelleyebilir (İsteğe bağlı)
CREATE POLICY "Davetliler paylasilan panoyu duzenleyebilir" ON public.boards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = boards.id 
      AND bm.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 6. Davet edilen kullanıcılar, panodaki sütunları düzenleyebilir
CREATE POLICY "Davetliler paylasilan panonun sutunlarini gorebilir" ON public.columns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = columns.board_id 
      AND bm.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 7. Davet edilen kullanıcılar, panodaki görevleri düzenleyebilir
CREATE POLICY "Davetliler paylasilan panonun gorevlerini gorebilir" ON public.tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = tasks.board_id 
      AND bm.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
