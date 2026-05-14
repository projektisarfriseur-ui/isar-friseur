-- Isar Friseur — initial schema

create extension if not exists "pgcrypto";

-- ---------- services ----------
create table if not exists services (
  id               bigint generated always as identity primary key,
  group_key        text not null check (group_key in ('women','men','color','care')),
  name_de          text not null,
  name_en          text not null,
  price_from       integer not null,
  duration_min     integer not null,
  is_fixed_price   boolean not null default false,
  sort_order       integer not null default 0,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- stylists ----------
create table if not exists stylists (
  id               bigint generated always as identity primary key,
  name             text not null,
  role_key         text not null default 'stylist',
  photo_url        text,
  bio              text,
  service_ids      bigint[] not null default '{}',
  active           boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- weekly_hours (per stylist + global salon hours via stylist_id=null) ----------
create table if not exists weekly_hours (
  id               bigint generated always as identity primary key,
  stylist_id       bigint references stylists(id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6), -- 0=Sun
  open_time        text,    -- 'HH:MM', null = closed
  close_time       text,
  unique (stylist_id, weekday)
);

-- ---------- closures (one-off days off) ----------
create table if not exists closures (
  id               bigint generated always as identity primary key,
  stylist_id       bigint references stylists(id) on delete cascade, -- null = whole salon
  date             date not null,
  reason           text,
  created_at       timestamptz not null default now()
);

-- ---------- bookings ----------
create table if not exists bookings (
  id               bigint generated always as identity primary key,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','cancelled','completed','no_show')),
  service_ids      bigint[] not null,
  stylist_id       bigint references stylists(id) on delete set null,
  date             date not null,
  start_time       text not null,    -- 'HH:MM'
  end_time         text not null,
  duration_min     integer not null,
  price_estimate   text not null,    -- e.g. 'ab 75 €' or '120 €'
  first_name       text not null,
  last_name        text not null,
  phone            text,
  email            text,
  message          text,
  lang             text not null default 'de' check (lang in ('de','en')),
  confirm_token    uuid not null default gen_random_uuid(),
  cancel_token     uuid not null default gen_random_uuid(),
  reminders_sent   text[] not null default '{}',
  admin_notes      text,
  is_walkin        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists bookings_date_idx on bookings(date);
create index if not exists bookings_status_idx on bookings(status);

-- ---------- settings (key/value) ----------
create table if not exists settings (
  key              text primary key,
  value            jsonb not null,
  updated_at       timestamptz not null default now()
);

-- ---------- seed services (mirrors Services.jsx) ----------
insert into services (group_key, name_de, name_en, price_from, duration_min, is_fixed_price, sort_order) values
  ('women','Waschen, Schneiden, Föhnen','Wash, cut, blow-dry',48,60,false,1),
  ('women','Trockenhaarschnitt','Dry cut',38,40,false,2),
  ('women','Pony nachschneiden','Fringe trim',10,15,true,3),
  ('women','Hochsteckfrisur','Updo',65,60,false,4),
  ('men','Waschen, Schneiden, Föhnen','Wash, cut, blow-dry',32,40,false,1),
  ('men','Trockenhaarschnitt','Dry cut',26,30,false,2),
  ('men','Bart konturieren','Beard contouring',12,15,true,3),
  ('men','Maschinenschnitt','Clipper cut',20,20,true,4),
  ('color','Ansatz färben','Root colour',55,75,false,1),
  ('color','Komplettfärbung','Full colour',75,90,false,2),
  ('color','Balayage','Balayage',140,150,false,3),
  ('color','Foliensträhnen','Foil highlights',90,120,false,4),
  ('color','Tönung','Toning',45,60,false,5),
  ('care','Olaplex Behandlung','Olaplex treatment',25,30,false,1),
  ('care','Keratin Kur','Keratin treatment',35,45,false,2),
  ('care','Kopfhautmassage','Scalp massage',15,15,true,3)
on conflict do nothing;

-- default salon hours (stylist_id null = whole salon)
insert into weekly_hours (stylist_id, weekday, open_time, close_time) values
  (null, 1, '09:00', '19:00'),
  (null, 2, '09:00', '19:00'),
  (null, 3, '09:00', '19:00'),
  (null, 4, '09:00', '19:00'),
  (null, 5, '09:00', '19:00'),
  (null, 6, '09:00', '17:00'),
  (null, 0, null,    null)
on conflict do nothing;

-- default settings
insert into settings (key, value) values
  ('salon_name',     '"Isar Friseur"'::jsonb),
  ('salon_address',  '"Fraunhofer Straße 14, 80469 München"'::jsonb),
  ('salon_phone',    '"+498980039037"'::jsonb),
  ('admin_email',    '"burhan380@gmail.com"'::jsonb),
  ('cancel_policy_de','"Sag uns bis 24 Stunden vorher Bescheid, wenn du nicht kommen kannst — danach berechnen wir 50 % der Leistung."'::jsonb),
  ('cancel_policy_en','"Please let us know at least 24 hours in advance if you cannot make it — after that we charge 50 % of the service."'::jsonb),
  ('slot_minutes',   '30'::jsonb),
  ('buffer_minutes', '10'::jsonb)
on conflict do nothing;
