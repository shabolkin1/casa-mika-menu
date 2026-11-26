-- Casa Mika admin: menu edits and photos by the manager, with a separate manager PIN.
-- Run once in Supabase -> SQL Editor after supabase.sql. Safe to run again.

alter table public.staff_settings add column if not exists admin_hash text;

create table if not exists public.menu_overrides (
  id text primary key check (char_length(id) between 1 and 80),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 12000),
  updated_at timestamptz not null default now()
);
create table if not exists public.menu_photos (
  id text primary key check (char_length(id) between 1 and 80),
  thumb text not null check (char_length(thumb) < 60000),
  full_img text not null check (char_length(full_img) < 500000),
  updated_at timestamptz not null default now()
);
alter table public.menu_overrides enable row level security;
alter table public.menu_photos enable row level security;
grant select on public.menu_overrides, public.menu_photos to anon, authenticated;
drop policy if exists "everyone reads menu edits" on public.menu_overrides;
create policy "everyone reads menu edits" on public.menu_overrides for select to anon, authenticated using (true);
drop policy if exists "everyone reads menu photos" on public.menu_photos;
create policy "everyone reads menu photos" on public.menu_photos for select to anon, authenticated using (true);

create or replace function public.admin_ok(pin text) returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from staff_settings where admin_hash is not null and admin_hash = crypt(pin, admin_hash));
$$;
revoke execute on function public.admin_ok(text) from anon, authenticated, public;

create or replace function public.admin_check(pin text) returns boolean language sql security definer set search_path = public as $$
  select admin_ok(pin);
$$;
create or replace function public.admin_set_item(pin text, item_id text, new_data jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  if new_data is null or new_data = '{}'::jsonb then delete from menu_overrides where id = item_id;
  else insert into menu_overrides (id, data, updated_at) values (item_id, new_data, now())
       on conflict (id) do update set data = excluded.data, updated_at = now(); end if;
end $$;
create or replace function public.admin_set_photo(pin text, item_id text, thumb text, full_img text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  if thumb is null then delete from menu_photos where id = item_id; return; end if;
  if thumb !~ '^data:image/(webp|jpeg);base64,' or full_img !~ '^data:image/(webp|jpeg);base64,' then raise exception 'bad image'; end if;
  insert into menu_photos (id, thumb, full_img, updated_at) values (item_id, thumb, full_img, now())
    on conflict (id) do update set thumb = excluded.thumb, full_img = excluded.full_img, updated_at = now();
end $$;
create or replace function public.admin_set_pins(pin text, new_staff text, new_admin text) returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  if new_staff is not null then
    if new_staff !~ '^[0-9]{4,6}$' then raise exception 'bad new pin'; end if;
    update staff_settings set pin_hash = crypt(new_staff, gen_salt('bf')) where id = 1; end if;
  if new_admin is not null then
    if new_admin !~ '^[0-9]{6}$' then raise exception 'bad new pin'; end if;
    update staff_settings set admin_hash = crypt(new_admin, gen_salt('bf')) where id = 1; end if;
end $$;
grant execute on function public.admin_check(text), public.admin_set_item(text, text, jsonb), public.admin_set_photo(text, text, text, text), public.admin_set_pins(text, text, text) to anon, authenticated;

-- the manager can also mark items sold out
create or replace function public.staff_set_stop(pin text, new_ids jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if not (staff_ok(pin) or admin_ok(pin)) then raise exception 'bad pin'; end if;
  update stoplist set ids = new_ids, updated_at = now() where id = 1;
end $$;

do $$ begin
  begin alter publication supabase_realtime add table public.menu_overrides; exception when others then null; end;
end $$;

-- manager PIN: 6 digits. Change 000000 before running, or change it later from the admin screen.
update public.staff_settings set admin_hash = crypt('000000', gen_salt('bf')) where id = 1;
