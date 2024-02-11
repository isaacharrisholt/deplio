create or replace function public.handle_new_user()
returns trigger
as $$
declare
    first_name text;
    last_name text;
    avatar_url text;
    username text;
    new_user public."user";
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

        username := coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'preferred_username', new.raw_user_meta_data->>'user_name', new.email);

        if new.raw_user_meta_data->>'first_name' is not null then
            first_name := new.raw_user_meta_data->>'first_name';
        end if;

        if new.raw_user_meta_data->>'last_name' is not null then
            last_name := new.raw_user_meta_data->>'last_name';
        end if;
    end if;

    insert into public."user" (user_id, email, username, first_name, last_name, avatar_url)
    values (
        new.id,
        new.email,
        username,
        first_name,
        last_name,
        avatar_url
    ) returning * into new_user;

    insert into public.team (name, type)
    values (
        username,
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
        deleted_at = now(),
        user_id = null
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
