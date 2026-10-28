-- Private bucket: files live under <user_id>/... and are only reachable by their owner.
create policy "invoice files owner read" on storage.objects for select to authenticated
  using (bucket_id = 'invoice-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "invoice files owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'invoice-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "invoice files owner update" on storage.objects for update to authenticated
  using (bucket_id = 'invoice-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'invoice-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "invoice files owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'invoice-files' and (storage.foldername(name))[1] = auth.uid()::text);
