-- Faz 6: DND RPC Migration Draft
-- Henüz production'da çalıştırılmamalıdır. (Sadece taslaktır)

CREATE INDEX IF NOT EXISTS idx_tasks_column_position ON public.tasks(column_id, position);

CREATE OR REPLACE FUNCTION public.move_task_v1(
  p_task_id UUID,
  p_expected_source_column_id UUID,
  p_expected_source_position INT,
  p_target_column_id UUID,
  p_target_index INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_board_id UUID;
  v_actual_col_id UUID;
  v_actual_position INT;
  v_task_title TEXT;
  v_target_board_id UUID;
  v_source_col_title TEXT;
  v_target_col_title TEXT;
  v_target_task_count INT;
  v_user_email TEXT;
BEGIN
  v_user_email := auth.jwt()->>'email';

  -- 1. İlk okuma (sadece board_id bulmak için)
  SELECT t.board_id INTO v_board_id FROM public.tasks t WHERE t.id = p_task_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'TASK_NOT_FOUND'; END IF;
  IF v_board_id IS NULL THEN RAISE EXCEPTION 'NULL_BOARD_ID'; END IF;

  -- 2. Concurrency Lock: Board'u kilitliyoruz.
  PERFORM id FROM public.boards WHERE id = v_board_id FOR UPDATE;

  -- 3. Kilit sonrası Task durumunu tekrar oku
  SELECT t.column_id, t.position, t.title 
  INTO v_actual_col_id, v_actual_position, v_task_title 
  FROM public.tasks t WHERE t.id = p_task_id FOR UPDATE;

  -- Null kontrolleri (Schema uyarınca)
  IF v_actual_col_id IS NULL THEN RAISE EXCEPTION 'NULL_COLUMN_ID'; END IF;
  IF v_actual_position IS NULL THEN RAISE EXCEPTION 'NULL_POSITION'; END IF;

  -- 4. Yetki Helper'ları Kullanarak Yetki Kontrolü
  IF NOT (public.is_board_owner(v_board_id) OR public.is_board_editor(v_board_id)) THEN
    RAISE EXCEPTION 'INSUFFICIENT_BOARD_PERMISSION';
  END IF;

  -- 5. Beklenen Değer Doğrulamaları (Expected state vs Actual state)
  IF v_actual_col_id IS DISTINCT FROM p_expected_source_column_id THEN
    RAISE EXCEPTION 'STALE_SOURCE_COLUMN';
  END IF;
  
  IF v_actual_position IS DISTINCT FROM p_expected_source_position THEN
    RAISE EXCEPTION 'STALE_SOURCE_POSITION';
  END IF;

  -- 6. Hedef Sütun (Target Column) Doğrulaması
  SELECT board_id, title INTO v_target_board_id, v_target_col_title 
  FROM public.columns WHERE id = p_target_column_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'TARGET_COLUMN_NOT_FOUND'; END IF;
  IF v_target_board_id IS DISTINCT FROM v_board_id THEN RAISE EXCEPTION 'CROSS_BOARD_MOVE_DENIED'; END IF;

  -- 7. No-Op Kontrolü
  IF p_expected_source_column_id = p_target_column_id AND p_expected_source_position = p_target_index THEN
    RETURN jsonb_build_object('moved', false);
  END IF;

  SELECT title INTO v_source_col_title FROM public.columns WHERE id = p_expected_source_column_id;
  SELECT COUNT(*) INTO v_target_task_count FROM public.tasks WHERE column_id = p_target_column_id;

  IF p_target_index < 0 THEN RAISE EXCEPTION 'NEGATIVE_TARGET_INDEX'; END IF;

  IF p_expected_source_column_id = p_target_column_id THEN
    IF p_target_index >= v_target_task_count THEN RAISE EXCEPTION 'INDEX_OUT_OF_BOUNDS'; END IF;
  ELSE
    IF p_target_index > v_target_task_count THEN RAISE EXCEPTION 'INDEX_OUT_OF_BOUNDS'; END IF;
  END IF;

  -- 8. Unique Constraint Çakışması Yok, Doğrudan Position Shift Uygulanabilir.
  IF p_expected_source_column_id = p_target_column_id THEN
    IF p_target_index > v_actual_position THEN
      UPDATE public.tasks SET position = position - 1 
      WHERE column_id = p_expected_source_column_id AND position > v_actual_position AND position <= p_target_index;
    ELSIF p_target_index < v_actual_position THEN
      UPDATE public.tasks SET position = position + 1 
      WHERE column_id = p_expected_source_column_id AND position >= p_target_index AND position < v_actual_position;
    END IF;
  ELSE
    UPDATE public.tasks SET position = position - 1 WHERE column_id = p_expected_source_column_id AND position > v_actual_position;
    UPDATE public.tasks SET position = position + 1 WHERE column_id = p_target_column_id AND position >= p_target_index;
  END IF;

  -- Görevi hedef konumuna al
  UPDATE public.tasks SET column_id = p_target_column_id, position = p_target_index WHERE id = p_task_id;

  -- 9. Normalizasyon: Boşlukları (Gap) Önlemek İçin 0'dan Başlayan Ardışık Indexle
  IF p_expected_source_column_id != p_target_column_id THEN
    WITH ranked_source AS (
      SELECT id, row_number() OVER (ORDER BY position ASC) - 1 as new_pos
      FROM public.tasks WHERE column_id = p_expected_source_column_id
    )
    UPDATE public.tasks t SET position = r.new_pos 
    FROM ranked_source r WHERE t.id = r.id AND t.position IS DISTINCT FROM r.new_pos;
  END IF;

  WITH ranked_target AS (
    SELECT id, row_number() OVER (ORDER BY position ASC) - 1 as new_pos
    FROM public.tasks WHERE column_id = p_target_column_id
  )
  UPDATE public.tasks t SET position = r.new_pos 
  FROM ranked_target r WHERE t.id = r.id AND t.position IS DISTINCT FROM r.new_pos;

  -- 10. Activity Log
  INSERT INTO public.activity_logs (board_id, user_email, action, entity_type, entity_id, entity_title, metadata)
  VALUES (v_board_id, v_user_email, 'task_moved', 'task', p_task_id, v_task_title, 
    jsonb_build_object('from_column', v_source_col_title, 'to_column', v_target_col_title));

  RETURN jsonb_build_object(
    'moved', true,
    'task_id', p_task_id,
    'board_id', v_board_id,
    'source_column_id', p_expected_source_column_id,
    'source_position', p_expected_source_position,
    'target_column_id', p_target_column_id,
    'target_index', p_target_index
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.move_task_v1(UUID, UUID, INT, UUID, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_task_v1(UUID, UUID, INT, UUID, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.move_task_v1(UUID, UUID, INT, UUID, INT) TO authenticated;
