-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'umkm', 'user');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.product_status AS ENUM ('active', 'inactive');
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'hidden');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Read own profile or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Update own profile or admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_active := OLD.is_active;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- ===== categories =====
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT 'Package',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== umkm =====
CREATE TABLE public.umkm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  business_name text NOT NULL,
  owner_name text NOT NULL DEFAULT '',
  description text,
  logo text,
  address text,
  city text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  instagram text,
  facebook text,
  tiktok text,
  opening_hours text,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  is_active boolean NOT NULL DEFAULT true,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX umkm_owner_unique ON public.umkm(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX umkm_city_idx ON public.umkm(city);
GRANT SELECT ON public.umkm TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.umkm TO authenticated;
GRANT ALL ON public.umkm TO service_role;
ALTER TABLE public.umkm ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.umkm_is_public(_umkm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.umkm WHERE id = _umkm_id
    AND verification_status = 'approved' AND is_active AND NOT is_suspended)
$$;
CREATE OR REPLACE FUNCTION public.owns_umkm(_umkm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.umkm WHERE id = _umkm_id AND owner_id = auth.uid())
$$;
GRANT EXECUTE ON FUNCTION public.umkm_is_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_umkm(uuid) TO authenticated;

CREATE POLICY "Public reads approved umkm" ON public.umkm FOR SELECT TO anon, authenticated
  USING (verification_status = 'approved' AND is_active AND NOT is_suspended);
CREATE POLICY "Owner reads own umkm" ON public.umkm FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admin reads all umkm" ON public.umkm FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner creates own umkm" ON public.umkm FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin updates umkm" ON public.umkm FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes umkm" ON public.umkm FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_umkm_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.owner_id := auth.uid();
      NEW.verification_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.is_suspended := false;
    ELSE
      NEW.owner_id := OLD.owner_id;
      NEW.is_suspended := OLD.is_suspended;
      -- owners may only re-submit a rejected store for review
      IF NOT (OLD.verification_status = 'rejected' AND NEW.verification_status = 'pending') THEN
        NEW.verification_status := OLD.verification_status;
        NEW.rejection_reason := OLD.rejection_reason;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER umkm_protect BEFORE INSERT OR UPDATE ON public.umkm
  FOR EACH ROW EXECUTE FUNCTION public.protect_umkm_fields();
CREATE TRIGGER umkm_updated_at BEFORE UPDATE ON public.umkm
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.grant_umkm_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.owner_id, 'umkm') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER umkm_grant_role AFTER INSERT ON public.umkm
  FOR EACH ROW EXECUTE FUNCTION public.grant_umkm_role();

-- ===== products =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  umkm_id uuid NOT NULL REFERENCES public.umkm(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image text,
  images text[] NOT NULL DEFAULT '{}',
  status public.product_status NOT NULL DEFAULT 'active',
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  is_featured boolean NOT NULL DEFAULT false,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_umkm_idx ON public.products(umkm_id);
CREATE INDEX products_category_idx ON public.products(category_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads visible products" ON public.products FOR SELECT TO anon, authenticated
  USING (status = 'active' AND moderation_status = 'approved' AND public.umkm_is_public(umkm_id));
CREATE POLICY "Owner reads own products" ON public.products FOR SELECT TO authenticated USING (public.owns_umkm(umkm_id));
CREATE POLICY "Admin reads all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin inserts products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.owns_umkm(umkm_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin updates products" ON public.products FOR UPDATE TO authenticated
  USING (public.owns_umkm(umkm_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.owns_umkm(umkm_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin deletes products" ON public.products FOR DELETE TO authenticated
  USING (public.owns_umkm(umkm_id) OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_product_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.moderation_status := 'pending';
      NEW.is_featured := false;
      NEW.views := 0;
    ELSE
      NEW.moderation_status := OLD.moderation_status;
      NEW.is_featured := OLD.is_featured;
      NEW.views := OLD.views;
      NEW.umkm_id := OLD.umkm_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER products_protect BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.protect_product_fields();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_product_view(_product_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.products SET views = views + 1
  WHERE id = _product_id AND status = 'active' AND moderation_status = 'approved';
$$;
GRANT EXECUTE ON FUNCTION public.increment_product_view(uuid) TO anon, authenticated;

-- ===== banners =====
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image text,
  link text,
  status boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active banners" ON public.banners FOR SELECT TO anon, authenticated USING (status = true);
CREATE POLICY "Admin reads banners" ON public.banners FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin inserts banners" ON public.banners FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates banners" ON public.banners FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes banners" ON public.banners FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== site_settings =====
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name text NOT NULL DEFAULT 'UMKM HUB',
  tagline text,
  about text,
  email text,
  phone text,
  whatsapp text,
  address text,
  instagram text,
  facebook text,
  tiktok text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin updates settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== new user handling =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _name text := COALESCE(NULLIF(_meta->>'full_name', ''), NULLIF(_meta->>'name', ''), split_part(NEW.email, '@', 1));
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone)
  VALUES (NEW.id, _name, COALESCE(NEW.email, ''), NULLIF(_meta->>'phone', ''));

  -- The very first account becomes the platform admin.
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF _meta->>'account_type' = 'umkm' AND NULLIF(_meta->>'business_name', '') IS NOT NULL THEN
    INSERT INTO public.umkm(owner_id, business_name, owner_name, city, whatsapp, verification_status)
    VALUES (NEW.id, _meta->>'business_name', _name, COALESCE(_meta->>'city', ''),
            COALESCE(_meta->>'phone', ''), 'pending');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== storage policies (bucket: media) =====
CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

-- ===== seed data =====
INSERT INTO public.site_settings(id, site_name, tagline, about, email, phone, whatsapp, address, instagram, facebook, tiktok)
VALUES (1, 'UMKM HUB', 'Dukung Produk Lokal, Majukan UMKM Indonesia',
 'UMKM HUB adalah platform digital yang mempertemukan pelaku Usaha Mikro, Kecil, dan Menengah dengan calon pembeli di seluruh Indonesia. Kami membantu UMKM memasarkan produk secara online dan memudahkan masyarakat menemukan produk lokal berkualitas.',
 'halo@umkmhub.id', '(021) 5000 1234', '6281200001234', 'Jl. Merdeka No. 10, Jakarta Pusat',
 'https://instagram.com/umkmhub', 'https://facebook.com/umkmhub', 'https://tiktok.com/@umkmhub');

INSERT INTO public.categories(id, name, slug, description, icon, sort_order) VALUES
 ('00000000-0000-4000-a000-0000000000c1', 'Makanan dan Minuman', 'makanan-minuman', 'Camilan, oleh-oleh, dan minuman khas daerah', 'UtensilsCrossed', 1),
 ('00000000-0000-4000-a000-0000000000c2', 'Fashion dan Pakaian', 'fashion-pakaian', 'Batik, tenun, dan busana karya perajin lokal', 'Shirt', 2),
 ('00000000-0000-4000-a000-0000000000c3', 'Kerajinan Tangan', 'kerajinan-tangan', 'Anyaman, ukiran, dan kriya buatan tangan', 'Scissors', 3),
 ('00000000-0000-4000-a000-0000000000c4', 'Kecantikan dan Perawatan', 'kecantikan-perawatan', 'Perawatan tubuh dari bahan alami', 'Sparkles', 4),
 ('00000000-0000-4000-a000-0000000000c5', 'Produk Pertanian', 'produk-pertanian', 'Kopi, madu, rempah, dan hasil bumi', 'Wheat', 5),
 ('00000000-0000-4000-a000-0000000000c6', 'Produk Rumah Tangga', 'produk-rumah-tangga', 'Perabot dan dekorasi rumah', 'Home', 6),
 ('00000000-0000-4000-a000-0000000000c7', 'Lainnya', 'lainnya', 'Produk UMKM lainnya', 'Package', 7);

INSERT INTO public.umkm(id, business_name, owner_name, description, address, city, whatsapp, instagram, opening_hours, verification_status) VALUES
 ('00000000-0000-4000-a000-0000000000a1', 'Dapur Bu Sari', 'Sari Wulandari', 'Oleh-oleh khas Yogyakarta yang dibuat setiap hari dengan resep keluarga sejak 1998.', 'Jl. Kaliurang Km 5, Sleman', 'Yogyakarta', '6281234500001', 'https://instagram.com/dapurbusari', 'Senin–Sabtu, 08.00–17.00', 'approved'),
 ('00000000-0000-4000-a000-0000000000a2', 'Batik Larasati', 'Laras Kusuma', 'Batik tulis dan cap motif pesisiran yang dikerjakan oleh perajin Pekalongan.', 'Jl. Hayam Wuruk No. 21', 'Pekalongan', '6281234500002', 'https://instagram.com/batiklarasati', 'Setiap hari, 09.00–18.00', 'approved'),
 ('00000000-0000-4000-a000-0000000000a3', 'Anyaman Lestari', 'Dedi Supriatna', 'Kerajinan anyaman pandan dan rotan dari Tasikmalaya, ramah lingkungan dan tahan lama.', 'Kp. Rajapolah No. 7', 'Tasikmalaya', '6281234500003', NULL, 'Senin–Jumat, 08.00–16.00', 'approved'),
 ('00000000-0000-4000-a000-0000000000a4', 'Kopi Gayo Nusantara', 'Teuku Rahmat', 'Kopi arabika dan madu hutan langsung dari petani dataran tinggi Gayo.', 'Jl. Lintas Takengon', 'Aceh Tengah', '6281234500004', 'https://instagram.com/kopigayonusantara', 'Senin–Sabtu, 08.00–20.00', 'approved'),
 ('00000000-0000-4000-a000-0000000000a5', 'Herbal Ayu', 'Ayu Pratiwi', 'Sabun dan lulur dari rempah pilihan, diracik tanpa bahan kimia keras.', 'Jl. Slamet Riyadi No. 88', 'Surakarta', '6281234500005', NULL, 'Senin–Sabtu, 09.00–17.00', 'approved'),
 ('00000000-0000-4000-a000-0000000000a6', 'Gerabah Kasongan', 'Pak Wagiman', 'Gerabah dan keramik hias buatan tangan dari sentra Kasongan, Bantul.', 'Desa Kasongan, Kasihan', 'Bantul', '6281234500006', NULL, 'Setiap hari, 08.00–17.00', 'approved');

INSERT INTO public.products(umkm_id, category_id, product_name, description, price, stock, image, images, status, moderation_status, is_featured, views, created_at) VALUES
 ('00000000-0000-4000-a000-0000000000a1', '00000000-0000-4000-a000-0000000000c1', 'Bakpia Kacang Hijau Isi 20', 'Bakpia lembut dengan isian kacang hijau manis gurih. Dipanggang setiap pagi tanpa pengawet. Tahan 5 hari pada suhu ruang.', 45000, 120, '/images/p-bakpia.jpg', ARRAY['/images/p-bakpia.jpg'], 'active', 'approved', true, 342, now() - interval '20 days'),
 ('00000000-0000-4000-a000-0000000000a1', '00000000-0000-4000-a000-0000000000c1', 'Keripik Tempe Renyah 250 gr', 'Keripik tempe tipis dengan bumbu bawang dan daun jeruk. Renyah, gurih, cocok untuk camilan keluarga.', 25000, 80, '/images/p-keripik.jpg', ARRAY['/images/p-keripik.jpg'], 'active', 'approved', false, 156, now() - interval '3 days'),
 ('00000000-0000-4000-a000-0000000000a2', '00000000-0000-4000-a000-0000000000c2', 'Kemeja Batik Pria Lengan Panjang', 'Kemeja batik cap motif parang dengan bahan katun primisima yang adem. Tersedia ukuran M, L, XL.', 275000, 35, '/images/p-batik-kemeja.jpg', ARRAY['/images/p-batik-kemeja.jpg'], 'active', 'approved', true, 410, now() - interval '15 days'),
 ('00000000-0000-4000-a000-0000000000a2', '00000000-0000-4000-a000-0000000000c2', 'Kain Batik Tulis Motif Pesisir', 'Kain batik tulis 2 meter dengan pewarna alami. Setiap lembar dikerjakan 3–4 minggu oleh perajin.', 650000, 8, '/images/p-batik-tulis.jpg', ARRAY['/images/p-batik-tulis.jpg'], 'active', 'approved', true, 288, now() - interval '9 days'),
 ('00000000-0000-4000-a000-0000000000a3', '00000000-0000-4000-a000-0000000000c3', 'Tas Anyaman Pandan Natural', 'Tas jinjing dari anyaman daun pandan dengan lapisan kain di bagian dalam. Ringan dan kuat.', 135000, 40, '/images/p-tas-pandan.jpg', ARRAY['/images/p-tas-pandan.jpg'], 'active', 'approved', true, 199, now() - interval '12 days'),
 ('00000000-0000-4000-a000-0000000000a3', '00000000-0000-4000-a000-0000000000c6', 'Keranjang Rotan Serbaguna', 'Keranjang rotan anyam tangan untuk penyimpanan atau dekorasi. Diameter 30 cm.', 95000, 0, '/images/p-keranjang-rotan.jpg', ARRAY['/images/p-keranjang-rotan.jpg'], 'active', 'approved', false, 87, now() - interval '30 days'),
 ('00000000-0000-4000-a000-0000000000a4', '00000000-0000-4000-a000-0000000000c5', 'Kopi Arabika Gayo 250 gr', 'Biji kopi arabika single origin Gayo, sangrai medium. Aroma cokelat dan buah dengan keasaman lembut.', 85000, 60, '/images/p-kopi-gayo.jpg', ARRAY['/images/p-kopi-gayo.jpg'], 'active', 'approved', true, 523, now() - interval '6 days'),
 ('00000000-0000-4000-a000-0000000000a4', '00000000-0000-4000-a000-0000000000c5', 'Madu Hutan Murni 500 ml', 'Madu hutan liar yang dipanen petani lokal. Murni tanpa campuran, kental dan harum.', 120000, 25, '/images/p-madu.jpg', ARRAY['/images/p-madu.jpg'], 'active', 'approved', false, 241, now() - interval '2 days'),
 ('00000000-0000-4000-a000-0000000000a5', '00000000-0000-4000-a000-0000000000c4', 'Sabun Herbal Sereh & Kunyit', 'Sabun batang cold process dengan minyak kelapa, sereh, dan kunyit. Lembut untuk kulit sensitif.', 30000, 150, '/images/p-sabun.jpg', ARRAY['/images/p-sabun.jpg'], 'active', 'approved', true, 176, now() - interval '5 days'),
 ('00000000-0000-4000-a000-0000000000a5', '00000000-0000-4000-a000-0000000000c4', 'Lulur Tradisional Rempah 200 gr', 'Lulur dari beras, temulawak, dan bengkuang untuk kulit cerah dan halus. Resep keraton Solo.', 55000, 70, '/images/p-lulur.jpg', ARRAY['/images/p-lulur.jpg'], 'active', 'approved', false, 98, now() - interval '1 days'),
 ('00000000-0000-4000-a000-0000000000a6', '00000000-0000-4000-a000-0000000000c6', 'Vas Gerabah Terakota', 'Vas gerabah tinggi 35 cm dengan finishing terakota alami. Cocok untuk bunga kering.', 110000, 18, '/images/p-vas.jpg', ARRAY['/images/p-vas.jpg'], 'active', 'approved', true, 134, now() - interval '18 days'),
 ('00000000-0000-4000-a000-0000000000a6', '00000000-0000-4000-a000-0000000000c6', 'Set Piring Keramik Glasir Hijau', 'Set 4 piring keramik glasir hijau sage buatan tangan. Aman untuk makanan dan microwave.', 240000, 12, '/images/p-piring.jpg', ARRAY['/images/p-piring.jpg'], 'active', 'approved', false, 112, now() - interval '4 days');

INSERT INTO public.banners(title, description, image, link, status, sort_order) VALUES
 ('Festival Produk Lokal', 'Temukan ratusan produk pilihan dari UMKM di seluruh Nusantara.', '/images/hero.jpg', '/katalog', true, 1);
