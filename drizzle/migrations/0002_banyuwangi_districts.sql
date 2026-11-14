-- ===== districts (kecamatan) =====
CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  latitude double precision,
  longitude double precision,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.districts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.districts TO authenticated;
GRANT ALL ON public.districts TO service_role;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads districts" ON public.districts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert districts" ON public.districts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update districts" ON public.districts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete districts" ON public.districts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.districts(name, slug, latitude, longitude, sort_order) VALUES
 ('Banyuwangi','banyuwangi',-8.2192,114.3691,1),
 ('Glagah','glagah',-8.2236,114.3067,2),
 ('Giri','giri',-8.1958,114.3400,3),
 ('Kalipuro','kalipuro',-8.1500,114.3600,4),
 ('Kabat','kabat',-8.2800,114.3300,5),
 ('Rogojampi','rogojampi',-8.3080,114.2850,6),
 ('Srono','srono',-8.3940,114.2700,7),
 ('Muncar','muncar',-8.4300,114.3300,8),
 ('Genteng','genteng',-8.3640,114.1500,9),
 ('Gambiran','gambiran',-8.4050,114.1530,10),
 ('Cluring','cluring',-8.4280,114.2400,11),
 ('Tegalsari','tegalsari',-8.4400,114.1400,12),
 ('Bangorejo','bangorejo',-8.5100,114.1500,13),
 ('Purwoharjo','purwoharjo',-8.4950,114.2400,14),
 ('Tegaldlimo','tegaldlimo',-8.5700,114.3000,15),
 ('Pesanggaran','pesanggaran',-8.5800,114.0500,16),
 ('Siliragung','siliragung',-8.5300,114.1000,17),
 ('Glenmore','glenmore',-8.2800,114.0000,18),
 ('Kalibaru','kalibaru',-8.2900,113.9600,19),
 ('Sempu','sempu',-8.3100,114.1600,20),
 ('Singojuruh','singojuruh',-8.3100,114.2300,21),
 ('Songgon','songgon',-8.2500,114.1900,22),
 ('Licin','licin',-8.2000,114.2400,23),
 ('Wongsorejo','wongsorejo',-8.0000,114.4000,24),
 ('Blimbingsari','blimbingsari',-8.3300,114.3400,25);

-- ===== umkm: Banyuwangi fields =====
ALTER TABLE public.umkm
  ADD COLUMN district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN village text,
  ADD COLUMN full_address text,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN verified_at timestamptz;
CREATE INDEX umkm_district_idx ON public.umkm(district_id);
CREATE INDEX umkm_category_idx ON public.umkm(category_id);
ALTER TABLE public.umkm ALTER COLUMN city SET DEFAULT 'Banyuwangi';

-- Directory shows verified AND pending stores (pending clearly labelled); products stay verified-only.
DROP POLICY "Public reads approved umkm" ON public.umkm;
CREATE POLICY "Public reads listed umkm" ON public.umkm FOR SELECT TO anon, authenticated
  USING (verification_status IN ('approved', 'pending') AND is_active AND NOT is_suspended);

CREATE OR REPLACE FUNCTION public.protect_umkm_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.owner_id := auth.uid();
      NEW.verification_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.is_suspended := false;
      NEW.verified_at := NULL;
    ELSE
      NEW.owner_id := OLD.owner_id;
      NEW.is_suspended := OLD.is_suspended;
      NEW.verified_at := OLD.verified_at;
      IF NOT (OLD.verification_status = 'rejected' AND NEW.verification_status = 'pending') THEN
        NEW.verification_status := OLD.verification_status;
        NEW.rejection_reason := OLD.rejection_reason;
      END IF;
    END IF;
    IF NEW.district_id IS NULL THEN
      RAISE EXCEPTION 'Kecamatan wajib dipilih: hanya UMKM di Kabupaten Banyuwangi yang dapat terdaftar';
    END IF;
  END IF;
  -- Banyuwangi only
  NEW.city := 'Banyuwangi';
  IF (NEW.latitude IS NULL) <> (NEW.longitude IS NULL) THEN
    RAISE EXCEPTION 'Latitude dan longitude harus diisi bersamaan';
  END IF;
  IF NEW.latitude IS NOT NULL AND (NEW.latitude NOT BETWEEN -8.80 AND -7.80 OR NEW.longitude NOT BETWEEN 113.80 AND 114.70) THEN
    RAISE EXCEPTION 'Koordinat berada di luar wilayah Kabupaten Banyuwangi';
  END IF;
  IF NEW.verification_status = 'approved' AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM 'approved') THEN
    NEW.verified_at := COALESCE(NEW.verified_at, now());
  ELSIF NEW.verification_status <> 'approved' THEN
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END; $$;

-- Sign-up: capture Banyuwangi store data from registration metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _name text := COALESCE(NULLIF(_meta->>'full_name', ''), NULLIF(_meta->>'name', ''), split_part(NEW.email, '@', 1));
  _district uuid;
  _category uuid;
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone)
  VALUES (NEW.id, _name, COALESCE(NEW.email, ''), NULLIF(_meta->>'phone', ''));

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  IF _meta->>'account_type' = 'umkm' AND NULLIF(_meta->>'business_name', '') IS NOT NULL THEN
    SELECT id INTO _district FROM public.districts WHERE id::text = _meta->>'district_id';
    SELECT id INTO _category FROM public.categories WHERE id::text = _meta->>'category_id';
    IF _district IS NOT NULL THEN
      INSERT INTO public.umkm(owner_id, business_name, owner_name, whatsapp, description, address, full_address,
                              village, district_id, category_id, verification_status)
      VALUES (NEW.id, left(_meta->>'business_name', 100), _name, COALESCE(_meta->>'phone', ''),
              left(_meta->>'description', 1000), left(_meta->>'full_address', 255), left(_meta->>'full_address', 255),
              left(_meta->>'village', 100), _district, _category, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- ===== convert sample stores to Banyuwangi =====
UPDATE public.umkm SET business_name='Dapur Bu Sari', description='Camilan dan oleh-oleh khas Banyuwangi yang dibuat setiap hari dengan resep keluarga.',
  address='Jl. Raya Rogojampi No. 45', full_address='Jl. Raya Rogojampi No. 45, Desa Rogojampi', village='Rogojampi',
  district_id=(SELECT id FROM districts WHERE slug='rogojampi'), category_id='00000000-0000-4000-a000-0000000000c1',
  latitude=-8.3071, longitude=114.2868 WHERE id='00000000-0000-4000-a000-0000000000a1';
UPDATE public.umkm SET business_name='Batik Gajah Oling Larasati', description='Batik tulis dan cap motif Gajah Oling khas Banyuwangi, dikerjakan perajin Temenggungan.',
  address='Jl. Ikan Wijinongko, Temenggungan', full_address='Jl. Ikan Wijinongko, Kel. Temenggungan', village='Temenggungan',
  district_id=(SELECT id FROM districts WHERE slug='banyuwangi'), category_id='00000000-0000-4000-a000-0000000000c2',
  latitude=-8.2121, longitude=114.3735 WHERE id='00000000-0000-4000-a000-0000000000a2';
UPDATE public.umkm SET business_name='Anyaman Lestari Songgon', description='Kerajinan anyaman pandan dan bambu dari lereng Raung, ramah lingkungan dan tahan lama.',
  address='Dusun Krajan, Songgon', full_address='Dusun Krajan, Desa Songgon', village='Songgon',
  district_id=(SELECT id FROM districts WHERE slug='songgon'), category_id='00000000-0000-4000-a000-0000000000c3',
  latitude=-8.2522, longitude=114.1918 WHERE id='00000000-0000-4000-a000-0000000000a3';
UPDATE public.umkm SET business_name='Kopi Osing Kemiren', owner_name='Pak Suhaimi', description='Kopi robusta dan arabika lereng Ijen yang disangrai tradisional oleh warga Osing Kemiren.',
  address='Jl. Barong, Kemiren', full_address='Jl. Barong, Desa Kemiren', village='Kemiren',
  district_id=(SELECT id FROM districts WHERE slug='glagah'), category_id='00000000-0000-4000-a000-0000000000c5',
  latitude=-8.2153, longitude=114.3254, instagram='https://instagram.com/kopiosingkemiren' WHERE id='00000000-0000-4000-a000-0000000000a4';
UPDATE public.umkm SET business_name='Herbal Ayu Genteng', description='Sabun dan lulur dari rempah pilihan petani Banyuwangi, diracik tanpa bahan kimia keras.',
  address='Jl. Gajah Mada No. 12, Genteng', full_address='Jl. Gajah Mada No. 12, Desa Genteng Kulon', village='Genteng Kulon',
  district_id=(SELECT id FROM districts WHERE slug='genteng'), category_id='00000000-0000-4000-a000-0000000000c4',
  latitude=-8.3667, longitude=114.1502 WHERE id='00000000-0000-4000-a000-0000000000a5';
UPDATE public.umkm SET business_name='Keramik Blambangan', owner_name='Pak Wagiman', description='Gerabah dan keramik hias buatan tangan dengan sentuhan motif Blambangan.',
  address='Jl. Ketapang, Giri', full_address='Jl. Ketapang, Kel. Giri', village='Giri',
  district_id=(SELECT id FROM districts WHERE slug='giri'), category_id='00000000-0000-4000-a000-0000000000c6',
  latitude=-8.1949, longitude=114.3438 WHERE id='00000000-0000-4000-a000-0000000000a6';

UPDATE public.products SET product_name='Kemeja Batik Gajah Oling Pria', description='Kemeja batik cap motif Gajah Oling dengan bahan katun primisima yang adem. Tersedia ukuran M, L, XL.'
  WHERE umkm_id='00000000-0000-4000-a000-0000000000a2' AND product_name LIKE 'Kemeja%';
UPDATE public.products SET product_name='Kain Batik Tulis Gajah Oling', description='Kain batik tulis 2 meter motif Gajah Oling dengan pewarna alami. Setiap lembar dikerjakan 3–4 minggu.'
  WHERE umkm_id='00000000-0000-4000-a000-0000000000a2' AND product_name LIKE 'Kain%';
UPDATE public.products SET product_name='Kopi Lereng Ijen 250 gr', description='Biji kopi lereng Ijen, sangrai medium. Aroma cokelat dan rempah dengan keasaman lembut.'
  WHERE umkm_id='00000000-0000-4000-a000-0000000000a4' AND product_name LIKE 'Kopi%';
UPDATE public.products SET product_name='Madu Hutan Alas Purwo 500 ml', description='Madu hutan liar dari kawasan Alas Purwo. Murni tanpa campuran, kental dan harum.'
  WHERE umkm_id='00000000-0000-4000-a000-0000000000a4' AND product_name LIKE 'Madu%';
UPDATE public.products SET product_name='Pia Kacang Hijau Isi 20' WHERE umkm_id='00000000-0000-4000-a000-0000000000a1' AND product_name LIKE 'Bakpia%';

UPDATE public.site_settings SET site_name='UMKM BANYUWANGI', tagline='Satu Platform, Ribuan Potensi UMKM Banyuwangi.',
  about='UMKM BANYUWANGI adalah pusat informasi, direktori, promosi, dan katalog produk seluruh UMKM di Kabupaten Banyuwangi, Jawa Timur. Dari kopi lereng Ijen, batik Gajah Oling, hingga kerajinan khas Osing — kami membantu pelaku usaha di 25 kecamatan menjangkau lebih banyak pembeli.',
  email='halo@umkmbanyuwangi.id', address='Jl. Ahmad Yani No. 100, Banyuwangi, Jawa Timur',
  instagram='https://instagram.com/umkmbanyuwangi', facebook='https://facebook.com/umkmbanyuwangi', tiktok='https://tiktok.com/@umkmbanyuwangi'
  WHERE id=1;

UPDATE public.banners SET title='Potensi UMKM Banyuwangi', description='Dari Ijen hingga Alas Purwo — temukan produk unggulan 25 kecamatan.', image='/images/banner-banyuwangi.jpg';