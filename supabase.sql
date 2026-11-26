-- Already applied in Supabase. Do not run this file again: features2.sql now holds every PIN-checked function
-- (with protection against PIN guessing). Running this file again would fail on the changed function types.
-- Casa Mika QR ordering: database for Supabase.
-- Paste the whole file into Supabase → SQL Editor → Run. Safe to run again.
-- Guests (anon) can create orders and requests and read them; only staff with the PIN can change them.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_no int not null check (table_no between 1 and 99),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 40),
  chips jsonb not null default '[]'::jsonb check (jsonb_typeof(chips) = 'array' and jsonb_array_length(chips) <= 10),
  note text not null default '' check (char_length(note) <= 300),
  status text not null default 'new' check (status in ('new','accepted','served')),
  code int not null default (100 + floor(random() * 900))::int,
  lang text not null default 'en' check (lang in ('ru','en','vi','ko')),
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  table_no int not null check (table_no between 1 and 99),
  kind text not null check (kind in ('waiter','clean','napkins','cutlery','water','ice','sauce','charger','ac','menu','bill','other')),
  extra text not null default '' check (char_length(extra) <= 200),
  status text not null default 'new' check (status in ('new','done')),
  lang text not null default 'en' check (lang in ('ru','en','vi','ko')),
  created_at timestamptz not null default now()
);

create table if not exists public.stoplist (
  id int primary key default 1 check (id = 1),
  ids jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.stoplist (id) values (1) on conflict do nothing;

create table if not exists public.staff_settings (
  id int primary key default 1 check (id = 1),
  pin_hash text not null
);

alter table public.orders enable row level security;
alter table public.requests enable row level security;
alter table public.stoplist enable row level security;
alter table public.staff_settings enable row level security;

-- grants for the Data API (needed on projects created after May 2026)
grant usage on schema public to anon, authenticated;
grant select, insert on public.orders, public.requests to anon, authenticated;
grant select on public.stoplist to anon, authenticated;

drop policy if exists "guests read orders" on public.orders;
create policy "guests read orders" on public.orders for select to anon, authenticated using (created_at > now() - interval '24 hours');
drop policy if exists "guests create orders" on public.orders;
create policy "guests create orders" on public.orders for insert to anon, authenticated with check (status = 'new');

drop policy if exists "guests read requests" on public.requests;
create policy "guests read requests" on public.requests for select to anon, authenticated using (created_at > now() - interval '24 hours');
drop policy if exists "guests create requests" on public.requests;
create policy "guests create requests" on public.requests for insert to anon, authenticated with check (status = 'new');

drop policy if exists "everyone reads stoplist" on public.stoplist;
create policy "everyone reads stoplist" on public.stoplist for select to anon, authenticated using (true);

-- light flood guard: at most 20 orders and 30 requests per table in 10 minutes
create or replace function public.guard_flood() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'orders' and (select count(*) from orders where table_no = new.table_no and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'too many orders';
  end if;
  if tg_table_name = 'requests' and (select count(*) from requests where table_no = new.table_no and created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'too many requests';
  end if;
  new.status := 'new';
  new.created_at := now();
  return new;
end $$;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before insert on public.orders for each row execute function public.guard_flood();
drop trigger if exists requests_guard on public.requests;
create trigger requests_guard before insert on public.requests for each row execute function public.guard_flood();

-- staff actions, checked against the PIN
create or replace function public.staff_ok(pin text) returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from staff_settings where pin_hash = crypt(pin, pin_hash));
$$;
create or replace function public.staff_check(pin text) returns boolean language sql security definer set search_path = public as $$
  select staff_ok(pin);
$$;
create or replace function public.staff_set_order(pin text, order_id uuid, new_status text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not staff_ok(pin) then raise exception 'bad pin'; end if;
  update orders set status = new_status where id = order_id;
end $$;
create or replace function public.staff_set_request(pin text, request_id uuid, new_status text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not staff_ok(pin) then raise exception 'bad pin'; end if;
  update requests set status = new_status where id = request_id;
end $$;
create or replace function public.staff_set_stop(pin text, new_ids jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if not staff_ok(pin) then raise exception 'bad pin'; end if;
  update stoplist set ids = new_ids, updated_at = now() where id = 1;
end $$;
create or replace function public.staff_clear_done(pin text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not staff_ok(pin) then raise exception 'bad pin'; end if;
  delete from orders where status = 'served' or created_at < now() - interval '24 hours';
  delete from requests where status = 'done' or created_at < now() - interval '24 hours';
end $$;
grant execute on function public.staff_check(text), public.staff_set_order(text, uuid, text), public.staff_set_request(text, uuid, text),
  public.staff_set_stop(text, jsonb), public.staff_clear_done(text) to anon, authenticated;
revoke execute on function public.staff_ok(text) from anon, authenticated, public;

-- live updates
do $$ begin
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
  begin alter publication supabase_realtime add table public.requests; exception when others then null; end;
  begin alter publication supabase_realtime add table public.stoplist; exception when others then null; end;
end $$;

-- staff PIN: change 2468 to your own 4–6 digits before running, or run this line again later with a new PIN
insert into public.staff_settings (id, pin_hash) values (1, crypt('2468', gen_salt('bf')))
on conflict (id) do nothing;
