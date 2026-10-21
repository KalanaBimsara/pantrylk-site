-- Pantry LK — admin image uploads.
-- 0001_init.sql already creates the public "site-media" bucket and its policies (anyone can read,
-- only admins — public.is_admin() — can upload, replace or delete). This makes sure the bucket and
-- policies exist even if 0001 was run before storage was set up, and limits uploads to web images.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

-- 10 MB, web image formats only (no SVG: it can carry scripts).
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'site-media';

drop policy if exists "site-media public read" on storage.objects;
drop policy if exists "site-media admin write" on storage.objects;
drop policy if exists "site-media admin update" on storage.objects;
drop policy if exists "site-media admin delete" on storage.objects;

create policy "site-media public read" on storage.objects for select using (bucket_id = 'site-media');
create policy "site-media admin write" on storage.objects for insert with check (bucket_id = 'site-media' and public.is_admin());
create policy "site-media admin update" on storage.objects for update
  using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());
create policy "site-media admin delete" on storage.objects for delete using (bucket_id = 'site-media' and public.is_admin());
