-- Helper used by RLS policies. SECURITY DEFINER avoids recursive profile policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Users can edit their profile, but never their own essence, admin flag or creation date.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    new.essence := old.essence;
    new.is_admin := old.is_admin;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_user_settings on public.user_settings;
create trigger touch_user_settings
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.rituals enable row level security;
alter table public.ritual_logs enable row level security;
alter table public.inventory enable row level security;
alter table public.active_buffs enable row level security;
alter table public.goals enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;
alter table public.user_achievements enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;
alter table public.shop_items enable row level security;
alter table public.error_logs enable row level security;

-- profiles
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.uid() is not null);
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_self_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "profiles_delete_self_or_admin" on public.profiles
  for delete using (id = auth.uid() or public.is_admin());

-- rituals
create policy "rituals_select_own_or_admin" on public.rituals
  for select using (user_id = auth.uid() or public.is_admin());
create policy "rituals_insert_own" on public.rituals
  for insert with check (user_id = auth.uid());
create policy "rituals_update_own_or_admin" on public.rituals
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "rituals_delete_own_or_admin" on public.rituals
  for delete using (user_id = auth.uid() or public.is_admin());

-- ritual logs
create policy "logs_select_own_or_admin" on public.ritual_logs
  for select using (user_id = auth.uid() or public.is_admin());
create policy "logs_insert_own" on public.ritual_logs
  for insert with check (user_id = auth.uid());
create policy "logs_update_own_or_admin" on public.ritual_logs
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "logs_delete_own_or_admin" on public.ritual_logs
  for delete using (user_id = auth.uid() or public.is_admin());

-- inventory and buffs
create policy "inventory_select_own_or_admin" on public.inventory
  for select using (user_id = auth.uid() or public.is_admin());
create policy "inventory_write_own" on public.inventory
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "buffs_select_own_or_admin" on public.active_buffs
  for select using (user_id = auth.uid() or public.is_admin());
create policy "buffs_write_own" on public.active_buffs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- goals
create policy "goals_select_own_or_admin" on public.goals
  for select using (user_id = auth.uid() or public.is_admin());
create policy "goals_write_own" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- social
create policy "posts_select_authenticated" on public.posts
  for select using (auth.uid() is not null);
create policy "posts_insert_own" on public.posts
  for insert with check (user_id = auth.uid());
create policy "posts_update_own_or_admin" on public.posts
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "posts_delete_own_or_admin" on public.posts
  for delete using (user_id = auth.uid() or public.is_admin());

create policy "likes_select_authenticated" on public.post_likes
  for select using (auth.uid() is not null);
create policy "likes_write_own" on public.post_likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "comments_select_authenticated" on public.comments
  for select using (auth.uid() is not null);
create policy "comments_insert_own" on public.comments
  for insert with check (user_id = auth.uid());
create policy "comments_delete_own_or_admin" on public.comments
  for delete using (user_id = auth.uid() or public.is_admin());

create policy "follows_select_authenticated" on public.follows
  for select using (auth.uid() is not null);
create policy "follows_write_own" on public.follows
  for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "reports_select_own_or_admin" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());
create policy "reports_delete_admin" on public.reports
  for delete using (public.is_admin());

-- achievements, notifications, settings
create policy "achievements_select_own_or_admin" on public.user_achievements
  for select using (user_id = auth.uid() or public.is_admin());
create policy "achievements_insert_own" on public.user_achievements
  for insert with check (user_id = auth.uid());
create policy "achievements_delete_own" on public.user_achievements
  for delete using (user_id = auth.uid());

create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_insert_own" on public.notifications
  for insert with check (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

create policy "settings_select_own" on public.user_settings
  for select using (user_id = auth.uid());
create policy "settings_insert_own" on public.user_settings
  for insert with check (user_id = auth.uid());
create policy "settings_update_own" on public.user_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- catalog and observability
create policy "shop_items_select_authenticated" on public.shop_items
  for select using (auth.uid() is not null);
create policy "error_logs_insert_own" on public.error_logs
  for insert with check (user_id = auth.uid() or user_id is null);
create policy "error_logs_select_admin" on public.error_logs
  for select using (public.is_admin());
