-- AŞAMA 2: MIGRATION TASARIMI
CREATE TABLE IF NOT EXISTS public.task_comments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    board_id uuid not null references public.boards(id) on delete cascade,
    author_id uuid not null references auth.users(id) on delete cascade,
    author_email text not null,
    content text not null check (trim(content) <> ''),
    created_at timestamptz not null default now(),
    legacy_id text
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id_created_at ON public.task_comments(task_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_task_comments_board_id ON public.task_comments(board_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments(author_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_comments_legacy_id ON public.task_comments(legacy_id) WHERE legacy_id IS NOT NULL;

-- AŞAMA 3: RLS VE REALTIME
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Sadece üyeler (Owner, Editor, Viewer) görebilir
CREATE POLICY "Board members can view task comments" ON public.task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_members bm 
            WHERE bm.board_id = task_comments.board_id AND bm.user_email = auth.jwt()->>'email'
        )
    );

-- Delete Policy:
-- - Yorum sahibi silebilir
-- - VEYA Board Owner silebilir
CREATE POLICY "Users can delete their own comments or Owner can delete any comment" ON public.task_comments
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.board_members bm
            WHERE bm.board_id = task_comments.board_id 
              AND bm.user_email = auth.jwt()->>'email'
              AND bm.role = 'owner'
        )
    );

-- RPC for secure INSERT
CREATE OR REPLACE FUNCTION public.add_task_comment_v1(p_task_id uuid, p_content text)
RETURNS public.task_comments
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_board_id uuid;
    v_role text;
    v_email text;
    v_result public.task_comments;
BEGIN
    -- E-posta al
    v_email := auth.jwt()->>'email';
    IF v_email IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Task'ın board'unu bul
    SELECT board_id INTO v_board_id FROM public.tasks WHERE id = p_task_id;
    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Task not found';
    END IF;

    -- Kullanıcının rolünü bul
    SELECT role INTO v_role FROM public.board_members 
    WHERE board_id = v_board_id AND user_email = v_email;

    -- Editor ve Owner yetki kontrolü
    IF v_role IS NULL OR v_role NOT IN ('editor', 'owner') THEN
        RAISE EXCEPTION 'Permission denied. Only editors and owners can add comments.';
    END IF;

    -- Yorum ekle
    INSERT INTO public.task_comments (task_id, board_id, author_id, author_email, content)
    VALUES (p_task_id, v_board_id, auth.uid(), v_email, trim(p_content))
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- RPC for secure DELETE
CREATE OR REPLACE FUNCTION public.delete_task_comment_v1(p_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_comment public.task_comments;
    v_role text;
    v_email text;
BEGIN
    v_email := auth.jwt()->>'email';
    IF v_email IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Yorumu bul
    SELECT * INTO v_comment FROM public.task_comments WHERE id = p_comment_id;
    IF v_comment IS NULL THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;

    -- Kullanıcının rolünü bul
    SELECT role INTO v_role FROM public.board_members 
    WHERE board_id = v_comment.board_id AND user_email = v_email;

    -- Eğer yorum sahibi DEĞİLSE ve Owner DEĞİLSE hata fırlat
    IF v_comment.author_id <> auth.uid() AND (v_role IS NULL OR v_role <> 'owner') THEN
        RAISE EXCEPTION 'Permission denied. You can only delete your own comments, unless you are the board owner.';
    END IF;

    DELETE FROM public.task_comments WHERE id = p_comment_id;
END;
$$;

-- Realtime yayınına ekle
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_publication 
        WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'task_comments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
        END IF;
    END IF;
END $$;

-- AŞAMA 4: LEGACY JSONB BACKFILL
DO $$
DECLARE
    r record;
    c record;
    v_author_id uuid;
BEGIN
    FOR r IN SELECT id, board_id, comments FROM public.tasks WHERE comments IS NOT NULL AND jsonb_typeof(comments) = 'array' AND jsonb_array_length(comments) > 0 LOOP
        FOR c IN SELECT * FROM jsonb_to_recordset(r.comments) AS x(id text, userEmail text, text text, createdAt text) LOOP
            IF NOT EXISTS (SELECT 1 FROM public.task_comments WHERE legacy_id = c.id) THEN
                SELECT id INTO v_author_id FROM auth.users WHERE email = c.userEmail LIMIT 1;
                
                IF v_author_id IS NOT NULL THEN
                    INSERT INTO public.task_comments (task_id, board_id, author_id, author_email, content, created_at, legacy_id)
                    VALUES (r.id, r.board_id, v_author_id, c.userEmail, trim(c.text), c.createdAt::timestamptz, c.id);
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;
