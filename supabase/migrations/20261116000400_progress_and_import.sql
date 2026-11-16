-- Progress computed by the server: lifetime essence, achievements, stats,
-- goal progress and backup import (COD-01, COD-06, COD-07, COD-08, COD-09, SEC-06).

-- ---------------------------------------------------------------------------
-- Imported history is shown in the calendar and analytics, but it is not an
-- in-app completion: it never counts for streaks, achievements or goals.
-- ---------------------------------------------------------------------------
alter table public.ritual_logs add column if not exists imported boolean not null default false;

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
    where ritual_id = p_ritual_id and not imported
      and date between v_period and v_period + v_step - 1
  ) then
    v_period := v_period - v_step;
  end if;

  while exists (
    select 1 from public.ritual_logs
    where ritual_id = p_ritual_id and not imported
      and date between v_period and v_period + v_step - 1
  ) loop
    v_count := v_count + 1;
    v_period := v_period - v_step;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- COD-06: lifetime essence ("accumulate N essence" must not drop when spending)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists lifetime_essence integer not null default 0
  check (lifetime_essence >= 0);

update public.profiles p
set lifetime_essence = greatest(
  p.essence,
  coalesce((select sum(l.essence_gained) from public.ritual_logs l where l.user_id = p.id), 0)
);

create or replace function public.track_lifetime_essence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta integer;
  v_user uuid;
begin
  if tg_op = 'INSERT' then
    v_delta := new.essence_gained;
    v_user := new.user_id;
  elsif tg_op = 'DELETE' then
    v_delta := -old.essence_gained;
    v_user := old.user_id;
  else
    v_delta := new.essence_gained - old.essence_gained;
    v_user := new.user_id;
  end if;

  if v_delta <> 0 then
    update public.profiles
      set lifetime_essence = greatest(lifetime_essence + v_delta, 0)
      where id = v_user;
  end if;
  return null;
end;
$$;

drop trigger if exists a_track_lifetime_essence on public.ritual_logs;
create trigger a_track_lifetime_essence
  after insert or delete or update of essence_gained on public.ritual_logs
  for each row execute function public.track_lifetime_essence();

-- ---------------------------------------------------------------------------
-- COD-01 / COD-06 / COD-08: aggregate stats, never truncated by row limits
-- ---------------------------------------------------------------------------
-- Longest run of consecutive days where every daily ritual that existed that
-- day was completed (the "Perfect Week" achievement).
create or replace function public.longest_full_day_run(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select l.date, count(distinct l.ritual_id) as done
    from public.ritual_logs l
    join public.rituals r on r.id = l.ritual_id and r.frequency = 'daily'
    where l.user_id = p_user_id and not l.imported
    group by l.date
  ),
  full_days as (
    select d.date
    from days d
    where d.done >= (
      select count(*) from public.rituals r
      where r.user_id = p_user_id
        and r.frequency = 'daily'
        and r.created_at::date <= d.date
        and (r.archived_at is null or r.archived_at::date > d.date)
    )
  ),
  islands as (
    select date, date - (row_number() over (order by date))::integer as grp
    from full_days
  )
  select coalesce(max(count), 0)::integer
  from (select count(*) from islands group by grp) runs;
$$;

create or replace function public.user_stats(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'lifetime_essence', (select lifetime_essence from public.profiles where id = p_user_id),
    'completions', (
      select count(*) from public.ritual_logs
      where user_id = p_user_id and not protected and not imported
    ),
    'rituals_created', (select count(*) from public.rituals where user_id = p_user_id),
    'best_streak', (
      select coalesce(max(best_streak), 0) from public.rituals where user_id = p_user_id
    ),
    'posts', (select count(*) from public.posts where user_id = p_user_id and not is_system),
    'perfect_days', public.longest_full_day_run(p_user_id),
    'difficulties', (
      select count(distinct r.difficulty)
      from public.ritual_logs l join public.rituals r on r.id = l.ritual_id
      where l.user_id = p_user_id and not l.protected and not l.imported
    ),
    'first_completion', (
      select min(date) from public.ritual_logs
      where user_id = p_user_id and not protected
    )
  );
$$;

create or replace function public.my_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  return public.user_stats(auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- SEC-06 / COD-06: achievements are evaluated and granted by the server
-- ---------------------------------------------------------------------------
create table if not exists public.achievement_definitions (
  id text primary key,
  metric text not null check (
    metric in ('best_streak', 'lifetime_essence', 'rituals_created', 'completions',
               'posts', 'perfect_days', 'difficulties')
  ),
  target integer not null check (target > 0)
);

alter table public.achievement_definitions enable row level security;
create policy "achievement_definitions_select" on public.achievement_definitions
  for select to authenticated using (true);

insert into public.achievement_definitions (id, metric, target) values
  ('ach-streak-7', 'best_streak', 7),
  ('ach-streak-30', 'best_streak', 30),
  ('ach-streak-100', 'best_streak', 100),
  ('ach-essence-1000', 'lifetime_essence', 1000),
  ('ach-essence-10000', 'lifetime_essence', 10000),
  ('ach-essence-50000', 'lifetime_essence', 50000),
  ('ach-rituals-10', 'rituals_created', 10),
  ('ach-rituals-50', 'rituals_created', 50),
  ('ach-complete-100', 'completions', 100),
  ('ach-social-first', 'posts', 1),
  ('ach-social-10', 'posts', 10),
  ('ach-perfect-week', 'perfect_days', 7),
  ('ach-all-difficulties', 'difficulties', 3)
on conflict (id) do update set metric = excluded.metric, target = excluded.target;

create or replace function public.evaluate_achievements(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats jsonb;
  v_unlocked integer := 0;
  v_definition record;
begin
  if p_user_id is null or not exists (select 1 from public.profiles where id = p_user_id) then
    return 0;
  end if;

  v_stats := public.user_stats(p_user_id);
  for v_definition in
    select d.id from public.achievement_definitions d
    where coalesce((v_stats ->> d.metric)::integer, 0) >= d.target
      and not exists (
        select 1 from public.user_achievements a
        where a.user_id = p_user_id and a.achievement_id = d.id
      )
  loop
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, v_definition.id)
    on conflict do nothing;
    insert into public.notifications (user_id, type, title, message, data)
    values (
      p_user_id,
      'achievement',
      'Achievement unlocked',
      v_definition.id,
      jsonb_build_object('achievementId', v_definition.id)
    );
    v_unlocked := v_unlocked + 1;
  end loop;
  return v_unlocked;
end;
$$;

create or replace function public.evaluate_achievements_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.evaluate_achievements(
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> tg_argv[0])::uuid
         else (to_jsonb(new) ->> tg_argv[0])::uuid end
  );
  return null;
end;
$$;

drop trigger if exists b_evaluate_achievements on public.ritual_logs;
create trigger b_evaluate_achievements
  after insert or update of essence_gained on public.ritual_logs
  for each row execute function public.evaluate_achievements_trigger('user_id');

drop trigger if exists evaluate_achievements on public.rituals;
create trigger evaluate_achievements
  after insert or update of best_streak on public.rituals
  for each row execute function public.evaluate_achievements_trigger('user_id');

drop trigger if exists evaluate_achievements on public.posts;
create trigger evaluate_achievements
  after insert on public.posts
  for each row execute function public.evaluate_achievements_trigger('user_id');

-- Users who already met a target get it now.
select public.evaluate_achievements(id) from public.profiles;

-- ---------------------------------------------------------------------------
-- COD-07: goals linked to rituals through a real relation
-- ---------------------------------------------------------------------------
create table if not exists public.goal_rituals (
  goal_id uuid not null references public.goals (id) on delete cascade,
  ritual_id uuid not null references public.rituals (id) on delete cascade,
  primary key (goal_id, ritual_id)
);

create index if not exists goal_rituals_ritual_idx on public.goal_rituals (ritual_id);
alter table public.goal_rituals enable row level security;

create policy "goal_rituals_select_own" on public.goal_rituals
  for select using (
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

insert into public.goal_rituals (goal_id, ritual_id)
select g.id, r.id
from public.goals g
cross join lateral unnest(g.ritual_ids) as linked(ritual_id)
join public.rituals r on r.id = linked.ritual_id and r.user_id = g.user_id
on conflict do nothing;

alter table public.goals drop column if exists ritual_ids;
alter table public.goals drop column if exists progress;

-- Goals are written through RPCs so the goal and its rituals change together.
drop policy if exists "goals_write_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete using (user_id = auth.uid());

-- Progress = completions of the linked rituals (all rituals when none are
-- linked) between the goal's creation day and its target date.
create or replace view public.goals_with_progress
with (security_invoker = true) as
  select
    g.*,
    coalesce(
      (select array_agg(gr.ritual_id) from public.goal_rituals gr where gr.goal_id = g.id),
      '{}'
    ) as ritual_ids,
    (
      select count(*)::integer
      from public.ritual_logs l
      where l.user_id = g.user_id
        and not l.protected
        and not l.imported
        and l.date >= (g.created_at at time zone public.user_timezone(g.user_id))::date
        and l.date <= g.target_date
        and (
          not exists (select 1 from public.goal_rituals gr where gr.goal_id = g.id)
          or l.ritual_id in (select gr.ritual_id from public.goal_rituals gr where gr.goal_id = g.id)
        )
    ) as progress
  from public.goals g;

grant select on public.goals_with_progress to authenticated;

create or replace function public.save_goal(
  p_goal_id uuid,
  p_title text,
  p_description text,
  p_target_date date,
  p_target_value integer,
  p_ritual_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := p_goal_id;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if char_length(trim(coalesce(p_title, ''))) < 2 then
    raise exception 'invalid_goal' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_ritual_ids, '{}')) as linked(ritual_id)
    where not exists (
      select 1 from public.rituals r where r.id = linked.ritual_id and r.user_id = auth.uid()
    )
  ) then
    raise exception 'invalid_ritual' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.goals (user_id, title, description, target_date, target_value)
    values (
      auth.uid(),
      left(trim(p_title), 120),
      left(trim(coalesce(p_description, '')), 500),
      p_target_date,
      greatest(coalesce(p_target_value, 1), 1)
    )
    returning id into v_id;
  else
    update public.goals
      set title = left(trim(p_title), 120),
          description = left(trim(coalesce(p_description, '')), 500),
          target_date = p_target_date,
          target_value = greatest(coalesce(p_target_value, 1), 1)
      where id = v_id and user_id = auth.uid();
    if not found then
      raise exception 'goal not found';
    end if;
    delete from public.goal_rituals where goal_id = v_id;
  end if;

  insert into public.goal_rituals (goal_id, ritual_id)
  select v_id, ritual_id from unnest(coalesce(p_ritual_ids, '{}')) as linked(ritual_id)
  on conflict do nothing;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- COD-09: transactional, validated and idempotent backup import
-- ---------------------------------------------------------------------------
create or replace function public.import_backup(p_backup jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date;
  v_item jsonb;
  v_title text;
  v_description text;
  v_difficulty text;
  v_frequency text;
  v_ritual_id uuid;
  v_map jsonb := '{}';
  v_rituals integer := 0;
  v_reused integer := 0;
  v_logs integer := 0;
  v_skipped integer := 0;
  v_date date;
  v_has_contract boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if jsonb_typeof(p_backup -> 'rituals') <> 'array' or jsonb_typeof(p_backup -> 'logs') <> 'array' then
    raise exception 'invalid_backup' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_backup -> 'rituals') > 200
     or jsonb_array_length(p_backup -> 'logs') > 20000 then
    raise exception 'backup_too_large' using errcode = 'P0001';
  end if;

  v_today := public.user_today(v_uid);
  v_has_contract := exists (
    select 1 from public.inventory
    where user_id = v_uid and item_id = 'binding_contract' and quantity > 0
  );

  for v_item in select * from jsonb_array_elements(p_backup -> 'rituals') loop
    v_title := left(trim(coalesce(v_item ->> 'title', '')), 100);
    v_description := left(trim(coalesce(v_item ->> 'description', '')), 500);
    v_difficulty := v_item ->> 'difficulty';
    v_frequency := v_item ->> 'frequency';
    if v_title = '' or v_item ->> 'id' is null
       or v_difficulty not in ('novice', 'adept', 'master')
       or v_frequency not in ('daily', 'weekly') then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    -- The Binding Contract is also required for imported master rituals.
    if v_difficulty = 'master' and not v_has_contract then
      v_difficulty := 'adept';
    end if;

    -- Importing the same backup twice reuses the existing ritual.
    select id into v_ritual_id from public.rituals
    where user_id = v_uid and archived_at is null
      and lower(title) = lower(v_title) and frequency = v_frequency
    limit 1;

    if v_ritual_id is null then
      insert into public.rituals (user_id, title, description, difficulty, frequency, essence_reward)
      values (
        v_uid, v_title, v_description, v_difficulty, v_frequency,
        public.ritual_base_reward(v_difficulty, v_frequency)
      )
      returning id into v_ritual_id;
      v_rituals := v_rituals + 1;
    else
      v_reused := v_reused + 1;
    end if;
    v_map := v_map || jsonb_build_object(v_item ->> 'id', v_ritual_id);
  end loop;

  for v_item in select * from jsonb_array_elements(p_backup -> 'logs') loop
    v_ritual_id := (v_map ->> (v_item ->> 'ritualId'))::uuid;
    begin
      v_date := (v_item ->> 'date')::date;
    exception when others then
      v_date := null;
    end;
    if v_ritual_id is null or v_date is null or v_date > v_today or v_date < date '2000-01-01' then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    insert into public.ritual_logs (ritual_id, user_id, date, essence_gained, imported)
    values (v_ritual_id, v_uid, v_date, 0, true)
    on conflict (ritual_id, date) do nothing;
    if found then
      v_logs := v_logs + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'rituals', v_rituals,
    'reused', v_reused,
    'logs', v_logs,
    'skipped', v_skipped
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke execute on function public.track_lifetime_essence() from authenticated;
revoke execute on function public.longest_full_day_run(uuid) from authenticated;
revoke execute on function public.user_stats(uuid) from authenticated;
revoke execute on function public.evaluate_achievements(uuid) from authenticated;
revoke execute on function public.evaluate_achievements_trigger() from authenticated;
grant execute on function public.my_stats() to authenticated;
-- goals_with_progress (security invoker) converts the creation time to the
-- owner's local day.
grant execute on function public.user_timezone(uuid) to authenticated;
grant execute on function public.save_goal(uuid, text, text, date, integer, uuid[]) to authenticated;
grant execute on function public.import_backup(jsonb) to authenticated;
grant select on public.achievement_definitions to authenticated;
