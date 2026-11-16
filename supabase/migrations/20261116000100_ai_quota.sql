-- Per-user quota for server-side AI calls (supabase/functions/ai-suggest-rituals).
-- The table has RLS enabled and no policies: only the SECURITY DEFINER function
-- below can read or write it.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create or replace function public.consume_ai_quota(p_limit_per_hour integer default 20)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  delete from public.ai_usage
  where user_id = auth.uid() and created_at < now() - interval '1 day';

  if (
    select count(*) from public.ai_usage
    where user_id = auth.uid() and created_at > now() - interval '1 hour'
  ) >= least(greatest(p_limit_per_hour, 1), 20) then
    raise exception 'quota_exceeded';
  end if;

  insert into public.ai_usage (user_id) values (auth.uid());
end;
$$;

revoke execute on function public.consume_ai_quota(integer) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;
