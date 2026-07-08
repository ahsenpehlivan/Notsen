-- 1. Önce duplicate kayıtları temizle (Eski kaydı tut, yenilerini sil)
DELETE FROM public.board_members
WHERE id IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY board_id, user_email ORDER BY created_at ASC) as rn
        FROM public.board_members
    ) t
    WHERE t.rn > 1
);

-- 2. Ardından Unique Constraint ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'board_members_board_id_user_email_key'
  ) THEN
    ALTER TABLE public.board_members ADD CONSTRAINT board_members_board_id_user_email_key UNIQUE (board_id, user_email);
  END IF;
END $$;
