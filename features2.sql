-- Casa Mika v11: kitchen/bar stations, waiters with their own PINs, closing a table, archive instead of delete,
-- timing for stats, staff Telegram group. Run in Supabase -> SQL Editor after supabase.sql, admin.sql and features.sql. Safe to run again.
-- After this file the older files must not be run again: this file is the source of truth for every PIN-checked function.

-- 1. More facts on each order
alter table public.orders add column if not exists stations jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists accepted_at timestamptz;
alter table public.orders add column if not exists served_at timestamptz;
alter table public.orders add column if not exists accepted_by text;
alter table public.orders add column if not exists served_by text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists pay_method text;
alter table public.orders add column if not exists archived boolean not null default false;
alter table public.orders add column if not exists staff text;
alter table public.requests add column if not exists done_by text;
alter table public.requests add column if not exists archived boolean not null default false;
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_table_idx on public.orders (table_no, created_at desc);

-- guests may only send station names with status 'new', and nothing about payment or staff work
create or replace function public.guard_order_extra() returns trigger language plpgsql as $$
declare k text; s jsonb := '{}'::jsonb;
begin
  new.alerted := false; new.accepted_at := null; new.served_at := null; new.accepted_by := null; new.served_by := null;
  new.paid_at := null; new.pay_method := null; new.archived := false;
  if new.stations is not null and jsonb_typeof(new.stations) = 'object' then
    for k in select jsonb_object_keys(new.stations) loop
      if k in ('kitchen', 'bar') then s := s || jsonb_build_object(k, 'new'); end if;
    end loop;
  end if;
  new.stations := s;
  if new.staff is not null then new.staff := left(new.staff, 40); end if;
  return new;
end $$;

-- 2. Waiters: each has a name and a PIN. The shared staff PIN keeps working.
create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;
revoke all on public.staff_members from anon, authenticated;

-- 4. Staff Telegram group: every new order and request goes there at once
alter table public.tg_config add column if not exists staff_chat text not null default '';


create or replace function public.tg_send_staff(msg text) returns void language plpgsql security definer set search_path = public, extensions as $$
declare c tg_config;
begin
  select * into c from tg_config where id = 1;
  if c.token = '' or c.staff_chat = '' then return; end if;
  perform net.http_post(url := 'https://api.telegram.org/bot' || c.token || '/sendMessage',
    body := jsonb_build_object('chat_id', c.staff_chat, 'text', left(msg, 3500)), headers := '{"Content-Type":"application/json"}'::jsonb);
exception when others then null;
end $$;
revoke execute on function public.tg_send_staff(text) from anon, authenticated, public;

create or replace function public.tg_on_order() returns trigger language plpgsql security definer set search_path = public as $$
declare lines text;
begin
  select string_agg((x->>'q') || ' × ' || (x->>'id'), E'\n') into lines from jsonb_array_elements(new.items) x;
  perform tg_send_staff('Bàn ' || new.table_no || ' · đơn #' || new.code || E'\n' || coalesce(lines, '') ||
    case when new.note <> '' then E'\n' || new.note else '' end);
  return new;
end $$;
drop trigger if exists orders_tg on public.orders;
create trigger orders_tg after insert on public.orders for each row execute function public.tg_on_order();

create or replace function public.tg_on_request() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform tg_send_staff('Bàn ' || new.table_no || ' · ' || new.kind || case when new.extra <> '' then ': ' || new.extra else '' end);
  return new;
end $$;
drop trigger if exists requests_tg on public.requests;
create trigger requests_tg after insert on public.requests for each row execute function public.tg_on_request();



-- 5. PIN guessing protection.
-- Every PIN check goes through pin_guard: a wrong PIN is written down per network address, and after 8 wrong
-- tries in 15 minutes that address is refused for 15 minutes, even with the right PIN. Functions answer false
-- (or an empty list) instead of raising an error, so the record of the wrong try is kept.
create table if not exists public.pin_fails (ip text not null, at timestamptz not null default now());
create index if not exists pin_fails_ip_idx on public.pin_fails (ip, at desc);
alter table public.pin_fails enable row level security;
revoke all on public.pin_fails from anon, authenticated;

create or replace function public.req_ip() returns text language sql stable as $$
  select coalesce(nullif(split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1), ''), 'unknown');
$$;
revoke execute on function public.req_ip() from anon, authenticated, public;

-- kind: 'staff' returns the waiter name or 'staff'; 'admin' returns 'admin'; null when wrong; '!locked' while locked.
-- Callers answer false for a wrong PIN and null while locked, so a locked screen keeps its saved PIN.
create or replace function public.pin_guard(pin text, kind text) returns text language plpgsql security definer set search_path = public, extensions as $$
declare ip text := req_ip(); who text;
begin
  if (select count(*) from pin_fails where pin_fails.ip = req_ip() and at > now() - interval '15 minutes') >= 8 then return '!locked'; end if;
  if kind in ('admin', 'any') then
    select 'admin' into who from staff_settings where admin_hash is not null and admin_hash = crypt(pin, admin_hash) limit 1;
  end if;
  if who is null and kind in ('staff', 'any') then
    select name into who from staff_members where active and pin_hash = crypt(pin, pin_hash) limit 1;
    if who is null then select 'staff' into who from staff_settings where pin_hash = crypt(pin, pin_hash) limit 1; end if;
  end if;
  if who is null then
    insert into pin_fails (ip) values (ip);
    delete from pin_fails where at < now() - interval '1 day';
  end if;
  return who;
end $$;
revoke execute on function public.pin_guard(text, text) from anon, authenticated, public;

create or replace function public.staff_who(pin text) returns text language sql security definer set search_path = public as $$ select nullif(pin_guard(pin, 'staff'), '!locked'); $$;
create or replace function public.staff_ok(pin text) returns boolean language sql security definer set search_path = public as $$ select coalesce(pin_guard(pin, 'staff') <> '!locked', false); $$;
create or replace function public.admin_ok(pin text) returns boolean language sql security definer set search_path = public as $$ select coalesce(pin_guard(pin, 'admin') <> '!locked', false); $$;
revoke execute on function public.staff_who(text), public.staff_ok(text), public.admin_ok(text) from anon, authenticated, public;

create or replace function public.staff_check(pin text) returns boolean language sql security definer set search_path = public as $$
  select case when g is null then false when g = '!locked' then null else true end from (select pin_guard(pin, 'staff') g) x; $$;
create or replace function public.admin_check(pin text) returns boolean language sql security definer set search_path = public as $$
  select case when g is null then false when g = '!locked' then null else true end from (select pin_guard(pin, 'admin') g) x; $$;

drop function if exists public.staff_set_order(text, uuid, text);
create function public.staff_set_order(pin text, order_id uuid, new_status text) returns boolean language plpgsql security definer set search_path = public as $$
declare who text := pin_guard(pin, 'staff');
begin
  if who is null then return false; elsif who = '!locked' then return null; end if;
  if new_status not in ('new', 'accepted', 'served') then raise exception 'bad status'; end if;
  update orders set status = new_status,
    accepted_at = case when new_status in ('accepted', 'served') then coalesce(accepted_at, now()) else accepted_at end,
    accepted_by = case when new_status in ('accepted', 'served') then coalesce(accepted_by, who) else accepted_by end,
    served_at = case when new_status = 'served' then coalesce(served_at, now()) else served_at end,
    served_by = case when new_status = 'served' then coalesce(served_by, who) else served_by end,
    stations = case when new_status = 'served' then (select coalesce(jsonb_object_agg(k, 'served'), '{}'::jsonb) from jsonb_object_keys(stations) k)
                    when new_status = 'accepted' then (select coalesce(jsonb_object_agg(k, case when stations->>k = 'new' then 'accepted' else stations->>k end), '{}'::jsonb) from jsonb_object_keys(stations) k)
                    else stations end
  where id = order_id;
  return true;
end $$;

drop function if exists public.staff_set_station(text, uuid, text, text);
create function public.staff_set_station(pin text, order_id uuid, station text, new_status text) returns boolean language plpgsql security definer set search_path = public as $$
declare who text := pin_guard(pin, 'staff'); st jsonb; all_served boolean; any_started boolean;
begin
  if who is null then return false; elsif who = '!locked' then return null; end if;
  if station not in ('kitchen', 'bar') or new_status not in ('new', 'accepted', 'served') then raise exception 'bad input'; end if;
  select stations into st from orders where id = order_id for update;
  if st is null or not (st ? station) then return true; end if;
  st := st || jsonb_build_object(station, new_status);
  select bool_and(value = '"served"'), bool_or(value <> '"new"') into all_served, any_started from jsonb_each(st);
  update orders set stations = st,
    status = case when all_served then 'served' when any_started then 'accepted' else 'new' end,
    accepted_at = case when any_started then coalesce(accepted_at, now()) else accepted_at end,
    accepted_by = case when any_started then coalesce(accepted_by, who) else accepted_by end,
    served_at = case when all_served then coalesce(served_at, now()) else served_at end,
    served_by = case when all_served then coalesce(served_by, who) else served_by end
  where id = order_id;
  return true;
end $$;

drop function if exists public.staff_set_request(text, uuid, text);
create function public.staff_set_request(pin text, request_id uuid, new_status text) returns boolean language plpgsql security definer set search_path = public as $$
declare who text := pin_guard(pin, 'staff');
begin
  if who is null then return false; elsif who = '!locked' then return null; end if;
  if new_status not in ('new', 'done') then raise exception 'bad status'; end if;
  update requests set status = new_status, done_by = case when new_status = 'done' then who else done_by end where id = request_id;
  return true;
end $$;

drop function if exists public.staff_set_stop(text, jsonb);
create function public.staff_set_stop(pin text, new_ids jsonb) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'any');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if jsonb_typeof(new_ids) <> 'object' or pg_column_size(new_ids) > 20000 then raise exception 'bad data'; end if;
  update stoplist set ids = new_ids, updated_at = now() where id = 1;
  return true;
end $$;

drop function if exists public.staff_clear_done(text);
create function public.staff_clear_done(pin text) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'staff');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  update orders set archived = true where not archived and (status = 'served' or created_at < now() - interval '24 hours');
  update requests set archived = true where not archived and (status = 'done' or created_at < now() - interval '24 hours');
  return true;
end $$;

drop function if exists public.staff_close_table(text, int, text);
create function public.staff_close_table(pin text, tbl int, method text) returns int language plpgsql security definer set search_path = public as $$
declare who text := pin_guard(pin, 'staff'); n int;
begin
  if who is null then return -1; elsif who = '!locked' then return null; end if;
  if method not in ('cash', 'card', 'transfer', 'qr') then raise exception 'bad method'; end if;
  update orders set paid_at = now(), pay_method = method,
    status = 'served', served_at = coalesce(served_at, now()), served_by = coalesce(served_by, who),
    stations = (select coalesce(jsonb_object_agg(k, 'served'), '{}'::jsonb) from jsonb_object_keys(stations) k)
  where table_no = tbl and paid_at is null and not archived and created_at > now() - interval '12 hours';
  get diagnostics n = row_count;
  update requests set status = 'done', done_by = who where table_no = tbl and status = 'new' and kind = 'bill';
  return n;
end $$;

create or replace function public.staff_whoami(pin text) returns text language sql security definer set search_path = public as $$ select nullif(pin_guard(pin, 'staff'), '!locked'); $$;

-- manager functions: false or an empty list on a wrong PIN
drop function if exists public.admin_set_item(text, text, jsonb);
create function public.admin_set_item(pin text, item_id text, new_data jsonb) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if item_id !~ '^[a-z0-9-]{1,40}$' then raise exception 'bad id'; end if;
  if new_data is not null and (jsonb_typeof(new_data) <> 'object' or pg_column_size(new_data) > 8000) then raise exception 'bad data'; end if;
  if new_data is null or new_data = '{}'::jsonb then delete from menu_overrides where id = item_id;
  else insert into menu_overrides (id, data, updated_at) values (item_id, new_data, now())
       on conflict (id) do update set data = excluded.data, updated_at = now(); end if;
  return true;
end $$;
drop function if exists public.admin_set_photo(text, text, text, text);
create function public.admin_set_photo(pin text, item_id text, thumb text, full_img text) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if thumb is null then delete from menu_photos where id = item_id; return true; end if;
  if thumb !~ '^data:image/(webp|jpeg);base64,' or full_img !~ '^data:image/(webp|jpeg);base64,' then raise exception 'bad image'; end if;
  insert into menu_photos (id, thumb, full_img, updated_at) values (item_id, thumb, full_img, now())
    on conflict (id) do update set thumb = excluded.thumb, full_img = excluded.full_img, updated_at = now();
  return true;
end $$;
drop function if exists public.admin_set_pins(text, text, text);
create function public.admin_set_pins(pin text, new_staff text, new_admin text) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if new_staff is not null then
    if new_staff !~ '^[0-9]{4,6}$' then raise exception 'bad new pin'; end if;
    update staff_settings set pin_hash = crypt(new_staff, gen_salt('bf')) where id = 1; end if;
  if new_admin is not null then
    if new_admin !~ '^[0-9]{6}$' then raise exception 'bad new pin'; end if;
    update staff_settings set admin_hash = crypt(new_admin, gen_salt('bf')) where id = 1; end if;
  return true;
end $$;
drop function if exists public.admin_set_settings(text, jsonb);
create function public.admin_set_settings(pin text, new_data jsonb) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if new_data is null or jsonb_typeof(new_data) <> 'object' then raise exception 'bad data'; end if;
  update app_settings set data = new_data, updated_at = now() where id = 1;
  return true;
end $$;
create or replace function public.admin_feedback(pin text) returns setof public.feedback language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null or g = '!locked' then return; end if;
  return query select * from feedback order by created_at desc limit 300;
end $$;
drop function if exists public.admin_set_telegram(text, text, text);
create function public.admin_set_telegram(pin text, new_token text, new_chat text) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if coalesce(new_token, '') <> '' and new_token !~ '^[0-9]{5,12}:[A-Za-z0-9_-]{30,50}$' then raise exception 'bad token'; end if;
  if coalesce(new_chat, '') <> '' and new_chat !~ '^-?[0-9]{3,20}$' then raise exception 'bad chat'; end if;
  update tg_config set token = coalesce(new_token, ''), chat_id = coalesce(new_chat, '') where id = 1;
  return true;
end $$;
create or replace function public.admin_telegram_on(pin text) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  return exists (select 1 from tg_config where token <> '' and chat_id <> '');
end $$;
create or replace function public.admin_staff_list(pin text) returns table (id uuid, name text, active boolean, created_at timestamptz) language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null or g = '!locked' then return; end if;
  return query select m.id, m.name, m.active, m.created_at from staff_members m where m.active order by m.created_at;
end $$;
drop function if exists public.admin_staff_add(text, text, text);
create function public.admin_staff_add(pin text, new_name text, new_pin text) returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if new_pin !~ '^[0-9]{6}$' then raise exception 'bad new pin'; end if;
  if coalesce(trim(new_name), '') = '' then raise exception 'bad name'; end if;
  if exists (select 1 from staff_members where active and pin_hash = crypt(new_pin, pin_hash)) then raise exception 'pin taken'; end if;
  insert into staff_members (name, pin_hash) values (left(trim(new_name), 40), crypt(new_pin, gen_salt('bf')));
  return true;
end $$;
drop function if exists public.admin_staff_remove(text, uuid);
create function public.admin_staff_remove(pin text, member uuid) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  update staff_members set active = false where id = member;
  return true;
end $$;
create or replace function public.admin_orders(pin text, days int) returns setof public.orders language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null or g = '!locked' then return; end if;
  return query select * from orders where created_at > now() - make_interval(days => least(greatest(days, 1), 92)) order by created_at desc limit 5000;
end $$;
drop function if exists public.admin_set_staff_chat(text, text);
create function public.admin_set_staff_chat(pin text, new_chat text) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  if coalesce(new_chat, '') <> '' and new_chat !~ '^-?[0-9]{3,20}$' then raise exception 'bad chat'; end if;
  update tg_config set staff_chat = coalesce(new_chat, '') where id = 1;
  return true;
end $$;
create or replace function public.admin_staff_chat_on(pin text) returns boolean language plpgsql security definer set search_path = public as $$
declare g text := pin_guard(pin, 'admin');
begin
  if g is null then return false; elsif g = '!locked' then return null; end if;
  return exists (select 1 from tg_config where token <> '' and staff_chat <> '');
end $$;

-- 6. Feedback only for a real served order, once per order: no spamming the owner's Telegram
create unique index if not exists feedback_order_uq on public.feedback (order_id);
create or replace function public.guard_feedback() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.order_id is null or not exists (select 1 from orders where id = new.order_id and table_no = new.table_no
       and status = 'served' and created_at > now() - interval '24 hours') then
    raise exception 'no such order';
  end if;
  if (select count(*) from feedback where created_at > now() - interval '10 minutes') >= 30 then raise exception 'too many'; end if;
  new.created_at := now();
  return new;
end $$;

grant execute on function public.staff_check(text), public.admin_check(text), public.staff_whoami(text),
  public.staff_set_order(text, uuid, text), public.staff_set_station(text, uuid, text, text), public.staff_set_request(text, uuid, text),
  public.staff_set_stop(text, jsonb), public.staff_clear_done(text), public.staff_close_table(text, int, text),
  public.admin_set_item(text, text, jsonb), public.admin_set_photo(text, text, text, text), public.admin_set_pins(text, text, text),
  public.admin_set_settings(text, jsonb), public.admin_feedback(text), public.admin_set_telegram(text, text, text), public.admin_telegram_on(text),
  public.admin_staff_list(text), public.admin_staff_add(text, text, text), public.admin_staff_remove(text, uuid), public.admin_orders(text, int),
  public.admin_set_staff_chat(text, text), public.admin_staff_chat_on(text) to anon, authenticated;
