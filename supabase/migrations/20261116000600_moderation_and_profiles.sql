-- Moderation tools and public profiles (UX-08, UX-09, UX-11).

-- ---------------------------------------------------------------------------
-- Suspensions: a suspended user can still use the app but cannot post,
-- comment, report or follow until the suspension ends.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists suspended_until timestamptz;

create or replace function public.is_suspended(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select suspended_until > now() from public.profiles where id = p_user_id),
    false
  );
$$;

grant execute on function public.is_suspended(uuid) to authenticated;

-- The profile trigger must also keep suspended_until out of users' reach.
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
    new.lifetime_essence := old.lifetime_essence;
    new.is_admin := old.is_admin;
    new.suspended_until := old.suspended_until;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (
    user_id = auth.uid()
    and not public.is_suspended(auth.uid())
    and (is_system = false or public.is_admin())
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (user_id = auth.uid() and not public.is_suspended(auth.uid()));

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (
    reporter_id = auth.uid() and not public.is_suspended(auth.uid())
  );

drop policy if exists "follows_write_own" on public.follows;
create policy "follows_delete_own" on public.follows
  for delete using (follower_id = auth.uid());
create policy "follows_insert_own" on public.follows
  for insert with check (
    follower_id = auth.uid() and not public.is_suspended(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Audit trail of moderation actions (admins only).
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('delete_post', 'delete_comment', 'suspend', 'unsuspend')),
  target_user_id uuid references public.profiles (id) on delete set null,
  report_id uuid references public.reports (id) on delete set null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.moderation_actions enable row level security;
create policy "moderation_actions_select_admin" on public.moderation_actions
  for select using (public.is_admin());

-- Reports with the context a moderator needs (security invoker: admins only
-- see rows because reports are admin-readable).
create or replace view public.report_details
with (security_invoker = true) as
  select
    r.*,
    reporter.username as reporter_name,
    post.content as post_content,
    post.user_id as post_author_id,
    author.username as post_author_name,
    coalesce(post.user_id, r.target_user_id) as reported_user_id,
    reported.username as reported_user_name,
    reported.suspended_until as reported_suspended_until
  from public.reports r
  left join public.profiles reporter on reporter.id = r.reporter_id
  left join public.posts post on post.id = r.post_id
  left join public.profiles author on author.id = post.user_id
  left join public.profiles reported on reported.id = coalesce(post.user_id, r.target_user_id);

grant select on public.report_details to authenticated;

create or replace function public.admin_delete_post(p_post_id uuid, p_report_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  select user_id into v_author from public.posts where id = p_post_id;
  if not found then
    raise exception 'post not found';
  end if;

  insert into public.moderation_actions (admin_id, action, target_user_id, report_id, details)
  values (auth.uid(), 'delete_post', v_author, p_report_id, jsonb_build_object('post_id', p_post_id));
  -- Reports of the post are resolved before it disappears (they cascade).
  update public.reports set status = 'resolved' where post_id = p_post_id;
  delete from public.posts where id = p_post_id;
end;
$$;

create or replace function public.admin_delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  delete from public.comments where id = p_comment_id returning user_id into v_author;
  if v_author is null then
    raise exception 'comment not found';
  end if;
  insert into public.moderation_actions (admin_id, action, target_user_id, details)
  values (auth.uid(), 'delete_comment', v_author, jsonb_build_object('comment_id', p_comment_id));
end;
$$;

-- p_days = 0 lifts the suspension.
create or replace function public.admin_suspend_user(
  p_user_id uuid,
  p_days integer,
  p_report_id uuid default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot suspend yourself';
  end if;
  if exists (select 1 from public.profiles where id = p_user_id and is_admin) then
    raise exception 'cannot suspend an admin';
  end if;
  if p_days < 0 or p_days > 365 then
    raise exception 'invalid suspension length';
  end if;

  v_until := case when p_days = 0 then null else now() + make_interval(days => p_days) end;
  update public.profiles set suspended_until = v_until where id = p_user_id;
  if not found then
    raise exception 'user not found';
  end if;

  insert into public.moderation_actions (admin_id, action, target_user_id, report_id, details)
  values (
    auth.uid(),
    case when p_days = 0 then 'unsuspend' else 'suspend' end,
    p_user_id,
    p_report_id,
    jsonb_build_object('days', p_days)
  );
  if p_report_id is not null then
    update public.reports set status = 'resolved' where id = p_report_id;
  end if;
  return v_until;
end;
$$;

-- ---------------------------------------------------------------------------
-- UX-11: richer public profiles, looked up case-insensitively.
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
    (select count(*) from public.follows f where f.follower_id = p.id)::integer as following
  from public.profiles p
  where auth.uid() is not null;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated;

create or replace function public.get_public_profile(p_username text)
returns setof public.public_profiles
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.public_profiles where lower(username) = lower(trim(p_username)) limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.admin_delete_post(uuid, uuid) to authenticated;
grant execute on function public.admin_delete_comment(uuid) to authenticated;
grant execute on function public.admin_suspend_user(uuid, integer, uuid) to authenticated;
grant execute on function public.get_public_profile(text) to authenticated;
