-- Account consistency (SEC-09, COD-13).

-- COD-13: the client no longer creates profiles; make sure every auth user
-- has one (and settings), using the same naming rules as handle_new_user.
insert into public.profiles (id, username)
select
  u.id,
  'initiate_' || left(replace(u.id::text, '-', ''), 12)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select p.id from public.profiles p
where not exists (select 1 from public.user_settings s where s.user_id = p.id)
on conflict (user_id) do nothing;

-- COD-13: the language lives only in profiles.locale.
alter table public.user_settings drop column if exists locale;

-- SEC-09: deleting the account now removes the auth user through the
-- delete-account Edge Function (profiles and every owned row cascade). The
-- old RPC only deleted the profile, which the client then recreated.
drop function if exists public.delete_my_data();
