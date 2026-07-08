-- Faz 7A: Güvenli Üye Davet RPC'si (Yalnızca Pano Sahibi Çağırabilir)
-- Güvenlik Raporu Gereksinimlerini karşılayacak şekilde güncellendi.

-- Eski fonksiyonu temizle
DROP FUNCTION IF EXISTS public.invite_user_to_board(uuid, text, text);

CREATE OR REPLACE FUNCTION public.invite_user_to_board(
  p_board_id uuid,
  p_email text,
  p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' -- Güvenlik için arama yolu temizlendi (schemas explicit)
AS $$
DECLARE
  v_owner_id uuid;
  v_target_user_id uuid;
  v_existing_member_id uuid;
  v_existing_role text;
  v_normalized_email text;
  v_normalized_role text;
BEGIN
  -- 1. Çağıran kullanıcının yetkisini kontrol et
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı oturumu bulunamadı';
  END IF;

  -- 2. Panonun sahibini bul ve kontrol et
  SELECT user_id INTO v_owner_id FROM public.boards WHERE id = p_board_id;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Pano bulunamadı';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Sadece pano sahibi üye davet edebilir';
  END IF;

  -- 3. Rolü normalize et ve doğrula
  v_normalized_role := lower(trim(p_role));
  IF v_normalized_role IS NULL OR v_normalized_role NOT IN ('viewer', 'editor') THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END IF;

  -- 4. E-posta adresini normalize et
  v_normalized_email := lower(trim(p_email));

  -- 5. Hedef kullanıcının e-postasını auth.users tablosunda ara
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = v_normalized_email LIMIT 1;
  
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı';
  END IF;

  -- 6. Sahip kendisini eklemeye mi çalışıyor?
  IF v_target_user_id = v_owner_id THEN
    RAISE EXCEPTION 'Pano sahibi kendisini davet edemez veya yetkisini değiştiremez';
  END IF;

  -- 7. Kullanıcı zaten ekli mi?
  SELECT id, role INTO v_existing_member_id, v_existing_role FROM public.board_members WHERE board_id = p_board_id AND user_email = v_normalized_email;

  IF v_existing_member_id IS NOT NULL THEN
    -- Rolü aynıysa hiçbir şey yapmadan dön
    IF v_existing_role = v_normalized_role THEN
      RETURN true;
    END IF;

    -- Zaten ekliyse rolünü güncelle
    UPDATE public.board_members SET role = v_normalized_role WHERE id = v_existing_member_id;
    
    -- Activity Log: Rol güncelleme
    INSERT INTO public.activity_logs (board_id, user_email, action, entity_type, entity_id, entity_title, metadata)
    VALUES (p_board_id, auth.jwt() ->> 'email', 'updated_member_role', 'member', v_existing_member_id::text, v_normalized_email, jsonb_build_object('new_role', v_normalized_role));
  ELSE
    -- Yeni Kayıt (Unique constraint varsa ve insert anında başka biri eklerse unique violation patlar, bu da iki kayıt eklenmesini engeller)
    INSERT INTO public.board_members (board_id, user_email, role)
    VALUES (p_board_id, v_normalized_email, v_normalized_role)
    RETURNING id INTO v_existing_member_id;

    -- Activity Log: Yeni üye daveti (Aynı transaction içinde)
    INSERT INTO public.activity_logs (board_id, user_email, action, entity_type, entity_id, entity_title, metadata)
    VALUES (p_board_id, auth.jwt() ->> 'email', 'invited_member', 'member', v_existing_member_id::text, v_normalized_email, jsonb_build_object('role', v_normalized_role));
  END IF;

  RETURN true;
END;
$$;

-- Function Execute İzinleri (Güvenlik Önlemleri)
REVOKE ALL ON FUNCTION public.invite_user_to_board(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invite_user_to_board(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.invite_user_to_board(uuid, text, text) TO authenticated;
