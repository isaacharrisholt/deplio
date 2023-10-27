create table if not exists api_key (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    revoked_at timestamptz,
    deleted_at timestamptz,
    expires_at timestamptz,
    team_id uuid not null references team (id),
    created_by uuid not null references "user" (id),
    revoked_by uuid references "user" (id),
    key_hash text not null unique,
    key_prefix varchar(6) not null,
    name text not null,
    unique nulls not distinct (team_id, name, deleted_at)
);
alter table api_key enable row level security;

create table if not exists q_request (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    team_id uuid not null references team (id),
    api_key_id uuid not null references api_key (id),
    destination text not null,
    method text not null,
    body jsonb,
    headers jsonb,
    query_params jsonb
);
alter table q_request enable row level security;

create table if not exists q_response (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    request_id uuid not null references q_request (id),
    status_code integer,
    body jsonb,
    headers jsonb,
    response_time_ns integer
);
alter table q_response enable row level security;

/*
 * RLS
 */

create or replace function user_in_team(check_team_id uuid, check_user_id uuid default null)
returns boolean
language sql
security definer
as $$
    select exists(
        select 1
        from public.team_user as tu
        where tu.team_id = check_team_id
            and tu.user_id = coalesce(check_user_id, user_id())
    )
$$
;

-- api_key
create or replace function can_insert_api_key_with_check(ak api_key)
returns boolean
language sql
security definer
as $$
    select (
        user_in_team(ak.team_id)
        and not is_deleted(ak.deleted_at)
    )
$$
;

create or replace function can_update_api_key_using(ak api_key)
returns boolean
language sql
security definer
as $$
    select (
        user_in_team(ak.team_id)
        and not is_deleted(ak.deleted_at)
        and not is_deleted(ak.revoked_at)
        and not is_deleted(ak.expires_at)
        and (
            user_is_team_admin(ak.team_id)
            or ak.created_by = user_id()
        )
    )
$$
;

create or replace function can_update_api_key_with_check(ak api_key)
returns boolean
language sql
security definer
as $$
    select (
        user_in_team(ak.team_id)
        and (
            not is_deleted(ak.deleted_at)
            or user_is_team_admin(ak.team_id)
        )
        and (
            not is_deleted(ak.revoked_at)
            or ak.revoked_by = user_id()
        )
        and (
            user_is_team_admin(ak.team_id)
            or ak.created_by = user_id()
        )
    )
$$
;

create or replace function can_read_api_key_using(ak api_key)
returns boolean
language sql
security definer
as $$
    select (
        user_in_team(ak.team_id)
        and not is_deleted(ak.deleted_at)
    )
$$
;

create policy "api_key: select"
on api_key
for select
to authenticated
using (can_read_api_key_using(api_key));

create policy "api_key: update"
on api_key
for update
to authenticated
using (can_update_api_key_using(api_key))
with check (can_update_api_key_with_check(api_key));

create policy "api_key: insert"
on api_key
for insert
to authenticated
with check (can_insert_api_key_with_check(api_key));

-- q_request
create or replace function can_read_q_request_using(qr q_request)
returns boolean
language sql
security definer
as $$
    select (
        user_in_team(qr.team_id)
        and not is_deleted(qr.deleted_at)
    )
$$
;

create policy "q_request: select"
on q_request
for select
to authenticated
using (can_read_q_request_using(q_request));

-- q_response
create or replace function can_read_q_response_using(qr q_response)
returns boolean
language sql
security definer
as $$
    select (
        can_read_q_request_using((
            select q_req
            from q_request as q_req
            where q_req.id = qr.request_id
        ))
        and not is_deleted(qr.deleted_at)
    )
$$
;

create policy "q_response: select"
on q_response
for select
to authenticated
using (can_read_q_response_using(q_response));
