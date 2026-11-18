-- ---------------------------------------------------------------------------
-- Rank on lifetime essence: public profiles expose lifetime_essence so the
-- client ranks other users like the owner (spending never lowers a rank).
-- The column is appended at the end, which `create or replace view` allows.
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles
with (security_barrier = true) as
  select
    p.id,
    p.username,
    p.avatar_url,
    p.essence,
    p.created_at,
    exists (
      select 1 from public.inventory i
      where i.user_id = p.id and i.item_id = 'shadow_amulet' and i.quantity > 0
    ) as shadow_amulet,
    (select coalesce(max(r.best_streak), 0) from public.rituals r where r.user_id = p.id)
      as best_streak,
    (select count(*) from public.rituals r where r.user_id = p.id and r.archived_at is null)::integer
      as active_rituals,
    (select count(*) from public.user_achievements a where a.user_id = p.id)::integer
      as achievements,
    (select count(*) from public.follows f where f.following_id = p.id)::integer as followers,
    (select count(*) from public.follows f where f.follower_id = p.id)::integer as following,
    p.lifetime_essence
  from public.profiles p
  where auth.uid() is not null;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Streaks with gaps-and-islands: one pass over the distinct periods of the
-- ritual instead of one EXISTS query per period. Same result as before: the
-- consecutive periods (days or Monday-based weeks) with a log, counted back
-- from the current period, or from the previous one while the current period
-- is still open. Logs after p_today are ignored.
-- ---------------------------------------------------------------------------
create or replace function public.compute_streak(p_ritual_id uuid, p_today date)
returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  v_frequency text;
  v_step integer;
  v_current date;
  v_top date;
  v_count integer;
begin
  select frequency into v_frequency from public.rituals where id = p_ritual_id;
  if not found then
    return 0;
  end if;
  v_step := case when v_frequency = 'weekly' then 7 else 1 end;
  v_current := public.ritual_period_start(v_frequency, p_today);

  with periods as (
    select distinct public.ritual_period_start(v_frequency, date) as period
    from public.ritual_logs
    where ritual_id = p_ritual_id and date <= p_today
  ),
  ranked as (
    select period, row_number() over (order by period desc) as position
    from periods
  ),
  top as (
    select max(period) as period from periods
  )
  select (select period from top),
         count(*) filter (
           where r.period = (select period from top) - ((r.position - 1) * v_step)::integer
         )
    into v_top, v_count
  from ranked r;

  -- The newest period must be the current one, or the previous one (still open).
  if v_top is null or v_top < v_current - v_step then
    return 0;
  end if;
  return coalesce(v_count, 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Social notifications: likes, comments and new followers. Written by
-- SECURITY DEFINER triggers (clients cannot insert notifications). A user is
-- never notified about their own actions, repeated unread events from the same
-- person are collapsed, and notifications_enabled = false silences them.
-- ---------------------------------------------------------------------------
create or replace function public.notify_social_event(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
begin
  if p_user_id is null or p_user_id = p_actor_id then
    return;
  end if;
  if not coalesce(
    (select notifications_enabled from public.user_settings where user_id = p_user_id),
    true
  ) then
    return;
  end if;

  select username into v_actor from public.profiles where id = p_actor_id;
  if v_actor is null then
    return;
  end if;

  if p_type <> 'comment' and exists (
    select 1 from public.notifications n
    where n.user_id = p_user_id
      and n.type = p_type
      and n.read = false
      and n.data ->> 'actorId' = p_actor_id::text
      and coalesce(n.data ->> 'postId', '') = coalesce(p_data ->> 'postId', '')
  ) then
    return;
  end if;

  insert into public.notifications (user_id, type, title, message, data)
  values (
    p_user_id,
    p_type,
    p_title,
    v_actor,
    p_data || jsonb_build_object('actorId', p_actor_id, 'actorName', v_actor)
  );
end;
$$;

create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_social_event(
    (select user_id from public.posts where id = new.post_id),
    new.user_id,
    'like',
    'New like',
    jsonb_build_object('postId', new.post_id)
  );
  return new;
end;
$$;

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_social_event(
    (select user_id from public.posts where id = new.post_id),
    new.user_id,
    'comment',
    'New comment',
    jsonb_build_object('postId', new.post_id)
  );
  return new;
end;
$$;

create or replace function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_social_event(
    new.following_id,
    new.follower_id,
    'follow',
    'New follower',
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists notify_post_like on public.post_likes;
create trigger notify_post_like
  after insert on public.post_likes
  for each row execute function public.notify_post_like();

drop trigger if exists notify_post_comment on public.comments;
create trigger notify_post_comment
  after insert on public.comments
  for each row execute function public.notify_post_comment();

drop trigger if exists notify_new_follower on public.follows;
create trigger notify_new_follower
  after insert on public.follows
  for each row execute function public.notify_new_follower();

revoke all on function public.notify_social_event(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.notify_post_like() from public, anon, authenticated;
revoke all on function public.notify_post_comment() from public, anon, authenticated;
revoke all on function public.notify_new_follower() from public, anon, authenticated;
