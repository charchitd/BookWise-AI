CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  book_title text NOT NULL,
  display_name text NOT NULL,
  top_concepts text[] DEFAULT '{}',
  issued_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own certificates"
  ON public.certificates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "service role can insert certificates"
  ON public.certificates FOR INSERT WITH CHECK (true);
