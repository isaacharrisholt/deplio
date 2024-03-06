/*
 * Add api_version table and team.
 */
create table if not exists public.api_version (
  version date primary key
);
alter table public.api_version enable row level security;

-- Add initial version
insert into public.api_version (version) values ('2024-02-26');

create or replace function public.get_latest_api_version()
returns date
language sql
as $$
  select version from public.api_version order by version desc limit 1;
$$;

alter table team
  add column api_version date not null
    references public.api_version(version)
    default public.get_latest_api_version();
