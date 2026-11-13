-- RitualKiller schema. Run with `supabase db push` or the SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(username) between 2 and 30),
  avatar_url text,
  essence integer not null default 0 check (essence >= 0),
  is_admin boolean not null default false,
  locale text not null default 'es' check (locale in ('es', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create table if not exists public.rituals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  difficulty text not null check (difficulty in ('novice', 'adept', 'master')),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  streak integer not null default 0 check (streak >= 0),
  essence_reward integer not null default 10 check (essence_reward between 0 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists rituals_user_idx on public.rituals (user_id);

create table if not exists public.ritual_logs (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references public.rituals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  essence_gained integer not null default 0 check (essence_gained >= 0),
  created_at timestamptz not null default now(),
  unique (ritual_id, date)
);

create index if not exists ritual_logs_user_date_idx
  on public.ritual_logs (user_id, date);

create table if not exists public.inventory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  quantity integer not null default 0 check (quantity >= 0),
  primary key (user_id, item_id)
);

create table if not exists public.active_buffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  multiplier numeric(4, 2) not null default 1 check (multiplier > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists active_buffs_user_idx on public.active_buffs (user_id, expires_at);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  target_date date not null,
  target_value integer not null default 100 check (target_value > 0),
  progress integer not null default 0 check (progress >= 0),
  ritual_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (post_id is not null or target_user_id is not null)
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  notifications_enabled boolean not null default true,
  reminder_time time not null default '20:00',
  locale text not null default 'es' check (locale in ('es', 'en')),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_items (
  id text primary key,
  name text not null,
  description text not null default '',
  cost integer not null check (cost >= 0),
  rarity text not null check (rarity in ('common', 'rare', 'legendary')),
  effect_type text check (effect_type in ('essence_boost', 'restore_streak', 'cosmetic', 'unlock_master')),
  effect_value numeric(4, 2),
  duration_ms bigint,
  created_at timestamptz not null default now()
);

insert into public.shop_items (id, name, description, cost, rarity, effect_type, effect_value, duration_ms)
values
  ('potion_discipline', 'Elixir of Discipline', 'Grants +50% essence for 24 hours.', 500, 'rare', 'essence_boost', 1.5, 86400000),
  ('potion_oblivion', 'Potion of Oblivion', 'Restores a lost streak.', 1000, 'legendary', 'restore_streak', null, 0),
  ('shadow_amulet', 'Shadow Amulet', 'A cosmetic mark of the void.', 2500, 'rare', 'cosmetic', null, -1),
  ('binding_contract', 'Binding Contract', 'Unlocks master-level rituals.', 5000, 'legendary', 'unlock_master', null, -1)
on conflict (id) do nothing;

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  message text not null,
  stack text,
  context jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Creates the profile and default settings for every new auth user.
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
begin
  base_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(coalesce(new.email, 'initiate'), '@', 1));
  base_name := left(regexp_replace(base_name, '[^a-zA-Z0-9_]+', '_', 'g'), 24);
  if char_length(base_name) < 2 then
    base_name := 'initiate';
  end if;
  candidate := base_name;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := base_name || suffix::text;
  end loop;

  insert into public.profiles (id, username)
  values (new.id, candidate)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
