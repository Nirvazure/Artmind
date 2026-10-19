-- Run in the Supabase SQL Editor before resuming use of the new deployment.
-- Restrictive policies constrain existing permissive policies in this shared project.
-- Other buckets retain their existing policies; service_role continues to bypass RLS.
begin;

drop policy if exists artmind_assets_no_client_insert on storage.objects;
create policy artmind_assets_no_client_insert on storage.objects
  as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'Artmind');

drop policy if exists artmind_assets_no_client_update on storage.objects;
create policy artmind_assets_no_client_update on storage.objects
  as restrictive for update to anon, authenticated
  using (bucket_id <> 'Artmind')
  with check (bucket_id <> 'Artmind');

drop policy if exists artmind_assets_no_client_delete on storage.objects;
create policy artmind_assets_no_client_delete on storage.objects
  as restrictive for delete to anon, authenticated
  using (bucket_id <> 'Artmind');

commit;
