create table if not exists "user" (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    -- Note, we're not creating a foreign key to auth.users.id because
    -- we want to be able to delete a user from auth.users without
    -- deleting their data from public.user.
    user_id uuid not null unique,
    email text not null unique,
    first_name text,
    last_name text,
    avatar_url text
);
alter table "user" enable row level security;


/*
 * RLS Policies
 */
create or replace function is_deleted(ts timestamptz)
returns boolean
language sql
security definer
as $$
    -- Deleted if deleted_at is more than 1s ago
    select extract(epoch from now() - ts) > 1 and ts is not null;
$$
;

-- User
create or replace function can_read_user_using(u "user")
returns boolean
security definer
language sql
as $$
    select ( -- User is self
        auth.uid() = u.user_id
        and not is_deleted(u.deleted_at)
    ) or ( -- TODO: User in same org
        false
    );
$$;

create policy "user: select"
on "user"
for select
to authenticated
using (can_read_user_using("user"));