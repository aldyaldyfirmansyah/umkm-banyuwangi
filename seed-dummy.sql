insert into public.categories (name, slug, description, icon, sort_order)
values
  ('Makanan & Minuman', 'makanan-minuman', 'Produk kuliner khas Banyuwangi.', 'utensils', 1),
  ('Batik & Fashion', 'batik-fashion', 'Batik dan fashion lokal.', 'shirt', 2),
  ('Kerajinan', 'kerajinan', 'Kerajinan tangan khas daerah.', 'palette', 3),
  ('Kopi & Hasil Bumi', 'kopi-hasil-bumi', 'Kopi dan hasil bumi lokal.', 'coffee', 4)
on conflict (slug) do nothing;

insert into public.umkm
  (business_name, owner_name, city, address, full_address, village,
   description, whatsapp, category_id, verification_status, is_active, is_suspended)
select
  'Kopi Lereng Ijen', 'Budi Santoso', 'Banyuwangi',
  'Jl. Ijen No. 10', 'Jl. Ijen No. 10, Banyuwangi', 'Tamansari',
  'Kopi lokal pilihan dari lereng Gunung Ijen.', '081234567890',
  c.id, 'approved', true, false
from public.categories c
where c.slug = 'kopi-hasil-bumi'
and not exists (
  select 1 from public.umkm
  where business_name = 'Kopi Lereng Ijen'
);

insert into public.umkm
  (business_name, owner_name, city, address, full_address, village,
   description, whatsapp, category_id, verification_status, is_active, is_suspended)
select
  'Batik Gajah Oling', 'Siti Aminah', 'Banyuwangi',
  'Jl. Diponegoro No. 25',
  'Jl. Diponegoro No. 25, Banyuwangi',
  'Kampung Mandar',
  'Batik khas Banyuwangi dengan motif Gajah Oling.',
  '081298765432', c.id, 'approved', true, false
from public.categories c
where c.slug = 'batik-fashion'
and not exists (
  select 1 from public.umkm
  where business_name = 'Batik Gajah Oling'
);

insert into public.products
  (product_name, description, price, stock, umkm_id, category_id,
   image, is_featured, status, moderation_status)
select
  'Kopi Arabika Ijen 250 gram',
  'Kopi arabika pilihan dengan aroma khas dan rasa seimbang.',
  85000, 50, u.id, c.id,
  '/images/p-kopi-gayo.jpg', true, 'active', 'approved'
from public.umkm u
join public.categories c on c.slug = 'kopi-hasil-bumi'
where u.business_name = 'Kopi Lereng Ijen'
and not exists (
  select 1 from public.products
  where product_name = 'Kopi Arabika Ijen 250 gram'
);

insert into public.products
  (product_name, description, price, stock, umkm_id, category_id,
   image, is_featured, status, moderation_status)
select
  'Batik Gajah Oling Tulis',
  'Batik tulis khas Banyuwangi dengan motif tradisional Gajah Oling.',
  275000, 20, u.id, c.id,
  '/images/p-batik-tulis.jpg', true, 'active', 'approved'
from public.umkm u
join public.categories c on c.slug = 'batik-fashion'
where u.business_name = 'Batik Gajah Oling'
and not exists (
  select 1 from public.products
  where product_name = 'Batik Gajah Oling Tulis'
);

insert into public.banners
  (title, description, image, link, sort_order, status)
select
  'Produk Lokal Banyuwangi',
  'Temukan produk unggulan dari UMKM Banyuwangi.',
  '/images/hero-banyuwangi.jpg',
  '/katalog', 1, true
where not exists (
  select 1 from public.banners
  where title = 'Produk Lokal Banyuwangi'
);
