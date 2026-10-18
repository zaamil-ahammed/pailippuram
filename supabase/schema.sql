-- Nammude Pailippuram: database setup & migration.
-- Run this whole file once in Supabase > SQL Editor > New query > Run.
-- Safe rule of the house: visitors can only READ rows with status = 'approved'.
-- Only people listed in the `admins` table can add, edit, hide or delete.

-- ---------- Schema Migrations (Safe to run on existing databases) ----------
-- If your database was created earlier, run these lines to ensure photo_url columns exist:
alter table if exists listings add column if not exists photo_url text;
alter table if exists panchayath_items add column if not exists photo_url text;
alter table if exists donors add column if not exists photo_url text;
alter table if exists submissions add column if not exists photo_url text;
alter table if exists bus_routes add column if not exists direction text;
notify pgrst, 'reload schema';

-- ---------- Tables ----------

create table if not exists categories (
  id serial primary key,
  kind text not null check (kind in ('contact', 'business', 'worker', 'transport')),
  name text not null,
  name_ml text,
  unique (kind, name)
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'business', 'worker', 'transport')),
  title text not null check (char_length(title) between 2 and 120),
  category_id int references categories(id) on delete set null,
  photo_url text,
  description text check (char_length(description) <= 600),
  phone text check (char_length(phone) <= 20),
  whatsapp text check (char_length(whatsapp) <= 20),
  area text check (char_length(area) <= 80),
  hours text check (char_length(hours) <= 80),
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  body text check (char_length(body) <= 1500),
  event_date date,
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists bus_routes (
  id uuid primary key default gen_random_uuid(),
  route text not null check (char_length(route) between 2 and 120),
  direction text check (char_length(direction) <= 80),
  bus_name text check (char_length(bus_name) <= 80),
  times text check (char_length(times) <= 800),
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists donors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  photo_url text,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone text check (char_length(phone) <= 20),
  area text check (char_length(area) <= 80),
  available boolean not null default true,
  -- A donor may only be listed if they agreed to it.
  consent boolean not null default true check (consent),
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists panchayath_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('bearer', 'ward', 'service', 'notice')),
  title text not null check (char_length(title) between 2 and 120),
  photo_url text,
  detail text check (char_length(detail) <= 1000),
  extra text check (char_length(extra) <= 80), -- a phone number or a date
  status text not null default 'approved' check (status in ('approved', 'hidden')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- What visitors send in. Never shown publicly; admins review it.
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('business','contact','worker','transport','announcement','donor','bus','other','correction','removal')),
  title text not null check (char_length(title) between 2 and 120),
  photo_url text,
  description text check (char_length(description) <= 1500),
  phone text check (char_length(phone) <= 20),
  area text check (char_length(area) <= 80),
  submitter_contact text check (char_length(submitter_contact) <= 120),
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','handled')),
  created_at timestamptz not null default now()
);

-- Admin list. No policies on purpose: nobody can read it from the website.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Who changed what. Admin-only.
create table if not exists audit_logs (
  id bigserial primary key,
  admin_id uuid default auth.uid(),
  admin_email text,
  action text not null,
  table_name text,
  row_id text,
  note text,
  changes jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Helpers ----------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------- Row Level Security ----------

alter table categories enable row level security;
create policy "anyone reads categories" on categories for select using (true);
create policy "admins manage categories" on categories for all
  using (is_admin()) with check (is_admin());

do $$
declare t text;
begin
  foreach t in array array['listings','announcements','bus_routes','donors','panchayath_items'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public reads live rows" on %I for select using (status = ''approved'')', t);
    execute format('create policy "admins read all" on %I for select using (is_admin())', t);
    execute format('create policy "admins add" on %I for insert with check (is_admin())', t);
    execute format('create policy "admins edit" on %I for update using (is_admin()) with check (is_admin())', t);
    execute format('create policy "admins delete" on %I for delete using (is_admin())', t);
    execute format('create trigger touch_%1$s before update on %1$I for each row execute function touch_updated_at()', t);
  end loop;
end $$;

alter table submissions enable row level security;
-- Note: Visitors can insert pending submissions. Because only admins can SELECT from submissions,
-- inserts from anonymous visitors must not use .select() (return=minimal); chaining .select()
-- causes PostgREST to return the row which triggers the SELECT policy and throws an RLS error.
create policy "anyone can send a submission" on submissions for insert
  with check (status = 'pending');
create policy "admins read submissions" on submissions for select using (is_admin());
create policy "admins update submissions" on submissions for update
  using (is_admin()) with check (is_admin());
create policy "admins delete submissions" on submissions for delete using (is_admin());

alter table admins enable row level security;

alter table audit_logs enable row level security;
create policy "admins read log" on audit_logs for select using (is_admin());
create policy "admins write log" on audit_logs for insert
  with check (is_admin() and admin_id = auth.uid());

-- ---------- Starter categories (edit freely) ----------

insert into categories (kind, name, name_ml) values
  ('contact', 'Government Hospital / PHC', 'സർക്കാർ ആശുപത്രി / പി.എച്ച്.സി'),
  ('contact', 'Police Station', 'പോലീസ് സ്റ്റേഷൻ'),
  ('contact', 'Fire & Rescue Services', 'ഫയർ & റെസ്ക്യൂ സർവീസ്'),
  ('contact', 'Electricity Complaints (KSEB)', 'കെ.എസ്.ഇ.ബി ഇലക്ട്രിസിറ്റി പരാതികൾ'),
  ('contact', 'Akshaya Centre', 'അക്ഷയ കേന്ദ്രം'),
  ('contact', 'Post Office', 'പോസ്റ്റ് ഓഫീസ്'),
  ('contact', 'Banks & ATMs', 'ബാങ്കുകൾ & എ.ടി.എം'),
  ('contact', 'Women’s Helpline', 'വനിതാ ഹെൽപ്പ്‌ലൈൻ'),
  ('contact', 'Child Helpline', 'ചൈൽഡ് ലൈൻ'),
  ('business', 'Supermarkets', 'സൂപ്പർമാർക്കറ്റുകൾ'),
  ('business', 'Bakeries', 'ബേക്കറികൾ'),
  ('business', 'Pharmacies', 'ഫാർമസികൾ / മരുന്നുകടകൾ'),
  ('business', 'Hardware Shops', 'ഹാർഡ്‌വെയർ കടകൾ'),
  ('business', 'Tyre Shops', 'ടയർ ഷോപ്പുകൾ'),
  ('business', 'Textile & Clothing Shops', 'ടെക്സ്റ്റൈൽസ് & വസ്ത്രക്കടകൾ'),
  ('business', 'Hotels & Restaurants', 'ഹോട്ടലുകൾ'),
  ('business', 'Vegetable & Fruit Shops', 'പച്ചക്കറി & പഴക്കടകൾ'),
  ('business', 'Mobile Shops', 'മൊബൈൽ കടകൾ'),
  ('worker', 'Electricians', 'ഇലക്ട്രീഷ്യന്മാർ'),
  ('worker', 'Plumbers', 'പ്ലംബർമാർ'),
  ('worker', 'Carpenters', 'ആശാരിമാർ (തച്ചന്മാർ)'),
  ('worker', 'Painters', 'പെയിന്റർമാർ'),
  ('worker', 'Masons', 'മേസൺമാർ'),
  ('worker', 'Puncture Repair Workers', 'പഞ്ചർ ഒട്ടിക്കുന്ന തൊഴിലാളികൾ'),
  ('worker', 'AC & Refrigerator Technicians', 'എ.സി & ഫ്രിഡ്ജ് ടെക്നീഷ്യന്മാർ'),
  ('worker', 'Coconut Climber / Cutter', 'തെങ്ങ് കയറ്റം / മരം മുറിക്കൽ'),
  ('worker', 'Tile Workers', 'ടൈൽ തൊഴിലാളികൾ'),
  ('worker', 'Daily-Wage Labourers', 'ദിവസവേതന തൊഴിലാളികൾ'),
  ('transport', 'Auto-Rickshaw Drivers', 'ഓട്ടോറിക്ഷ ഡ്രൈവർമാർ'),
  ('transport', 'Taxi & Cab Services', 'ടാക്സി & കാർ സർവീസുകൾ'),
  ('transport', 'Goods Auto Services', 'ഗുഡ്സ് ഓട്ടോ സർവീസ്'),
  ('transport', 'Mini-Truck Services', 'മിനി ട്രക്ക് & പിക്കപ്പ്'),
  ('transport', 'Excavator / JCB Operators', 'ജെ.സി.ബി & എർത്ത്മൂവർ'),
  ('transport', 'Ambulance Transport', 'ആംബുലൻസ് സർവീസ്'),
  ('transport', 'Tourist Vehicle Services', 'ട്രാവലർ / ടൂറിസ്റ്റ് വാൻ')
on conflict do nothing;

-- ---------- After the first admin signs up ----------
-- 1. Supabase > Authentication > Users > Add user (email + password).
-- 2. Copy that user's UID, then run:
--    insert into admins (user_id) values ('PASTE-THE-UID-HERE');
-- Repeat for a second admin so the site never depends on one person.
