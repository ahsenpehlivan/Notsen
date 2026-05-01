-- Notsen: Gelişmiş Pano Yetkilendirme (RBAC) Veritabanı Kurulumu (V4)
-- Lütfen bu kodları Supabase kontrol panelinizdeki "SQL Editor" bölümüne yapıştırıp çalıştırın (Run).

-- 1. board_members Tablosunu Güncelle (Role sütunu ekle)
CREATE TABLE IF NOT EXISTS public.board_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid REFERENCES public.boards(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  role text DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(board_id, user_email)
);

ALTER TABLE public.board_members ADD COLUMN IF NOT EXISTS role text DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor'));
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Mevcut kuralları temizle
DROP POLICY IF EXISTS "Pano sahibi üyeleri yonetebilir" ON public.board_members;
DROP POLICY IF EXISTS "Davetli kullanici uyeligi gorebilir" ON public.board_members;
DROP POLICY IF EXISTS "Uyeler uyeleri gorebilir" ON public.board_members;
DROP POLICY IF EXISTS "Sahip uyeleri yonetebilir" ON public.board_members;
DROP POLICY IF EXISTS "Davetliler paylasilan panoyu gorebilir ve silebilir" ON public.boards;
DROP POLICY IF EXISTS "Davetliler paylasilan panoyu gorebilir" ON public.boards;
DROP POLICY IF EXISTS "Davetliler paylasilan panoyu duzenleyebilir" ON public.boards;
DROP POLICY IF EXISTS "Herkes gorebilir" ON public.boards;
DROP POLICY IF EXISTS "Sadece sahip silebilir ve guncelleyebilir" ON public.boards;
DROP POLICY IF EXISTS "Sadece sahip silebilir" ON public.boards;
DROP POLICY IF EXISTS "Sadece sahip ekleyebilir" ON public.boards;
DROP POLICY IF EXISTS "Davetliler paylasilan panonun sutunlarini gorebilir" ON public.columns;
DROP POLICY IF EXISTS "Davetliler paylasilan panonun gorevlerini gorebilir" ON public.tasks;
DROP POLICY IF EXISTS "Sutun Gorebilir" ON public.columns;
DROP POLICY IF EXISTS "Sutun Ekleyebilir" ON public.columns;
DROP POLICY IF EXISTS "Sutun Guncelleyebilir" ON public.columns;
DROP POLICY IF EXISTS "Sutun Silebilir" ON public.columns;
DROP POLICY IF EXISTS "Gorev Gorebilir" ON public.tasks;
DROP POLICY IF EXISTS "Gorev Ekleyebilir" ON public.tasks;
DROP POLICY IF EXISTS "Gorev Guncelleyebilir" ON public.tasks;
DROP POLICY IF EXISTS "Gorev Silebilir" ON public.tasks;

-- 2. Güvenlik ve Yetki Fonksiyonları (Sonsuz Döngüyü Önler - RLS'i By-pass eder)
CREATE OR REPLACE FUNCTION public.is_board_owner(p_board_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.boards WHERE id = p_board_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_board_editor(p_board_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.board_members WHERE board_id = p_board_id AND user_email = (auth.jwt() ->> 'email') AND role = 'editor');
$$;

CREATE OR REPLACE FUNCTION public.is_board_viewer_or_editor(p_board_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.board_members WHERE board_id = p_board_id AND user_email = (auth.jwt() ->> 'email'));
$$;

-- 3. board_members Kuralları
-- Sahip her şeyi yapabilir, üyeler sadece listeyi görebilir.
CREATE POLICY "Sahip uyeleri yonetebilir" ON public.board_members
  FOR ALL USING (public.is_board_owner(board_id));

CREATE POLICY "Uyeler uyeleri gorebilir" ON public.board_members
  FOR SELECT USING (public.is_board_viewer_or_editor(board_id) OR public.is_board_owner(board_id));

-- 4. boards Kuralları
-- Sahip her şeyi yapabilir, davetliler sadece GÖREBİLİR (Düzenleyemez, silemez)
CREATE POLICY "Sahip her seyi yapar" ON public.boards
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Uyeler sadece gorebilir" ON public.boards
  FOR SELECT USING (public.is_board_viewer_or_editor(id));

-- 5. columns Kuralları
CREATE POLICY "Sutun Gorebilir" ON public.columns
  FOR SELECT USING (public.is_board_owner(board_id) OR public.is_board_viewer_or_editor(board_id));

CREATE POLICY "Sutun Ekleyebilir" ON public.columns
  FOR INSERT WITH CHECK (public.is_board_owner(board_id) OR public.is_board_editor(board_id));

CREATE POLICY "Sutun Guncelleyebilir" ON public.columns
  FOR UPDATE USING (public.is_board_owner(board_id) OR public.is_board_editor(board_id));

CREATE POLICY "Sutun Silebilir" ON public.columns
  FOR DELETE USING (public.is_board_owner(board_id) OR public.is_board_editor(board_id));

-- 6. tasks Kuralları
CREATE POLICY "Gorev Gorebilir" ON public.tasks
  FOR SELECT USING (public.is_board_owner(board_id) OR public.is_board_viewer_or_editor(board_id));

CREATE POLICY "Gorev Ekleyebilir" ON public.tasks
  FOR INSERT WITH CHECK (public.is_board_owner(board_id) OR public.is_board_editor(board_id));

CREATE POLICY "Gorev Guncelleyebilir" ON public.tasks
  FOR UPDATE USING (public.is_board_owner(board_id) OR public.is_board_editor(board_id));

CREATE POLICY "Gorev Silebilir" ON public.tasks
  FOR DELETE USING (public.is_board_owner(board_id) OR public.is_board_editor(board_id));

-- 7. boards tablosuna etiket (labels) sütunu ekle
ALTER TABLE public.boards ADD COLUMN IF NOT EXISTS labels jsonb DEFAULT '["Bug", "Feature", "Tasarım", "Acil", "Ar-Ge"]'::jsonb;
