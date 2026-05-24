ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS quiz_hints text[] DEFAULT '{}';
