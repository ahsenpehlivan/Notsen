-- Phase 8B-3: Quick Notes soft delete and updated timestamp

ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

CREATE OR REPLACE FUNCTION public.set_notes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notes_set_updated_at ON public.notes;

CREATE TRIGGER trg_notes_set_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.set_notes_updated_at();

CREATE INDEX IF NOT EXISTS idx_notes_active_updated_at
ON public.notes(updated_at DESC)
WHERE deleted_at IS NULL;
