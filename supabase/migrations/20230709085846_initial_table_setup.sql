-- user
create table if not exists "user" (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    -- Note, we're not making user_id nullable because
    -- we want to be able to delete a user from auth.users without
    -- deleting their data from public.user.
    user_id uuid unique,
    email text not null unique,
    username text unique nulls not distinct,
    first_name text,
    last_name text,
    avatar_url text
);
alter table "user" enable row level security;

-- team
create type team_type as enum ('personal', 'organization');
create table if not exists team (
    id uuid not null primary key default tuid6(),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    name text not null,
    type team_type not null,
    avatar_url text,
    unique (name, deleted_at) nulls not distinct
);
alter table team enable row level security;

-- team_user join table
create type user_role as enum ('admin', 'member');
create table if not exists team_user (
    id uuid not null default tuid6(),
    team_id uuid not null references team (id),
    user_id uuid not null references "user" (id),
    primary key (id, team_id, user_id),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    role user_role not null default 'member'
);
alter table team_user enable row level security;

/*
 * RLS Policies
 */
-- Helper functions
create or replace function is_deleted(ts timestamptz)
returns boolean
language sql
security definer
as $$
    -- Deleted if deleted_at is more than 1s ago
    select extract(epoch from now() - ts) > 1 and ts is not null;
$$
;

create or replace function user_id()
returns uuid
language sql
security definer
as $$
    select id
    from public."user" as u
    where u.user_id = auth.uid();
$$
;

create or replace function team_ids()
returns setof uuid
language sql
security definer
as $$
    select team_id
    from public.team_user as tu
    where tu.user_id = user_id();
$$
;

create or replace function user_is_team_admin(check_team_id uuid, check_user_id uuid default null)
returns boolean
language sql
security definer
as $$
    select exists(
        select 1
        from public.team_user as tu
        where
            tu.team_id = check_team_id
            and tu.user_id = coalesce(check_user_id, public.user_id())
            and tu.role = 'admin'
    );
$$
;

-- RLS creation functions
create schema if not exists rls;
grant usage
on schema rls
to authenticated
;

create or replace procedure
    rls.create_rls_select_policy(
        schema_name text,
        table_name text,
        using_expression text,
        "column" text default 'id',
        column_type text default 'uuid'
    )
language plpgsql
as $$
declare
  policy_name text;
begin
  -- Create ID return function
  execute format(
    $function$ 
    create or replace function rls.can_read_%s_using()
    returns setof %s
    security definer
    language sql
    as $q$
        select %s
        from %I.%I
        where (%s)
    $q$;
    $function$,
    table_name,
    column_type,
    "column",
    schema_name,
    table_name,
    using_expression
  );

  -- Create policy
  policy_name := format('select: %s.%s', schema_name, table_name);
  execute format(
    'drop policy if exists %I on %I.%I',
    policy_name,
    schema_name,
    table_name
  );
  execute format(
    $policy$
    create policy %I
    on %I.%I
    for select
    to authenticated
    using (%s)
    $policy$,
    policy_name,
    schema_name,
    table_name,
    using_expression
  );
end;
$$
;

create or replace procedure
    rls.create_rls_insert_policy(
        schema_name text,
        table_name text,
        with_check_expression text
    )
language plpgsql
as $$
declare
  policy_name text;
begin
  -- Create policy
  policy_name := format('insert: %s.%s', schema_name, table_name);
  execute format(
    'drop policy if exists %I on %I.%I',
    policy_name,
    schema_name,
    table_name
  );
  execute format(
    $policy$
    create policy %I
    on %I.%I
    for insert
    to authenticated
    with check (%s)
    $policy$,
    policy_name,
    schema_name,
    table_name,
    with_check_expression
  );
end;
$$
;

create or replace procedure
    rls.create_rls_update_policy(
        schema_name text,
        table_name text,
        using_expression text,
        with_check_expression text,
        "column" text default 'id',
        column_type text default 'uuid'
    )
language plpgsql
as $$
declare
  policy_name text;
begin
  -- Create ID return function
  execute format(
    $function$ 
    create or replace function rls.can_update_%s_using()
    returns setof %s
    security definer
    language sql
    as $q$
        select %s
        from %I.%I
        where (%s)
    $q$;
    $function$,
    table_name,
    column_type,
    "column",
    schema_name,
    table_name,
    using_expression
  );

  -- Create policy
  policy_name := format('update: %s.%s', schema_name, table_name);
  execute format(
    'drop policy if exists %I on %I.%I',
    policy_name,
    schema_name,
    table_name
  );
  execute format(
    $policy$
    create policy %I
    on %I.%I
    for update
    to authenticated
    using (%s)
    with check (%s)
    $policy$,
    policy_name,
    schema_name,
    table_name,
    using_expression,
    with_check_expression
  );
end;
$$
;

-- user
call rls.create_rls_select_policy('public', 'user', $$
    ( -- User is self
        (select auth.uid()) = "user".user_id
        and not is_deleted("user".deleted_at)
    ) or ( -- User in same team
        "user".id = any(
            select tu.user_id
            from public.team_user as tu
            where tu.team_id in (select public.team_ids())
                and not is_deleted(tu.deleted_at)
        )
        and not is_deleted("user".deleted_at)
    )
$$)
;

call rls.create_rls_update_policy('public', 'user', $$
    ( -- User is self
        (select auth.uid()) = "user".user_id
        and not is_deleted("user".deleted_at)
    )
$$,
$$
    ( -- User is self
        (select auth.uid()) = "user".user_id
        and not is_deleted("user".deleted_at)
    )
$$)
;

-- team_user
call rls.create_rls_select_policy('public', 'team_user', $$
    ( -- User is self
        (select auth.uid()) = team_user.user_id
        and not is_deleted(team_user.deleted_at)
    ) or ( -- User in same team
        team_user.team_id in (select public.team_ids())
        and not is_deleted(team_user.deleted_at)
    )
$$)
;

call rls.create_rls_update_policy('public', 'team_user', $$
    ( -- User is self
        (select auth.uid()) = team_user.user_id
        and not is_deleted(team_user.deleted_at)
    ) or ( -- User is admin of team
        public.user_is_team_admin(team_user.team_id)
        and not is_deleted(team_user.deleted_at)
    )
$$,
$$
    ( -- User is self
        (select auth.uid()) = team_user.user_id
    ) or ( -- User is admin of team
        public.user_is_team_admin(team_user.team_id)
    )
$$)
;

call rls.create_rls_insert_policy('public', 'team_user', $$
    ( -- User is admin of team
        public.user_is_team_admin(team_user.team_id)
        and not is_deleted(team_user.deleted_at)
    )
$$)
;

-- team
call rls.create_rls_select_policy('public', 'team', $$
    ( -- User is member of team
        team.id in (select public.team_ids())
        and not is_deleted(team.deleted_at)
    )
$$)
;

call rls.create_rls_update_policy('public', 'team', $$
    ( -- User is admin of team
        public.user_is_team_admin(team.id)
        and not is_deleted(team.deleted_at)
    )
$$,
$$
    ( -- User is admin of team
        public.user_is_team_admin(team.id)
    )
$$)
;

call rls.create_rls_insert_policy('public', 'team', $$
    ( -- User is admin of team
        public.user_is_team_admin(team.id)
        and not is_deleted(team.deleted_at)
    )
$$)
;
