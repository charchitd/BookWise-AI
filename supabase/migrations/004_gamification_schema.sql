create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  total_learning_minutes int default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Function to increment learning minutes securely
create or replace function increment_learning_minutes(user_uuid uuid, minutes_to_add int)
returns void as $$
begin
  update public.profiles
  set total_learning_minutes = total_learning_minutes + minutes_to_add
  where id = user_uuid;
  
  -- If profile doesn't exist, insert it (upsert pattern)
  if not found then
    insert into public.profiles (id, display_name, total_learning_minutes)
    values (user_uuid, 'Scholar_' || substr(user_uuid::text, 1, 6), minutes_to_add);
  end if;
end;
$$ language plpgsql security definer;
