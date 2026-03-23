-- Enable RLS for storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Policy: Users can view their own uploaded books
create policy "Users can view their own books"
on storage.objects for select
to authenticated
using ( bucket_id = 'books' and auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can upload to their own folder
create policy "Users can upload their own books"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'books' and auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can update their own books (for upsert)
create policy "Users can update their own books"
on storage.objects for update
to authenticated
using ( bucket_id = 'books' and auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can delete their own books
create policy "Users can delete their own books"
on storage.objects for delete
to authenticated
using ( bucket_id = 'books' and auth.uid()::text = (storage.foldername(name))[1] );
