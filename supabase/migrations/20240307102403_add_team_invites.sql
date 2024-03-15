/*
 * Add team_invite table
 */
create type public.invite_status as enum ('pending', 'accepted', 'rejected');
create table if not exists team_invite (
  id uuid primary key default tuid6(),
  created_at timestamptz default now(),
  created_by uuid not null references public.user(id),
  deleted_at timestamptz,
  expires_at timestamptz not null,
  team_id uuid not null references team(id),
  email text not null,
  role public.user_role not null,
  used_at timestamp with time zone,
  status public.invite_status not null default 'pending'
);
alter table team_invite enable row level security;

call rls.create_rls_select_policy('public', 'team_invite', $$
  ( -- User is in team
    team_id in (select team_ids())
    and not is_deleted(deleted_at)
  )
  or ( -- User is invitee
    email = (select email from public."user" where id = (select user_id()))
    and not is_deleted(deleted_at)
  )
$$);

call rls.create_rls_insert_policy('public', 'team_invite', $$
  ( -- User is team admin
    (select user_is_team_admin(team_id))
    and deleted_at is null
  )
$$);
