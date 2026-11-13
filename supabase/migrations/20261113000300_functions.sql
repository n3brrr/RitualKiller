-- Transactional mutations. Clients never send essence or streak values.
create or replace function public.complete_ritual(p_ritual_id uuid, p_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ritual public.rituals%rowtype;
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
  where id = p_ritual_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'ritual not found';
  end if;

  if exists (
    select 1 from public.ritual_logs l
    where l.ritual_id = p_ritual_id
      and (
        (v_ritual.frequency = 'daily' and l.date = p_date)
        or (v_ritual.frequency = 'weekly' and date_trunc('week', l.date) = date_trunc('week', p_date))
      )
  ) then
    return jsonb_build_object('success', false, 'reason', 'already_completed');
  end if;

  if exists (
    select 1 from public.ritual_logs l
    where l.ritual_id = p_ritual_id and l.date = p_date - 1
  ) then
    v_streak := v_ritual.streak + 1;
    v_bonus := 10;
  else
    v_streak := 1;
  end if;

  select coalesce(max(multiplier), 1) into v_multiplier
  from public.active_buffs
  where user_id = auth.uid() and expires_at > now();

  v_total := round((v_ritual.essence_reward + v_bonus) * v_multiplier)::integer;

  insert into public.ritual_logs (ritual_id, user_id, date, essence_gained)
  values (p_ritual_id, auth.uid(), p_date, v_total)
  returning id into v_log_id;

  update public.rituals set streak = v_streak where id = p_ritual_id;
  update public.profiles set essence = essence + v_total where id = auth.uid();

  return jsonb_build_object(
    'success', true,
    'log_id', v_log_id,
    'essence_gained', v_total,
    'streak', v_streak
  );
end;
$$;

create or replace function public.undo_ritual(p_ritual_id uuid, p_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ritual public.rituals%rowtype;
  v_log public.ritual_logs%rowtype;
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

  select * into v_log
  from public.ritual_logs
  where ritual_id = p_ritual_id
    and user_id = auth.uid()
    and (
      (v_ritual.frequency = 'daily' and date = p_date)
      or (v_ritual.frequency = 'weekly' and date_trunc('week', date) = date_trunc('week', p_date))
    )
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'not_completed');
  end if;

  delete from public.ritual_logs where id = v_log.id;
  update public.profiles
    set essence = greatest(essence - v_log.essence_gained, 0)
    where id = auth.uid();

  v_streak := greatest(v_ritual.streak - 1, 0);
  update public.rituals set streak = v_streak where id = p_ritual_id;

  return jsonb_build_object('success', true, 'essence_removed', v_log.essence_gained, 'streak', v_streak);
end;
$$;

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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select quantity into v_quantity
  from public.inventory
  where user_id = auth.uid() and item_id = p_item_id
  for update;

  if not found or v_quantity <= 0 then
    return jsonb_build_object('success', false, 'reason', 'not_owned');
  end if;

  if v_quantity = 1 then
    delete from public.inventory where user_id = auth.uid() and item_id = p_item_id;
  else
    update public.inventory set quantity = quantity - 1
    where user_id = auth.uid() and item_id = p_item_id;
  end if;

  select * into v_item from public.shop_items where id = p_item_id;
  if v_item.effect_type = 'essence_boost' then
    insert into public.active_buffs (user_id, item_id, multiplier, expires_at)
    values (
      auth.uid(),
      p_item_id,
      coalesce(v_item.effect_value, 1.25),
      now() + make_interval(secs => coalesce(v_item.duration_ms, 86400000) / 1000.0)
    );
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- Deletes every row owned by the current user. The auth account is kept.
create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from public.profiles where id = auth.uid();
end;
$$;

create or replace function public.admin_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'rituals', (select count(*) from public.rituals),
    'completions', (select count(*) from public.ritual_logs),
    'activeUsers7d', (
      select count(distinct user_id)
      from public.ritual_logs
      where date >= current_date - 6
    ),
    'pendingReports', (select count(*) from public.reports where status = 'pending')
  );
end;
$$;

create or replace function public.set_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_user_id = auth.uid() and not p_is_admin then
    raise exception 'cannot revoke own admin role';
  end if;
  update public.profiles set is_admin = p_is_admin where id = p_user_id;
end;
$$;

-- In-app reminder. Times are compared in UTC (shortcut: per-user timezone support later).
create or replace function public.ensure_ritual_reminder()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.user_settings%rowtype;
begin
  if auth.uid() is null then
    return;
  end if;

  select * into v_settings from public.user_settings where user_id = auth.uid();
  if not found or not v_settings.notifications_enabled or v_settings.reminder_time > localtime then
    return;
  end if;

  if exists (
    select 1 from public.notifications
    where user_id = auth.uid() and type = 'reminder' and created_at::date = current_date
  ) then
    return;
  end if;

  if not exists (
    select 1 from public.rituals r
    where r.user_id = auth.uid()
      and not exists (
        select 1 from public.ritual_logs l
        where l.ritual_id = r.id and l.date = current_date
      )
  ) then
    return;
  end if;

  insert into public.notifications (user_id, type, title, message)
  values (auth.uid(), 'reminder', 'Rituals pending', 'You still have rituals to complete today.');
end;
$$;
