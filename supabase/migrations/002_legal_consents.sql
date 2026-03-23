create table user_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text, 
  accepted_at timestamptz default now(),
  ip_address text, 
  user_agent text,
  policy_version text default 'v1.0',
  privacy_accepted boolean default true,
  terms_accepted boolean default true,
  data_processing_accepted boolean default true
);
alter table user_consents enable row level security;
create policy "users see own consents" on user_consents for all using (auth.uid() = user_id);

alter table user_usage add column if not exists consent_accepted boolean default false;
alter table user_usage add column if not exists consent_accepted_at timestamptz;
