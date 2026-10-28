-- Invitation photos.
-- The bucket is public: guests load photos by URL, and the URL is unguessable because every file
-- has a random name. Nobody can list the bucket except the owner listing their own folder.
-- Layout: invitation-photos/<owner user id>/<random name>.<jpg|jpeg|png|webp>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-photos',
  'invitation-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads must go into the uploader's own folder and use a random name (22 to 64 URL-safe
-- characters, e.g. a UUID or base64url of 16+ random bytes).
create policy "Couples upload photos into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invitation-photos'
    and name ~ ('^' || (select auth.uid())::text || '/[A-Za-z0-9_-]{22,64}\.(jpg|jpeg|png|webp)$')
  );

create policy "Couples see photos in their own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invitation-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Couples replace photos in their own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'invitation-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'invitation-photos'
    and name ~ ('^' || (select auth.uid())::text || '/[A-Za-z0-9_-]{22,64}\.(jpg|jpeg|png|webp)$')
  );

create policy "Couples delete photos in their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'invitation-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
