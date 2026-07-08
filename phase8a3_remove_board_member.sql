CREATE OR REPLACE FUNCTION public.remove_board_member(
  p_member_id UUID
) RETURNS void AS $$
DECLARE
  v_board_id UUID;
  v_current_role TEXT;
  v_user_email TEXT;
  v_affected_rows INT;
BEGIN
  -- Lock the row and get current state
  SELECT board_id, role, user_email INTO v_board_id, v_current_role, v_user_email
  FROM public.board_members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı.';
  END IF;

  -- Verify caller is the owner
  IF NOT EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = v_board_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Yalnızca pano sahibi üye yönetebilir.';
  END IF;

  -- Prevent removing owner
  IF v_current_role = 'owner' THEN
    RAISE EXCEPTION 'Pano sahibi çıkarılamaz.';
  END IF;

  DELETE FROM public.board_members
  WHERE id = p_member_id;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  IF v_affected_rows != 1 THEN
    RAISE EXCEPTION 'MEMBER_DELETE_FAILED';
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    board_id, user_email, action, entity_type, entity_id, entity_title, metadata
  ) VALUES (
    v_board_id, auth.jwt() ->> 'email', 'removed_member', 'member', p_member_id::text, v_user_email, 
    '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.remove_board_member(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_board_member(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.remove_board_member(UUID) TO authenticated;
