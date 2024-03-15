/*
 * Add avatars storage bucket
 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, '{"image/*"}'::text[]);

call rls.create_rls_select_policy('storage', 'objects', $$ bucket_id = 'avatars' $$);

call rls.create_rls_insert_policy('storage', 'objects', $$
  (
    bucket_id = 'avatars'
    and (
      (
        (storage.foldername(name))[1] = 'user'
        and (storage.foldername(name))[2] = (select user_id()::text)
      )
      or (
        (storage.foldername(name))[1] = 'team'
        and user_is_team_admin(((storage.foldername(name))[2])::uuid, (select user_id()))
      )
    )
  )
$$);

call rls.create_rls_update_policy('storage', 'objects', $$
  (
    bucket_id = 'avatars'
    and (
      (
        (storage.foldername(name))[1] = 'user'
        and (storage.foldername(name))[2] = (select user_id()::text)
      )
      or (
        (storage.foldername(name))[1] = 'team'
        and user_is_team_admin(((storage.foldername(name))[2])::uuid, (select user_id()))
      )
    )
  )
$$, $$ true $$);
