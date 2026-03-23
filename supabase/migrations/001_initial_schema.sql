-- Enable pgvector
create extension if not exists vector;

-- Books table
create table books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  author text,
  total_pages int,
  status text default 'processing', -- processing | ready | failed
  storage_url text,
  created_at timestamptz default now()
);

-- Chapters table
create table chapters (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade,
  num int,
  title text,
  page_start int,
  page_end int,
  summary text,
  difficulty int default 3,
  content text,
  created_at timestamptz default now()
);

-- Concepts table
create table concepts (
  id uuid default gen_random_uuid() primary key,
  chapter_id uuid references chapters(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  name text,
  mastery_state text default 'new', -- new | learning | mastered
  correct_attempts int default 0,
  last_tested timestamptz,
  created_at timestamptz default now()
);

-- Embeddings table (pgvector)
create table embeddings (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade,
  chunk_text text,
  embedding vector(1536),
  page_num int,
  created_at timestamptz default now()
);

-- Curricula table
create table curricula (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  mode text default 'builder', -- builder | researcher | beginner
  timeline_days int default 7,
  plan_json jsonb,
  created_at timestamptz default now()
);

-- Quiz attempts table
create table quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  question_json jsonb,
  selected_index int,
  correct_index int,
  is_correct boolean,
  created_at timestamptz default now()
);

-- Tutor sessions table
create table tutor_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  messages_json jsonb default '[]',
  started_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notes table
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  chapter_id uuid references chapters(id),
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User usage table (for freemium limits)
create table user_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  books_uploaded int default 0,
  tutor_messages_sent int default 0,
  is_paid boolean default false,
  plan text default 'free',
  created_at timestamptz default now()
);

-- RLS: enable row level security on all tables
alter table books enable row level security;
alter table chapters enable row level security;
alter table concepts enable row level security;
alter table embeddings enable row level security;
alter table curricula enable row level security;
alter table quiz_attempts enable row level security;
alter table tutor_sessions enable row level security;
alter table notes enable row level security;
alter table user_usage enable row level security;

-- RLS policies: users can only see their own data
create policy "users see own books" on books for all using (auth.uid() = user_id);
create policy "users see own curricula" on curricula for all using (auth.uid() = user_id);
create policy "users see own attempts" on quiz_attempts for all using (auth.uid() = user_id);
create policy "users see own sessions" on tutor_sessions for all using (auth.uid() = user_id);
create policy "users see own notes" on notes for all using (auth.uid() = user_id);
create policy "users see own usage" on user_usage for all using (auth.uid() = user_id);
create policy "users see chapters of own books" on chapters for all using (
  exists (select 1 from books where books.id = chapters.book_id and books.user_id = auth.uid())
);
create policy "users see concepts of own books" on concepts for all using (
  exists (select 1 from books where books.id = concepts.book_id and books.user_id = auth.uid())
);
create policy "users see embeddings of own books" on embeddings for all using (
  exists (select 1 from books where books.id = embeddings.book_id and books.user_id = auth.uid())
);

-- Create storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('books', 'books', false)
on conflict (id) do nothing;
