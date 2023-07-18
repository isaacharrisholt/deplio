create or replace function public.handle_new_user()
returns trigger
as $$
declare
    first_name text;
    last_name text;
    avatar_url text;
    new_user public."user";
    team_name text;
    personal_team public.team;
begin
    if new.raw_user_meta_data is not null then
        if new.raw_user_meta_data->>'full_name' is not null then
            first_name := split_part(new.raw_user_meta_data->>'full_name', ' ', 1);
            last_name := split_part(new.raw_user_meta_data->>'full_name', ' ', 2);
        end if;

        if new.raw_user_meta_data->>'avatar_url' is not null then
            avatar_url := new.raw_user_meta_data->>'avatar_url';
        end if;

        if new.raw_user_meta_data->>'first_name' is not null then
            first_name := new.raw_user_meta_data->>'first_name';
        end if;

        if new.raw_user_meta_data->>'last_name' is not null then
            last_name := new.raw_user_meta_data->>'last_name';
        end if;
    end if;

    insert into public."user" (user_id, email, first_name, last_name, avatar_url)
    values (
        new.id,
        new.email,
        first_name,
        last_name,
        avatar_url
    ) returning * into new_user;

    if new_user.first_name is not null and new_user.last_name is not null then
        team_name := new_user.first_name || ' ' || new_user.last_name || '''s Team';
    else
        team_name := new_user.email || '''s Team';
    end if;

    insert into public.team (name, type)
    values (
        team_name,
        'personal'
    ) returning * into personal_team;

    insert into public.team_user (team_id, user_id, role)
    values (
        personal_team.id,
        new_user.id,
        'admin'
    );

    return new;
end;
$$
language plpgsql
security definer
;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


create or replace function public.handle_user_deleted()
returns trigger
as $$
begin
    update public."user"
    set
        deleted_at = now()
    where user_id = old.id;
    return old;
end;
$$
language plpgsql
security definer
;

create trigger on_auth_user_deleted
before delete on auth.users
for each row
execute procedure public.handle_user_deleted();
