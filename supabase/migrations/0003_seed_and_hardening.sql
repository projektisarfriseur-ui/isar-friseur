-- 1) Legacy public.* tables (0001) are reachable through Supabase REST with the
--    public anon key. The app only uses the service role, so deny everyone else.
do $$
declare t text;
begin
  foreach t in array array['services', 'stylists', 'weekly_hours', 'closures', 'bookings', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- No cancellation fees (spec scope exclusion: no payments / cancellation charges).
update public.settings set value = to_jsonb('Bitte sag uns bis 24 Stunden vorher Bescheid, wenn du deinen Termin nicht wahrnehmen kannst.'::text)
 where key = 'cancel_policy_de';
update public.settings set value = to_jsonb('Please let us know at least 24 hours in advance if you cannot make your appointment.'::text)
 where key = 'cancel_policy_en';

-- Legacy stylists so the current wizard has a team until the booking core cutover.
insert into public.stylists (name, role_key, photo_url, sort_order) values
  ('Gülay',  'Friseurmeisterin', '/team/gulay.jpg', 1),
  ('Paula',  'Friseurmeisterin', '/team/paula.jpg', 2),
  ('Karam',  'Friseur',          '/team/karam.jpg', 3),
  ('Gjent',  'Friseur',          '/team/gjent.jpg', 4),
  ('Haji',   'Friseur',          '/team/haji.jpg',  5),
  ('Khalid', 'Friseur',          null,              6),
  ('Sascha', 'Team',             null,              7);
update public.stylists set service_ids = (select array_agg(id order by id) from public.services);

-- 2) Booking schema seed. Values marked TO CONFIRM are starting points, not
--    confirmed salon policy (spec: "Decisions and launch gates").
insert into booking.salon_settings (id, name, address, phone, email, cancel_policy_de, cancel_policy_en) values
  (1, 'Isar Friseur', 'Fraunhofer Straße 14, 80469 München', '+498980039037', null,
   'Änderungen und Stornierungen sind bis 24 Stunden vor dem Termin online möglich. Danach ruf uns bitte an.',
   'You can change or cancel online up to 24 hours before your appointment. After that, please call us.');

insert into booking.service_categories (key, name_de, name_en, sort_order) values
  ('women', 'Damen',  'Women',  1),
  ('men',   'Herren', 'Men',    2),
  ('color', 'Farbe',  'Colour', 3),
  ('care',  'Pflege', 'Care',   4);

-- TO CONFIRM: number of chairs and basins.
insert into booking.resource_groups (key, name_de, name_en) values
  ('chair', 'Stuhl', 'Chair'),
  ('basin', 'Waschbecken', 'Basin');
insert into booking.resources (group_id, name, sort_order)
select g.id, g.name_de || ' ' || n, n
  from booking.resource_groups g, generate_series(1, 6) n where g.key = 'chair'
union all
select g.id, g.name_de || ' ' || n, n
  from booking.resource_groups g, generate_series(1, 2) n where g.key = 'basin';

-- Services mirror the live price list (price_from € -> minor units).
insert into booking.services (category_id, slug, name_de, name_en, price_mode, price_minor, sort_order)
select c.id, s.slug, s.name_de, s.name_en, s.mode, s.euros * 100, s.sort
  from (values
    ('women', 'damen-waschen-schneiden-foehnen', 'Waschen, Schneiden, Föhnen', 'Wash, cut, blow-dry', 'from',  48, 1),
    ('women', 'damen-trockenhaarschnitt',        'Trockenhaarschnitt',         'Dry cut',             'from',  38, 2),
    ('women', 'pony-nachschneiden',              'Pony nachschneiden',         'Fringe trim',         'exact', 10, 3),
    ('women', 'hochsteckfrisur',                 'Hochsteckfrisur',            'Updo',                'from',  65, 4),
    ('men',   'herren-waschen-schneiden-foehnen','Waschen, Schneiden, Föhnen', 'Wash, cut, blow-dry', 'from',  32, 1),
    ('men',   'herren-trockenhaarschnitt',       'Trockenhaarschnitt',         'Dry cut',             'from',  26, 2),
    ('men',   'bart-konturieren',                'Bart konturieren',           'Beard contouring',    'exact', 12, 3),
    ('men',   'maschinenschnitt',                'Maschinenschnitt',           'Clipper cut',         'exact', 20, 4),
    ('color', 'ansatz-faerben',                  'Ansatz färben',              'Root colour',         'from',  55, 1),
    ('color', 'komplettfaerbung',                'Komplettfärbung',            'Full colour',         'from',  75, 2),
    ('color', 'balayage',                        'Balayage',                   'Balayage',            'from', 140, 3),
    ('color', 'folienstraehnen',                 'Foliensträhnen',             'Foil highlights',     'from',  90, 4),
    ('color', 'toenung',                         'Tönung',                     'Toning',              'from',  45, 5),
    ('care',  'olaplex',                         'Olaplex Behandlung',         'Olaplex treatment',   'from',  25, 1),
    ('care',  'keratin-kur',                     'Keratin Kur',                'Keratin treatment',   'from',  35, 2),
    ('care',  'kopfhautmassage',                 'Kopfhautmassage',            'Scalp massage',       'exact', 15, 3)
  ) as s(cat, slug, name_de, name_en, mode, euros, sort)
  join booking.service_categories c on c.key = s.cat;

-- Phases. Plain services = one hands-on phase in a chair.
-- Colour services TO CONFIRM: application → unsupervised processing (stylist
-- released, client keeps the chair) → finish, plus 10 min chair/stylist cleanup
-- that is not part of the client's visible duration.
insert into booking.service_phases (service_id, seq, kind, duration_min, needs_staff, customer_present, resource_group_id)
select s.id, p.seq, p.kind, p.minutes, p.needs_staff, p.present, g.id
  from (values
    ('damen-waschen-schneiden-foehnen', 1, 'hands_on',   60, true,  true),
    ('damen-trockenhaarschnitt',        1, 'hands_on',   40, true,  true),
    ('pony-nachschneiden',              1, 'hands_on',   15, true,  true),
    ('hochsteckfrisur',                 1, 'hands_on',   60, true,  true),
    ('herren-waschen-schneiden-foehnen',1, 'hands_on',   40, true,  true),
    ('herren-trockenhaarschnitt',       1, 'hands_on',   30, true,  true),
    ('bart-konturieren',                1, 'hands_on',   15, true,  true),
    ('maschinenschnitt',                1, 'hands_on',   20, true,  true),
    ('ansatz-faerben',   1, 'hands_on',   25, true,  true),
    ('ansatz-faerben',   2, 'processing', 30, false, true),
    ('ansatz-faerben',   3, 'hands_on',   20, true,  true),
    ('ansatz-faerben',   4, 'cleanup',    10, true,  false),
    ('komplettfaerbung', 1, 'hands_on',   30, true,  true),
    ('komplettfaerbung', 2, 'processing', 35, false, true),
    ('komplettfaerbung', 3, 'hands_on',   25, true,  true),
    ('komplettfaerbung', 4, 'cleanup',    10, true,  false),
    ('balayage',         1, 'hands_on',   60, true,  true),
    ('balayage',         2, 'processing', 45, false, true),
    ('balayage',         3, 'hands_on',   45, true,  true),
    ('balayage',         4, 'cleanup',    10, true,  false),
    ('folienstraehnen',  1, 'hands_on',   50, true,  true),
    ('folienstraehnen',  2, 'processing', 40, false, true),
    ('folienstraehnen',  3, 'hands_on',   30, true,  true),
    ('folienstraehnen',  4, 'cleanup',    10, true,  false),
    ('toenung',          1, 'hands_on',   20, true,  true),
    ('toenung',          2, 'processing', 25, false, true),
    ('toenung',          3, 'hands_on',   15, true,  true),
    ('toenung',          4, 'cleanup',    10, true,  false),
    ('olaplex',          1, 'hands_on',   30, true,  true),
    ('keratin-kur',      1, 'hands_on',   45, true,  true),
    ('kopfhautmassage',  1, 'hands_on',   15, true,  true)
  ) as p(slug, seq, kind, minutes, needs_staff, present)
  join booking.services s on s.slug = p.slug
  cross join (select id from booking.resource_groups where key = 'chair') g;

-- Care treatments can be added to cuts and colour in the same visit.
insert into booking.service_addons (service_id, addon_id)
select base.id, addon.id
  from booking.services base
  join booking.service_categories bc on bc.id = base.category_id and bc.key in ('women', 'men', 'color')
  cross join booking.services addon
  join booking.service_categories ac on ac.id = addon.category_id and ac.key = 'care';

-- Team (mirrors app/lib/people.js). TO CONFIRM: who performs which service.
insert into booking.staff (slug, display_name, title_de, title_en, photo_url, languages, sort_order) values
  ('gulay',  'Gülay',  'Friseurmeisterin', 'Master Stylist', '/team/gulay.jpg', '{DE,TR,EN}', 1),
  ('paula',  'Paula',  'Friseurmeisterin', 'Master Stylist', '/team/paula.jpg', '{DE,EN}',    2),
  ('karam',  'Karam',  'Friseur',          'Stylist',        '/team/karam.jpg', '{DE,AR,EN}', 3),
  ('gjent',  'Gjent',  'Friseur',          'Stylist',        '/team/gjent.jpg', '{DE,SQ,EN}', 4),
  ('haji',   'Haji',   'Friseur',          'Stylist',        '/team/haji.jpg',  '{DE,AR,EN}', 5),
  ('khalid', 'Khalid', 'Friseur',          'Stylist',        null,              '{DE,AR}',    6),
  ('sascha', 'Sascha', 'Team',             'Team',           null,              '{DE,RU,EN}', 7);

insert into booking.staff_services (staff_id, service_id)
select st.id, s.id from booking.staff st cross join booking.services s;

-- Salon opening hours (local wall clock): Mon–Fri 09–19, Sat 09–17, Sun closed.
insert into booking.working_rules (staff_id, weekday, start_local, end_local)
select null, d, '09:00', case when d = 6 then time '17:00' else time '19:00' end
  from generate_series(1, 6) d;
-- TO CONFIRM: individual shifts and breaks; default = full salon hours.
insert into booking.working_rules (staff_id, weekday, start_local, end_local)
select st.id, r.weekday, r.start_local, r.end_local
  from booking.staff st cross join booking.working_rules r where r.staff_id is null;

-- Retention periods must be approved by the owner (PRIV-18); null = not set yet.
insert into booking.retention_policies (category, note) values
  ('customer_profiles',     'Inactive customer profiles'),
  ('appointments',          'Appointment details after visit'),
  ('restricted_records',    'Patch-test / prerequisite records'),
  ('waitlist',              'Closed or expired waitlist requests'),
  ('notification_logs',     'Outbox rows after delivery'),
  ('audit_logs',            'Security and admin audit events'),
  ('privacy_requests',      'Evidence of handled rights requests'),
  ('exports',               'Generated export files'),
  ('idempotency_keys',      'Retry keys (operational, short)');
