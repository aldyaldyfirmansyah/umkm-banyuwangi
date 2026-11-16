-- Jalankan file ini di Supabase Dashboard > SQL Editor > Run.
-- Pastikan ketiga akun sudah dibuat di Authentication > Users.

insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role
from auth.users u
where u.email = 'admin@umkmbanyuwangi.test'
and not exists (
  select 1
  from public.user_roles r
  where r.user_id = u.id
    and r.role = 'admin'::app_role
);

insert into public.user_roles (user_id, role)
select u.id, 'umkm'::app_role
from auth.users u
where u.email = 'seller@umkmbanyuwangi.test'
and not exists (
  select 1
  from public.user_roles r
  where r.user_id = u.id
    and r.role = 'umkm'::app_role
);

insert into public.user_roles (user_id, role)
select u.id, 'user'::app_role
from auth.users u
where u.email = 'pembeli@umkmbanyuwangi.test'
and not exists (
  select 1
  from public.user_roles r
  where r.user_id = u.id
    and r.role = 'user'::app_role
);

select
  u.email,
  r.role,
  r.created_at
from auth.users u
left join public.user_roles r on r.user_id = u.id
where u.email in (
  'admin@umkmbanyuwangi.test',
  'seller@umkmbanyuwangi.test',
  'pembeli@umkmbanyuwangi.test'
)
order by u.email;
