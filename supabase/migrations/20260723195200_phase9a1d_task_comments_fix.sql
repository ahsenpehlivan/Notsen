-- Phase 9A-1D Fixes as requested

-- 1. Fix RLS SELECT policy
DROP POLICY IF EXISTS "Board members can view task comments" ON public.task_comments;
CREATE POLICY "Board members can view task comments" ON public.task_comments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.boards b WHERE b.id = task_comments.board_id AND b.user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.board_members bm WHERE bm.board_id = task_comments.board_id AND bm.user_email = auth.jwt()->>'email'
    )
);

-- 2. Drop direct mutation policies
DROP POLICY IF EXISTS "Users can delete their own comments or Owner can delete any comment" ON public.task_comments;
-- We do NOT create any INSERT/UPDATE/DELETE policies, so direct table access for these operations is denied for authenticated users.

-- 3. Fix Legacy Index
DROP INDEX IF EXISTS public.idx_task_comments_legacy_id;
CREATE UNIQUE INDEX IF NOT EXISTS uk_task_comments_legacy_id ON public.task_comments(task_id, legacy_id) WHERE legacy_id IS NOT NULL;

-- 4. Fix author_id ON DELETE behavior
ALTER TABLE public.task_comments DROP CONSTRAINT IF EXISTS task_comments_author_id_fkey;
ALTER TABLE public.task_comments ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Fix content validation (max 2000 chars, no empty spaces)
ALTER TABLE public.task_comments DROP CONSTRAINT IF EXISTS task_comments_content_check;
ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_content_check 
    CHECK (char_length(btrim(content)) > 0 AND char_length(btrim(content)) <= 2000);

-- 6. Add_task_comment_v1 RPC (secure, without explicit board_id or author_id inputs)
CREATE OR REPLACE FUNCTION public.add_task_comment_v1(p_task_id uuid, p_content text)
RETURNS public.task_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_board_id uuid;
    v_author_email text;
    v_is_authorized boolean := false;
    v_trimmed_content text;
    v_comment public.task_comments;
BEGIN
    -- Trim content and check length
    v_trimmed_content := btrim(p_content);
    IF char_length(v_trimmed_content) = 0 OR char_length(v_trimmed_content) > 2000 THEN
        RAISE EXCEPTION 'Comment content must be between 1 and 2000 characters';
    END IF;

    -- Get board_id from task
    SELECT board_id INTO v_board_id FROM public.tasks WHERE id = p_task_id;
    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Task not found';
    END IF;

    -- Check authorization: Owner or Editor
    IF EXISTS (SELECT 1 FROM public.boards WHERE id = v_board_id AND user_id = auth.uid()) THEN
        v_is_authorized := true;
    ELSE
        IF EXISTS (SELECT 1 FROM public.board_members WHERE board_id = v_board_id AND user_email = auth.jwt()->>'email' AND role IN ('owner', 'editor')) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Not authorized to add comments to this task';
    END IF;

    -- Get author_email from auth.users via auth.jwt()
    v_author_email := auth.jwt()->>'email';

    -- Insert the comment
    INSERT INTO public.task_comments (task_id, board_id, author_id, author_email, content)
    VALUES (p_task_id, v_board_id, auth.uid(), v_author_email, v_trimmed_content)
    RETURNING * INTO v_comment;

    RETURN v_comment;
END;
$$;

-- 7. Delete_task_comment_v1 RPC
DROP FUNCTION IF EXISTS public.delete_task_comment_v1(uuid);
CREATE OR REPLACE FUNCTION public.delete_task_comment_v1(p_comment_id uuid)
RETURNS public.task_comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_comment public.task_comments;
    v_board_id uuid;
    v_is_authorized boolean := false;
BEGIN
    -- Get comment
    SELECT * INTO v_comment FROM public.task_comments WHERE id = p_comment_id;
    IF v_comment IS NULL THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    v_board_id := v_comment.board_id;

    -- Check authorization
    -- 1. Author can delete their own comment
    IF v_comment.author_id = auth.uid() THEN
        v_is_authorized := true;
    END IF;

    -- 2. Board owner can delete any comment
    IF NOT v_is_authorized THEN
        IF EXISTS (SELECT 1 FROM public.boards WHERE id = v_board_id AND user_id = auth.uid()) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    -- 3. Board member with role 'owner' can delete any comment
    IF NOT v_is_authorized THEN
        IF EXISTS (SELECT 1 FROM public.board_members WHERE board_id = v_board_id AND user_email = auth.jwt()->>'email' AND role = 'owner') THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Not authorized to delete this comment';
    END IF;

    -- Delete and return deleted row
    DELETE FROM public.task_comments WHERE id = p_comment_id;

    RETURN v_comment;
END;
$$;

-- 8. Execution grants
REVOKE EXECUTE ON FUNCTION public.add_task_comment_v1(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_task_comment_v1(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.add_task_comment_v1(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_task_comment_v1(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_task_comment_v1(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_task_comment_v1(uuid) TO authenticated;
