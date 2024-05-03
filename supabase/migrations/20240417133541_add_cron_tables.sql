/*
 * Add tables for cron jobs
 */
create type cron_job_status as enum ('active', 'inactive');
create table if not exists cron_job (
  id uuid not null primary key default tuid6(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  team_id uuid not null references team (id),
  api_key_id uuid not null references api_key (id),
  status cron_job_status not null default 'active',
  executor jsonb not null,
  schedule text not null,
  metadata jsonb
);
alter table cron_job enable row level security;

create type scheduled_job_status as enum ('pending', 'running', 'completed', 'failed');
create table if not exists scheduled_job (
  id uuid not null primary key default tuid6(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  team_id uuid not null references team (id),
  api_key_id uuid not null references api_key (id),
  status scheduled_job_status not null default 'pending',
  executor jsonb not null,
  scheduled_for timestamptz not null,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  metadata jsonb
);
alter table scheduled_job enable row level security;

create table if not exists cron_invocation (
  id uuid not null default tuid6(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  cron_job_id uuid not null references cron_job (id),
  scheduled_job_id uuid not null references scheduled_job (id),
  metadata jsonb,
  primary key (id, cron_job_id, scheduled_job_id)
);
alter table cron_invocation enable row level security;

alter table q_request add column metadata jsonb;

-- cron_job
call rls.create_rls_select_policy('public', 'cron_job', $$
    (
        user_in_team(cron_job.team_id)
        and not is_deleted(cron_job.deleted_at)
    )
$$)
;

-- scheduled_job
call rls.create_rls_select_policy('public', 'scheduled_job', $$
    (
      user_in_team(scheduled_job.team_id)
      and not is_deleted(scheduled_job.deleted_at)
    )
$$)
;

-- cron_invocation
call rls.create_rls_select_policy(
    'public',
    'cron_invocation',
    $$
    (
      cron_invocation.cron_job_id = any(select rls.can_read_cron_job_using())
      and cron_invocation.scheduled_job_id = any(select rls.can_read_scheduled_job_using())
      and not is_deleted(cron_invocation.deleted_at)
    )
$$
)
;
