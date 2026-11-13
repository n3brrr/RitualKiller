# Migraciones Supabase

Aplica las migraciones con la CLI de Supabase (`supabase db push`) o pegando los
archivos en el SQL Editor del proyecto, en orden.

El trigger `handle_new_user` crea el perfil y los settings al registrarse. Para
proyectos que ya tengan usuarios, ejecuta una sola vez:

```sql
insert into public.profiles (id, username)
select id, split_part(coalesce(email, 'initiate'), '@', 1)
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
```

El primer administrador se promociona desde el SQL Editor:

```sql
update public.profiles set is_admin = true where username = 'tu_usuario';
```
