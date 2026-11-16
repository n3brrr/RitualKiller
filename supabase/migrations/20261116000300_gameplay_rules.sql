-- Gameplay rules computed by the server (SEC-01, SEC-19, COD-02, COD-03,
-- COD-04, COD-05, COD-14, UX-16).

-- ---------------------------------------------------------------------------
-- COD-05: per-user time zone and "today"
-- ---------------------------------------------------------------------------
alter table public.user_settings
  add column if not exists timezone text not null default 'UTC';

create or replace function public.validate_settings_timezone()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'invalid_timezone' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_settings_timezone on public.user_settings;
create trigger validate_settings_timezone
  before insert or update of timezone on public.user_settings
  for each row execute function public.validate_settings_timezone();

create or replace function public.user_timezone(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select timezone from public.user_settings where user_id = p_user_id), 'UTC');
$$;

create or replace function public.user_today(p_user_id uuid)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (now() at time zone public.user_timezone(p_user_id))::date;
$$;

-- New users get the time zone the client reports at sign-up (when valid).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  suffix integer := 0;
  tz text := new.raw_user_meta_data ->> 'timezone';
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(coalesce(new.email, 'initiate'), '@', 1)
  );
  base_name := left(regexp_replace(base_name, '[^a-zA-Z0-9_]+', '_', 'g'), 24);
  if char_length(base_name) < 2 then
    base_name := 'initiate';
  end if;
  candidate := base_name;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := base_name || suffix::text;
  end loop;

  if tz is null or not exists (select 1 from pg_timezone_names where name = tz) then
    tz := 'UTC';
  end if;

  insert into public.profiles (id, username)
  values (new.id, candidate)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id, timezone)
  values (new.id, tz)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- COD-14: archived rituals keep their history
-- ---------------------------------------------------------------------------
alter table public.rituals add column if not exists archived_at timestamptz;
alter table public.rituals add column if not exists best_streak integer not null default 0
  check (best_streak >= 0);
create index if not exists rituals_user_active_idx
  on public.rituals (user_id) where archived_at is null;

-- Protected days are filled by the Potion of Oblivion: they keep a streak
-- alive but give no essence and do not count as completions.
alter table public.ritual_logs add column if not exists protected boolean not null default false;

-- ---------------------------------------------------------------------------
-- COD-02: streaks are derived from the logs
-- ---------------------------------------------------------------------------
create or replace function public.ritual_period_start(p_frequency text, p_day date)
returns date
language sql
immutable
as $$
  select case when p_frequency = 'weekly' then date_trunc('week', p_day)::date else p_day end;
$$;

-- Consecutive periods (days or Monday-based weeks) with a log, counted back
-- from the current period, or from the previous one when the current period
-- is still open. A gap of one full period breaks the streak.
create or replace function public.compute_streak(p_ritual_id uuid, p_today date)
returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  v_frequency text;
  v_step integer;
  v_period date;
  v_count integer := 0;
begin
  select frequency into v_frequency from public.rituals where id = p_ritual_id;
  if not found then
    return 0;
  end if;
  v_step := case when v_frequency = 'weekly' then 7 else 1 end;
  v_period := public.ritual_period_start(v_frequency, p_today);

  if not exists (
    select 1 from public.ritual_logs
    where ritual_id = p_ritual_id and date between v_period and v_period + v_step - 1
  ) then
    v_period := v_period - v_step;
  end if;

  while exists (
    select 1 from public.ritual_logs
    where ritual_id = p_ritual_id and date between v_period and v_period + v_step - 1
  ) loop
    v_count := v_count + 1;
    v_period := v_period - v_step;
  end loop;

  return v_count;
end;
$$;

create or replace function public.refresh_ritual_streak(p_ritual_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_streak integer;
begin
  select user_id into v_user from public.rituals where id = p_ritual_id;
  v_streak := public.compute_streak(p_ritual_id, public.user_today(v_user));
  update public.rituals
    set streak = v_streak, best_streak = greatest(best_streak, v_streak)
    where id = p_ritual_id;
  return v_streak;
end;
$$;

-- Active rituals with the live streak (0 once a full period was missed).
create or replace view public.rituals_with_streak
with (security_invoker = true) as
  select r.*, public.compute_streak(r.id, public.user_today(r.user_id)) as current_streak
  from public.rituals r
  where r.archived_at is null;

grant select on public.rituals_with_streak to authenticated;

-- ---------------------------------------------------------------------------
-- SEC-01 / COD-02: completing and undoing, only for today or yesterday
-- ---------------------------------------------------------------------------
drop function if exists public.complete_ritual(uuid, date);
create function public.complete_ritual(p_ritual_id uuid, p_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ritual public.rituals%rowtype;
  v_today date;
  v_date date;
  v_period date;
  v_step integer;
  v_log_id uuid;
  v_streak integer;
  v_bonus integer := 0;
  v_multiplier numeric := 1;
  v_total integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_ritual
  from public.rituals
  where id = p_ritual_id and user_id = auth.uid() and archived_at is null
  for update;
  if not found then
    raise exception 'ritual not found';
  end if;

  v_today := public.user_today(auth.uid());
  v_date := coalesce(p_date, v_today);
  if v_date not in (v_today, v_today - 1)
     or v_date < (v_ritual.created_at at time zone public.user_timezone(auth.uid()))::date then
    return jsonb_build_object('success', false, 'reason', 'invalid_date');
  end if;

  v_step := case when v_ritual.frequency = 'weekly' then 7 else 1 end;
  v_period := public.ritual_period_start(v_ritual.frequency, v_date);
  if exists (
    select 1 from public.ritual_logs
    where ritual_id = p_ritual_id and date between v_period and v_period + v_step - 1
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_completed');
  end if;

  insert into public.ritual_logs (ritual_id, user_id, date, essence_gained)
  values (p_ritual_id, auth.uid(), v_date, 0)
  returning id into v_log_id;

  -- Bonus when this completion continues the streak of the previous period.
  if public.compute_streak(p_ritual_id, v_date) > 1 then
    v_bonus := 10;
  end if;

  select coalesce(max(multiplier), 1) into v_multiplier
  from public.active_buffs
  where user_id = auth.uid() and expires_at > now();

  v_total := round((v_ritual.essence_reward + v_bonus) * v_multiplier)::integer;
  update public.ritual_logs set essence_gained = v_total where id = v_log_id;
  update public.profiles set essence = essence + v_total where id = auth.uid();
  v_streak := public.refresh_ritual_streak(p_ritual_id);

  return jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'date', v_date,
    'essence_gained', v_total,
    'streak', v_streak
  );
end;
$$;

drop function if exists public.undo_ritual(uuid, date);
create function public.undo_ritual(p_ritual_id uuid, p_date date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ritual public.rituals%rowtype;
  v_log public.ritual_logs%rowtype;
  v_today date;
  v_date date;
  v_period date;
  v_step integer;
  v_essence integer;
  v_streak integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_ritual
  from public.rituals
  where id = p_ritual_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'ritual not found';
  end if;

  v_today := public.user_today(auth.uid());
  v_date := coalesce(p_date, v_today);
  if v_date not in (v_today, v_today - 1) then
    return jsonb_build_object('success', false, 'reason', 'invalid_date');
  end if;

  v_step := case when v_ritual.frequency = 'weekly' then 7 else 1 end;
  v_period := public.ritual_period_start(v_ritual.frequency, v_date);
  select * into v_log
  from public.ritual_logs
  where ritual_id = p_ritual_id
    and protected = false
    and date between v_period and v_period + v_step - 1
  order by date desc
  limit 1
  for update;
  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_completed');
  end if;

  -- SEC-19: the essence of this completion must not have been spent already.
  select essence into v_essence from public.profiles where id = auth.uid() for update;
  if v_essence < v_log.essence_gained then
    return jsonb_build_object('success', false, 'reason', 'essence_spent');
  end if;

  delete from public.ritual_logs where id = v_log.id;
  update public.profiles set essence = essence - v_log.essence_gained where id = auth.uid();
  v_streak := public.refresh_ritual_streak(p_ritual_id);

  return jsonb_build_object(
    'success', true,
    'essence_removed', v_log.essence_gained,
    'streak', v_streak
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- COD-03 / COD-04: shop items with real effects
-- ---------------------------------------------------------------------------
-- Passive items work by being owned; consumable ones are used from the inventory.
alter table public.shop_items add column if not exists consumable boolean not null default true;
update public.shop_items set consumable = false where effect_type in ('cosmetic', 'unlock_master');
update public.shop_items
  set description = 'Fills yesterday for daily rituals whose streak would break.'
  where id = 'potion_oblivion';

create or replace function public.purchase_item(p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.shop_items%rowtype;
  v_essence integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_item from public.shop_items where id = p_item_id;
  if not found then
    raise exception 'item not found';
  end if;

  if not v_item.consumable and exists (
    select 1 from public.inventory
    where user_id = auth.uid() and item_id = p_item_id and quantity > 0
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_owned');
  end if;

  select essence into v_essence from public.profiles where id = auth.uid() for update;
  if v_essence < v_item.cost then
    return jsonb_build_object('success', false, 'reason', 'insufficient_essence', 'essence', v_essence);
  end if;

  update public.profiles set essence = essence - v_item.cost where id = auth.uid();
  insert into public.inventory (user_id, item_id, quantity)
  values (auth.uid(), p_item_id, 1)
  on conflict (user_id, item_id) do update set quantity = public.inventory.quantity + 1;

  return jsonb_build_object('success', true, 'essence', v_essence - v_item.cost);
end;
$$;

create or replace function public.consume_item(p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.shop_items%rowtype;
  v_quantity integer;
  v_yesterday date;
  v_restored integer := 0;
  v_ritual record;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_item from public.shop_items where id = p_item_id;
  if not found then
    raise exception 'item not found';
  end if;

  select quantity into v_quantity
  from public.inventory
  where user_id = auth.uid() and item_id = p_item_id
  for update;
  if not found or v_quantity <= 0 then
    return jsonb_build_object('success', false, 'reason', 'not_owned');
  end if;

  if not v_item.consumable then
    return jsonb_build_object('success', false, 'reason', 'passive_item');
  end if;

  if v_item.effect_type = 'essence_boost' then
    insert into public.active_buffs (user_id, item_id, multiplier, expires_at)
    values (
      auth.uid(),
      p_item_id,
      least(coalesce(v_item.effect_value, 1.25), 3),
      now() + make_interval(secs => coalesce(v_item.duration_ms, 86400000) / 1000.0)
    );
  elsif v_item.effect_type = 'restore_streak' then
    -- Daily rituals that were done the day before yesterday but not yesterday.
    v_yesterday := public.user_today(auth.uid()) - 1;
    for v_ritual in
      select r.id from public.rituals r
      where r.user_id = auth.uid()
        and r.archived_at is null
        and r.frequency = 'daily'
        and exists (
          select 1 from public.ritual_logs l where l.ritual_id = r.id and l.date = v_yesterday - 1
        )
        and not exists (
          select 1 from public.ritual_logs l where l.ritual_id = r.id and l.date = v_yesterday
        )
    loop
      insert into public.ritual_logs (ritual_id, user_id, date, essence_gained, protected)
      values (v_ritual.id, auth.uid(), v_yesterday, 0, true);
      perform public.refresh_ritual_streak(v_ritual.id);
      v_restored := v_restored + 1;
    end loop;

    if v_restored = 0 then
      return jsonb_build_object('success', false, 'reason', 'nothing_to_restore');
    end if;
  end if;

  if v_quantity = 1 then
    delete from public.inventory where user_id = auth.uid() and item_id = p_item_id;
  else
    update public.inventory set quantity = quantity - 1
    where user_id = auth.uid() and item_id = p_item_id;
  end if;

  return jsonb_build_object('success', true, 'restored', v_restored);
end;
$$;

-- ---------------------------------------------------------------------------
-- UX-16 / COD-05: in-app reminder in the user's time zone, stored as a key
-- ---------------------------------------------------------------------------
-- Notifications created by the server carry a type + data and are translated
-- by the client; title/message stay as a readable fallback.
alter table public.notifications add column if not exists data jsonb not null default '{}';

create or replace function public.ensure_ritual_reminder()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.user_settings%rowtype;
  v_today date;
  v_pending integer;
begin
  if auth.uid() is null then
    return;
  end if;

  select * into v_settings from public.user_settings where user_id = auth.uid();
  if not found or not v_settings.notifications_enabled then
    return;
  end if;
  if (now() at time zone v_settings.timezone)::time < v_settings.reminder_time then
    return;
  end if;

  v_today := public.user_today(auth.uid());
  if exists (
    select 1 from public.notifications
    where user_id = auth.uid()
      and type = 'reminder'
      and (created_at at time zone v_settings.timezone)::date = v_today
  ) then
    return;
  end if;

  select count(*) into v_pending
  from public.rituals r
  where r.user_id = auth.uid()
    and r.archived_at is null
    and not exists (
      select 1 from public.ritual_logs l
      where l.ritual_id = r.id
        and l.date between public.ritual_period_start(r.frequency, v_today)
          and public.ritual_period_start(r.frequency, v_today)
            + (case when r.frequency = 'weekly' then 6 else 0 end)
    );
  if v_pending = 0 then
    return;
  end if;

  insert into public.notifications (user_id, type, title, message, data)
  values (
    auth.uid(),
    'reminder',
    'Rituals pending',
    'You still have rituals to complete today.',
    jsonb_build_object('pending', v_pending)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function public.validate_settings_timezone() from authenticated;
revoke execute on function public.user_timezone(uuid) from authenticated;
revoke execute on function public.refresh_ritual_streak(uuid) from authenticated;
grant execute on function public.user_today(uuid) to authenticated;
grant execute on function public.compute_streak(uuid, date) to authenticated;
grant execute on function public.ritual_period_start(text, date) to authenticated;
grant execute on function public.complete_ritual(uuid, date) to authenticated;
grant execute on function public.undo_ritual(uuid, date) to authenticated;
grant execute on function public.purchase_item(text) to authenticated;
grant execute on function public.consume_item(text) to authenticated;
grant execute on function public.ensure_ritual_reminder() to authenticated;
