-- Security hardening (audit findings SEC-02..SEC-08, SEC-11, SEC-14..SEC-17, COD-20).
--
-- Principle: API roles (anon, authenticated) may only write what a user is
-- allowed to decide. Anything that affects the economy, streaks, achievements
-- or system content is written by SECURITY DEFINER functions, which run as the
-- table owner. Triggers tell both paths apart with `public.is_api_role()`.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- Note: triggers that call is_api_role() must be SECURITY INVOKER, otherwise
-- current_user would always be the function owner.

-- True when the statement comes straight from the API (PostgREST roles), false
-- inside SECURITY DEFINER functions, migrations or the service role.
create or replace function public.is_api_role()
returns boolean
language sql
stable
as $$
  select current_user in ('anon', 'authenticated');
$$;

-- COD-20: the old trigger compared auth.uid() with the row, which is also true
-- inside complete_ritual/purchase_item, so essence could never change for a
-- regular user. Protect the fields only for direct API writes.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_api_role() and not public.is_admin() then
    new.id := old.id;
    new.essence := old.essence;
    new.is_admin := old.is_admin;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- SEC-02 / SEC-03 / SEC-05 / SEC-06: no direct writes to server-owned tables
-- ---------------------------------------------------------------------------
drop policy if exists "inventory_write_own" on public.inventory;
drop policy if exists "buffs_write_own" on public.active_buffs;
drop policy if exists "logs_insert_own" on public.ritual_logs;
drop policy if exists "logs_update_own_or_admin" on public.ritual_logs;
drop policy if exists "logs_delete_own_or_admin" on public.ritual_logs;
drop policy if exists "achievements_insert_own" on public.user_achievements;
drop policy if exists "achievements_delete_own" on public.user_achievements;
drop policy if exists "notifications_insert_own" on public.notifications;

-- Buffs forged through the old policy are removed and capped from now on.
delete from public.active_buffs where multiplier > 3;
alter table public.active_buffs
  add constraint active_buffs_multiplier_max check (multiplier <= 3);

-- Users may only flip `read` on their notifications, never rewrite them.
revoke update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- SEC-04: rituals. Reward and streak are computed by the server.
-- ---------------------------------------------------------------------------
create or replace function public.ritual_base_reward(p_difficulty text, p_frequency text)
returns integer
language sql
immutable
as $$
  select (case p_difficulty when 'master' then 50 when 'adept' then 25 else 10 end)
    * (case when p_frequency = 'weekly' then 3 else 1 end);
$$;

create or replace function public.guard_ritual_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_api_role() then
    return new;
  end if;

  new.essence_reward := public.ritual_base_reward(new.difficulty, new.frequency);

  if tg_op = 'INSERT' then
    new.streak := 0;
    new.created_at := now();
  else
    new.id := old.id;
    new.user_id := old.user_id;
    new.streak := old.streak;
    new.created_at := old.created_at;
  end if;

  -- COD-03: master rituals require the Binding Contract. Existing master
  -- rituals are kept; the check only applies when a ritual becomes master.
  if new.difficulty = 'master'
     and (tg_op = 'INSERT' or old.difficulty <> 'master')
     and not public.is_admin()
     and not exists (
       select 1 from public.inventory i
       where i.user_id = new.user_id and i.item_id = 'binding_contract' and i.quantity > 0
     ) then
    raise exception 'binding_contract_required' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_ritual_write on public.rituals;
create trigger guard_ritual_write
  before insert or update on public.rituals
  for each row execute function public.guard_ritual_write();

-- ---------------------------------------------------------------------------
-- SEC-08: only admins (or the server) publish system posts.
-- ---------------------------------------------------------------------------
drop policy if exists "posts_insert_own" on public.posts;
drop policy if exists "posts_update_own_or_admin" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (user_id = auth.uid() and (is_system = false or public.is_admin()));
create policy "posts_update_own_or_admin" on public.posts
  for update using (user_id = auth.uid() or public.is_admin())
  with check (
    (user_id = auth.uid() and is_system = false) or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- SEC-11: avatars must be https URLs within the length limit.
-- ---------------------------------------------------------------------------
update public.profiles
  set avatar_url = null
  where avatar_url is not null
    and (avatar_url !~ '^https://' or char_length(avatar_url) > 500);
alter table public.profiles
  add constraint profiles_avatar_url_https
  check (avatar_url is null or (avatar_url ~ '^https://[^\s]+$' and char_length(avatar_url) <= 500));

-- ---------------------------------------------------------------------------
-- SEC-14: error logs only from signed-in users, with bounded sizes.
-- ---------------------------------------------------------------------------
drop policy if exists "error_logs_insert_own" on public.error_logs;
create policy "error_logs_insert_own" on public.error_logs
  for insert to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());
revoke insert on public.error_logs from anon;

alter table public.error_logs
  add constraint error_logs_message_len check (char_length(message) <= 2000) not valid,
  add constraint error_logs_stack_len check (stack is null or char_length(stack) <= 10000) not valid,
  add constraint error_logs_context_size check (pg_column_size(context) <= 8192) not valid;

-- ---------------------------------------------------------------------------
-- SEC-15: one report per target and reporter, and per-user rate limits.
-- ---------------------------------------------------------------------------
delete from public.reports r
using public.reports older
where r.reporter_id = older.reporter_id
  and r.post_id is not distinct from older.post_id
  and r.target_user_id is not distinct from older.target_user_id
  and (older.created_at, older.id) < (r.created_at, r.id);

create unique index if not exists reports_unique_post
  on public.reports (reporter_id, post_id) where post_id is not null;
create unique index if not exists reports_unique_user
  on public.reports (reporter_id, target_user_id)
  where post_id is null and target_user_id is not null;

-- Generic limiter: TG_ARGV = (user column, max rows, window).
create or replace function public.enforce_rate_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid;
  v_count integer;
begin
  if not public.is_api_role() or public.is_admin() then
    return new;
  end if;

  v_user := (to_jsonb(new) ->> tg_argv[0])::uuid;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2::interval',
    tg_table_schema, tg_table_name, tg_argv[0]
  ) into v_count using v_user, tg_argv[2];

  if v_count >= tg_argv[1]::integer then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists rate_limit_posts on public.posts;
create trigger rate_limit_posts before insert on public.posts
  for each row execute function public.enforce_rate_limit('user_id', '10', '10 minutes');
drop trigger if exists rate_limit_comments on public.comments;
create trigger rate_limit_comments before insert on public.comments
  for each row execute function public.enforce_rate_limit('user_id', '30', '10 minutes');
drop trigger if exists rate_limit_reports on public.reports;
create trigger rate_limit_reports before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '10', '1 hour');
drop trigger if exists rate_limit_follows on public.follows;
create trigger rate_limit_follows before insert on public.follows
  for each row execute function public.enforce_rate_limit('follower_id', '60', '1 hour');

-- ---------------------------------------------------------------------------
-- SEC-16: profiles are private; other users see a public projection.
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Runs with the owner's rights on purpose: it exposes only public columns.
create or replace view public.public_profiles
with (security_barrier = true) as
  select p.id, p.username, p.avatar_url, p.essence, p.created_at
  from public.profiles p
  where auth.uid() is not null;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- SEC-17: functions are not executable by anonymous callers by default.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- Used inside RLS policies, so every API role must be able to evaluate it.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_api_role() to anon, authenticated;

-- Internal helpers are not part of the public API.
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.protect_profile_fields() from authenticated;
revoke execute on function public.guard_ritual_write() from authenticated;
revoke execute on function public.enforce_rate_limit() from authenticated;
revoke execute on function public.touch_updated_at() from authenticated;

grant execute on function
  public.complete_ritual(uuid, date),
  public.undo_ritual(uuid, date),
  public.purchase_item(text),
  public.consume_item(text),
  public.delete_my_data(),
  public.admin_metrics(),
  public.set_admin(uuid, boolean),
  public.ensure_ritual_reminder(),
  public.ritual_base_reward(text, text)
to authenticated;
