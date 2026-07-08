CREATE OR REPLACE FUNCTION public.update_board_member_role(
  p_member_id UUID,
  p_role TEXT
) RETURNS void AS $$
DECLARE
  v_board_id UUID;
  v_current_role TEXT;
  v_new_role TEXT;
  v_user_email TEXT;
  v_affected_rows INT;
BEGIN
  v_new_role := lower(trim(p_role));

  -- Validate role
  IF v_new_role IS NULL OR v_new_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END IF;

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

  -- Prevent updating owner role
  IF v_current_role = 'owner' THEN
    RAISE EXCEPTION 'Pano sahibinin rolü değiştirilemez.';
  END IF;

  IF v_current_role = v_new_role THEN
    RETURN; -- No-op
  END IF;

  UPDATE public.board_members
  SET role = v_new_role
  WHERE id = p_member_id;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  IF v_affected_rows != 1 THEN
    RAISE EXCEPTION 'MEMBER_UPDATE_FAILED';
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    board_id, user_email, action, entity_type, entity_id, entity_title, metadata
  ) VALUES (
    v_board_id, auth.jwt() ->> 'email', 'updated_member_role', 'member', p_member_id::text, v_user_email, 
    jsonb_build_object('new_role', v_new_role, 'old_role', v_current_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.update_board_member_role(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_board_member_role(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_board_member_role(UUID, TEXT) TO authenticated;
