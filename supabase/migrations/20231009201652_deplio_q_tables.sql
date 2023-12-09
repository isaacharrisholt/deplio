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
    body text,
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
    body text,
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
            and tu.user_id = coalesce(check_user_id, (select user_id()))
    )
$$
;

-- api_key
call rls.create_rls_insert_policy('public', 'api_key', $$
    (
        user_in_team(api_key.team_id)
        and not is_deleted(api_key.deleted_at)
    )
$$)
;

call rls.create_rls_update_policy('public', 'api_key', $$
    (
        user_in_team(api_key.team_id)
        and not is_deleted(api_key.deleted_at)
        and not is_deleted(api_key.revoked_at)
        and not is_deleted(api_key.expires_at)
        and (
            user_is_team_admin(api_key.team_id)
            or api_key.created_by = (select user_id())
        )
    )
$$,
$$
    (
        user_in_team(api_key.team_id)
        and (
            not is_deleted(api_key.deleted_at)
            or user_is_team_admin(api_key.team_id)
        )
        and (
            not is_deleted(api_key.revoked_at)
            or api_key.revoked_by = (select user_id())
        )
        and (
            user_is_team_admin(api_key.team_id)
            or api_key.created_by = (select user_id())
        )
    )
$$)
;

call rls.create_rls_select_policy('public', 'api_key', $$
    (
        user_in_team(api_key.team_id)
        and not is_deleted(api_key.deleted_at)
    )
$$)
;

-- q_request
call rls.create_rls_select_policy('public', 'q_request', $$
    (
        user_in_team(q_request.team_id)
        and not is_deleted(q_request.deleted_at)
    )
$$)
;

-- q_response
call rls.create_rls_select_policy('public', 'q_response', $$
    (
        q_response.request_id = any(select rls.can_read_q_request_using())
        and not is_deleted(q_response.deleted_at)
    )
$$)
;
