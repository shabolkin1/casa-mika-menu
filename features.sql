-- Casa Mika v7: safer orders, bill by bank QR, guest feedback, Telegram alerts.
-- Run once in Supabase -> SQL Editor after supabase.sql and admin.sql. Safe to run again.

-- 1. An order sent twice (weak Wi-Fi, double tap) is stored once
alter table public.orders add column if not exists client_key text;
alter table public.orders add column if not exists alerted boolean not null default false;
do $$ begin
  begin alter table public.orders add constraint orders_client_key_len check (client_key is null or char_length(client_key) between 8 and 64); exception when others then null; end;
end $$;
create unique index if not exists orders_client_key_uq on public.orders (client_key);
create or replace function public.guard_order_extra() returns trigger language plpgsql as $$
begin new.alerted := false; return new; end $$;
drop trigger if exists orders_guard_extra on public.orders;
create trigger orders_guard_extra before insert on public.orders for each row execute function public.guard_order_extra();

-- 2. Public settings the guest page needs: bank QR details, review link
create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 4000),
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict do nothing;
alter table public.app_settings enable row level security;
grant select on public.app_settings to anon, authenticated;
drop policy if exists "everyone reads settings" on public.app_settings;
create policy "everyone reads settings" on public.app_settings for select to anon, authenticated using (true);

create or replace function public.admin_set_settings(pin text, new_data jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  if new_data is null or jsonb_typeof(new_data) <> 'object' then raise exception 'bad data'; end if;
  update app_settings set data = new_data, updated_at = now() where id = 1;
end $$;

-- 3. Guest feedback after the food is served. Guests can only add; only the manager reads.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  table_no int not null check (table_no between 1 and 99),
  order_id uuid,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 400),
  lang text not null default 'en' check (lang in ('ru','en','vi','ko')),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
grant insert on public.feedback to anon, authenticated;
drop policy if exists "guests leave feedback" on public.feedback;
create policy "guests leave feedback" on public.feedback for insert to anon, authenticated with check (true);

create or replace function public.guard_feedback() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from feedback where table_no = new.table_no and created_at > now() - interval '10 minutes') >= 6 then
    raise exception 'too many';
  end if;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists feedback_guard on public.feedback;
create trigger feedback_guard before insert on public.feedback for each row execute function public.guard_feedback();

create or replace function public.admin_feedback(pin text) returns setof public.feedback language plpgsql security definer set search_path = public as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  return query select * from feedback order by created_at desc limit 100;
end $$;

-- 4. Telegram alerts for the owner: an order nobody accepted in 5 minutes, and low ratings.
-- The bot token lives only here; nobody can read it through the API.
create table if not exists public.tg_config (
  id int primary key default 1 check (id = 1),
  token text not null default '',
  chat_id text not null default ''
);
insert into public.tg_config (id) values (1) on conflict do nothing;
alter table public.tg_config enable row level security;
revoke all on public.tg_config from anon, authenticated;

create or replace function public.admin_set_telegram(pin text, new_token text, new_chat text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  if coalesce(new_token, '') <> '' and new_token !~ '^[0-9]{5,12}:[A-Za-z0-9_-]{30,50}$' then raise exception 'bad token'; end if;
  if coalesce(new_chat, '') <> '' and new_chat !~ '^-?[0-9]{3,20}$' then raise exception 'bad chat'; end if;
  update tg_config set token = coalesce(new_token, ''), chat_id = coalesce(new_chat, '') where id = 1;
end $$;
create or replace function public.admin_telegram_on(pin text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_ok(pin) then raise exception 'bad pin'; end if;
  return exists (select 1 from tg_config where token <> '' and chat_id <> '');
end $$;

create extension if not exists pg_net;

create or replace function public.tg_send(msg text) returns void language plpgsql security definer set search_path = public, extensions as $$
declare c tg_config;
begin
  select * into c from tg_config where id = 1;
  if c.token = '' or c.chat_id = '' then return; end if;
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || c.token || '/sendMessage',
    body := jsonb_build_object('chat_id', c.chat_id, 'text', left(msg, 3500)),
    headers := '{"Content-Type":"application/json"}'::jsonb);
exception when others then null;
end $$;
revoke execute on function public.tg_send(text) from anon, authenticated, public;

create or replace function public.tg_on_feedback() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rating <= 3 then
    perform tg_send('Casa Mika: ' || new.rating || '/5, bàn ' || new.table_no ||
      case when new.comment <> '' then E'\n' || new.comment else '' end);
  end if;
  return new;
end $$;
drop trigger if exists feedback_tg on public.feedback;
create trigger feedback_tg after insert on public.feedback for each row execute function public.tg_on_feedback();

create or replace function public.tg_check_late() returns void language plpgsql security definer set search_path = public as $$
declare o record;
begin
  for o in select id, table_no, code, created_at from orders
           where status = 'new' and not alerted and created_at < now() - interval '5 minutes' and created_at > now() - interval '2 hours'
  loop
    perform tg_send('Casa Mika: đơn #' || o.code || ' bàn ' || o.table_no || ' chưa ai nhận ' ||
      floor(extract(epoch from now() - o.created_at) / 60) || ' phút');
    update orders set alerted = true where id = o.id;
  end loop;
end $$;
revoke execute on function public.tg_check_late() from anon, authenticated, public;

do $$ begin
  begin create extension if not exists pg_cron; exception when others then null; end;
  begin perform cron.unschedule('cm-late-orders'); exception when others then null; end;
  begin
    perform cron.schedule('cm-late-orders', '* * * * *', 'select public.tg_check_late()');
  exception when others then raise notice 'pg_cron is off: late-order alerts disabled'; end;
end $$;

grant execute on function public.admin_set_settings(text, jsonb), public.admin_feedback(text),
  public.admin_set_telegram(text, text, text), public.admin_telegram_on(text) to anon, authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.app_settings; exception when others then null; end;
end $$;
