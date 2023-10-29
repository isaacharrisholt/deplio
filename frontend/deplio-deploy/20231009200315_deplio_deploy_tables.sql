
-- github_installation
create table if not exists github_installation (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    installation_id bigint not null unique,
    team_id uuid not null references team (id)
);
alter table github_installation enable row level security;

-- project
create table if not exists project (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    created_by uuid not null references "user" (id),
    team_id uuid not null references team (id),
    name text not null,
    description text,
    avatar_url text
);
alter table project enable row level security;

-- repo
create type git_provider as enum ('github');
create table if not exists repo (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    project_id uuid not null references project (id),
    name text not null,
    full_name text not null,
    git_provider git_provider not null,
    provider_repo_id text not null
);
alter table repo enable row level security;

-- deployment
create table if not exists deployment (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    created_by uuid not null references "user" (id),
    repo_id uuid not null references repo (id),
    ref text not null,
    sha text not null,
    environment text not null,
    url text not null,
    status text not null,
    redeployed_from uuid references deployment (id)
);
alter table deployment enable row level security;

/*
 * RLS Policies
 */
-- github_installation
create or replace function can_read_github_installation_using(gi github_installation)
returns boolean
security definer
language sql
as $$
    select ( -- User is in team
        gi.team_id in (select * from public.team_ids())
        and not is_deleted(gi.deleted_at)
    );
$$
;

create or replace function can_update_github_installation_using(gi github_installation)
returns boolean
security definer
language sql
as $$
    select ( -- User is admin of team
        public.user_is_team_admin(gi.team_id)
        and not is_deleted(gi.deleted_at)
    );
$$
;

create or replace function can_update_github_installation_with_check(gi github_installation)
returns boolean
security definer
language sql
as $$
    select ( -- User is admin of team
        public.user_is_team_admin(gi.team_id)
    );
$$
;

create or replace function can_insert_github_installation_with_check(gi github_installation)
returns boolean
security definer
language sql
as $$
    select ( -- User is admin of team
        public.user_is_team_admin(gi.team_id)
        and not is_deleted(gi.deleted_at)
    );
$$
;

create policy "github_installation: select"
on github_installation
for select
to authenticated
using (can_read_github_installation_using(github_installation));

create policy "github_installation: update"
on github_installation
for update
to authenticated
using (can_update_github_installation_using(github_installation))
with check (can_update_github_installation_with_check(github_installation));

create policy "github_installation: insert"
on github_installation
for insert
to authenticated
with check (can_insert_github_installation_with_check(github_installation));

-- project
create or replace function can_read_project_using(p project)
returns boolean
security definer
language sql
as $$
    select ( -- User is in team
        p.team_id in (select * from public.team_ids())
        and not is_deleted(p.deleted_at)
    );
$$
;

create or replace function can_update_project_using(p project)
returns boolean
security definer
language sql
as $$
    select ( -- User is admin of team
        public.user_is_team_admin(p.team_id)
        and not is_deleted(p.deleted_at)
    );
$$
;

create or replace function can_update_project_with_check(p project)
returns boolean
security definer
language sql
as $$
    select ( -- User is admin of team
        public.user_is_team_admin(p.team_id)
    );
$$
;

create or replace function can_insert_project_with_check(p project)
returns boolean
security definer
language sql
as $$
    select ( -- User is admin of team
        public.user_is_team_admin(p.team_id)
        and not is_deleted(p.deleted_at)
    );
$$
;

create policy "project: select"
on project
for select
to authenticated
using (can_read_project_using(project));

create policy "project: update"
on project
for update
to authenticated
using (can_update_project_using(project))
with check (can_update_project_with_check(project));

create policy "project: insert"
on project
for insert
to authenticated
with check (can_insert_project_with_check(project));

-- repo
create or replace function can_read_repo_using(r repo)
returns boolean
security definer
language sql
as $$
    select ( -- Can read project
        can_read_project_using((
            select p
            from public.project as p
            where p.id = r.project_id
        ))
        and not is_deleted(r.deleted_at)
    );
$$
;

create or replace function can_update_repo_using(r repo)
returns boolean
security definer
language sql
as $$
    select ( -- Can update project
        can_update_project_using((
            select p
            from public.project as p
            where p.id = r.project_id
        )))
        and not is_deleted(r.deleted_at);
$$
;

create or replace function can_update_repo_with_check(r repo)
returns boolean
security definer
language sql
as $$
    select ( -- Can update project
        can_update_project_with_check((
            select p
            from public.project as p
            where p.id = r.project_id
        ))
    );
$$
;

create or replace function can_insert_repo_with_check(r repo)
returns boolean
security definer
language sql
as $$
    select ( -- Can update project
        can_update_project_with_check((
            select p
            from public.project as p
            where p.id = r.project_id
        ))
        and not is_deleted(r.deleted_at)
    );
$$
;

create policy "repo: select"
on repo
for select
to authenticated
using (can_read_repo_using(repo));

create policy "repo: update"
on repo
for update
to authenticated
using (can_update_repo_using(repo))
with check (can_update_repo_with_check(repo));

create policy "repo: insert"
on repo
for insert
to authenticated
with check (can_insert_repo_with_check(repo));

-- deployment
create or replace function can_read_deployment_using(d deployment)
returns boolean
security definer
language sql
as $$
    select ( -- Can read repo
        can_read_repo_using((
            select r
            from public.repo as r
            where r.id = d.repo_id
        ))
        and not is_deleted(d.deleted_at)
    );
$$
;

create policy "deployment: select"
on deployment
for select
to authenticated
using (can_read_deployment_using(deployment));