-- Reservation system foundation (spec 2026-10-24, milestone "Foundation").
-- Lives in its own `booking` schema so the legacy public.* tables (0001) keep
-- serving the current site until the booking core is cut over.
-- The schema is NOT exposed through the Supabase REST API; the app reaches it
-- server-side only (app/lib/db.js). RLS is enabled everywhere with no policies,
-- so anon/authenticated roles are denied even if the schema is ever exposed.

-- Supabase keeps extensions in the `extensions` schema (on the default search_path).
create extension if not exists pgcrypto   with schema extensions;
create extension if not exists btree_gist with schema extensions;   -- `=` on bigint inside GiST exclusion constraints
create extension if not exists citext     with schema extensions;

create schema if not exists booking;
revoke all on schema booking from public, anon, authenticated;

-- ============================================================ settings
create table booking.salon_settings (
  id                     smallint primary key default 1 check (id = 1),  -- single salon (proposed deployment assumption)
  name                   text not null,
  address                text,
  phone                  text,
  email                  text,
  timezone               text not null default 'Europe/Berlin',           -- IANA zone (SCH-16)
  locale                 text not null default 'de-DE',
  currency               char(3) not null default 'EUR',
  booking_horizon_days   integer not null default 90  check (booking_horizon_days between 1 and 730),
  min_notice_minutes     integer not null default 120 check (min_notice_minutes >= 0),
  cancel_window_minutes  integer not null default 1440 check (cancel_window_minutes >= 0),
  slot_interval_minutes  integer not null default 15  check (slot_interval_minutes in (5, 10, 15, 20, 30, 60)),
  hold_minutes           integer not null default 5   check (hold_minutes between 1 and 30),
  hold_max_renewals      integer not null default 1   check (hold_max_renewals between 0 and 5),
  auto_confirm           boolean not null default true,
  reminder_hours_before  integer[] not null default '{24}',
  policy_version         integer not null default 1,
  cancel_policy_de       text,
  cancel_policy_en       text,
  updated_at             timestamptz not null default now()
);

-- Exceptional salon-wide closures / opening hours are in working_rules /
-- schedule_exceptions with staff_id null.

-- ============================================================ identity & roles
-- Customers and staff sign in through Supabase Auth (auth.users).
create table booking.role_assignments (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner', 'admin', 'hairdresser')),
  permissions text[] not null default '{}',     -- delegated extras, e.g. 'manage_services', 'export'
  granted_by  uuid references auth.users(id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
create unique index role_assignments_active_uq on booking.role_assignments (user_id, role) where revoked_at is null;

-- Last-owner protection: an active owner can't be revoked/removed if it is the only one.
create function booking.prevent_last_owner_removal() returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.revoked_at is null)
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.revoked_at is null and new.revoked_at is not null) then
    if (select count(*) from booking.role_assignments
         where role = 'owner' and revoked_at is null and id <> old.id) = 0 then
      raise exception 'cannot remove the last owner' using errcode = 'P0001';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger role_assignments_last_owner
  before update or delete on booking.role_assignments
  for each row execute function booking.prevent_last_owner_removal();

-- ============================================================ customers
create table booking.customers (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid unique references auth.users(id) on delete set null,
  first_name         text not null check (length(first_name) between 1 and 80),
  last_name          text not null check (length(last_name) between 1 and 80),
  email              citext,                                   -- optional for phone/walk-in bookings (ADM-13)
  email_verified_at  timestamptz,
  phone              text check (phone is null or length(phone) <= 32),
  preferred_lang     text not null default 'de' check (preferred_lang in ('de', 'en')),
  service_notes      text check (service_notes is null or length(service_notes) <= 500),  -- limited, non-sensitive (PRIV-04)
  merged_into        uuid references booking.customers(id),
  anonymized_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index customers_email_idx on booking.customers (email) where email is not null;
create index customers_name_idx  on booking.customers (lower(last_name), lower(first_name));

-- ============================================================ staff
create table booking.staff (
  id             bigint generated always as identity primary key,
  user_id        uuid unique references auth.users(id) on delete set null,   -- login identity is separate (ADM-01)
  slug           text not null unique,
  display_name   text not null,
  title_de       text,
  title_en       text,
  bio_de         text,
  bio_en         text,
  photo_url      text,
  contact_email  citext,
  languages      text[] not null default '{}',
  bookable       boolean not null default true,
  sort_order     integer not null default 0,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================ resources (chairs, basins, equipment)
create table booking.resource_groups (
  id    bigint generated always as identity primary key,
  key   text not null unique,         -- 'chair', 'basin', ...
  name_de text not null,
  name_en text not null
);
-- Each row is ONE bookable unit; pools are several rows, never a counter (SCH-04).
create table booking.resources (
  id          bigint generated always as identity primary key,
  group_id    bigint not null references booking.resource_groups(id),
  name        text not null,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  unique (group_id, name)
);

-- ============================================================ catalogue
create table booking.service_categories (
  id          bigint generated always as identity primary key,
  key         text not null unique,
  name_de     text not null,
  name_en     text not null,
  sort_order  integer not null default 0,
  visible     boolean not null default true,
  archived_at timestamptz
);

-- Money is integer minor units + explicit currency (ADM-09).
create table booking.services (
  id                  bigint generated always as identity primary key,
  category_id         bigint not null references booking.service_categories(id),
  slug                text not null unique,
  name_de             text not null,
  name_en             text not null,
  description_de      text,
  description_en      text,
  price_mode          text not null check (price_mode in ('exact', 'from', 'consultation')),   -- CUS-04
  price_minor         integer check (price_minor is null or price_minor >= 0),
  currency            char(3) not null default 'EUR',
  online_bookable     boolean not null default true,
  visible             boolean not null default true,
  prerequisite        text check (prerequisite in ('patch_test', 'consultation')),            -- PRIV-11
  sort_order          integer not null default 0,
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check ((price_mode = 'consultation') = (price_minor is null))
);

-- Variants (e.g. hair length). A variant can override price and adds/removes minutes.
create table booking.service_variants (
  id             bigint generated always as identity primary key,
  service_id     bigint not null references booking.services(id) on delete cascade,
  key            text not null,
  name_de        text not null,
  name_en        text not null,
  price_minor    integer check (price_minor is null or price_minor >= 0),
  sort_order     integer not null default 0,
  archived_at    timestamptz,
  unique (service_id, key)
);

-- Ordered phases with independent staff/resource needs (SCH-01/02).
-- variant_id null = default phases; a variant with its own rows replaces them.
create table booking.service_phases (
  id                 bigint generated always as identity primary key,
  service_id         bigint not null references booking.services(id) on delete cascade,
  variant_id         bigint references booking.service_variants(id) on delete cascade,
  seq                smallint not null check (seq >= 1),
  kind               text not null check (kind in ('prep', 'hands_on', 'processing', 'cleanup')),
  duration_min       integer not null check (duration_min between 1 and 600),
  needs_staff        boolean not null,         -- false during unsupervised processing = staff released
  customer_present   boolean not null,         -- false for prep/cleanup = not part of customer-facing duration
  resource_group_id  bigint references booking.resource_groups(id)
);
create unique index service_phases_seq_uq on booking.service_phases (service_id, coalesce(variant_id, 0), seq);

-- Add-ons: services that may be attached to a parent service in one visit.
create table booking.service_addons (
  service_id  bigint not null references booking.services(id) on delete cascade,
  addon_id    bigint not null references booking.services(id) on delete cascade,
  primary key (service_id, addon_id),
  check (service_id <> addon_id)
);

-- Bundle = booking template, not a prepaid package (CUS-03).
create table booking.bundles (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name_de     text not null,
  name_en     text not null,
  visible     boolean not null default true,
  archived_at timestamptz
);
create table booking.bundle_items (
  bundle_id   bigint not null references booking.bundles(id) on delete cascade,
  seq         smallint not null,
  service_id  bigint not null references booking.services(id),
  variant_id  bigint references booking.service_variants(id),
  primary key (bundle_id, seq)
);

-- Which staff may perform what, with optional price/duration overrides (ADM-02).
create table booking.staff_services (
  staff_id        bigint not null references booking.staff(id) on delete cascade,
  service_id      bigint not null references booking.services(id) on delete cascade,
  price_minor     integer check (price_minor is null or price_minor >= 0),
  extra_minutes   integer not null default 0 check (extra_minutes between -120 and 240),
  primary key (staff_id, service_id)
);

-- ============================================================ working time
-- Local wall-clock weekly rules (SCH-16). staff_id null = salon opening hours.
-- Several rows per weekday express breaks (gaps between rows).
create table booking.working_rules (
  id           bigint generated always as identity primary key,
  staff_id     bigint references booking.staff(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),   -- 0 = Sunday (JS getDay)
  start_local  time not null,
  end_local    time not null,
  valid_from   date,
  valid_to     date,
  check (start_local < end_local),
  check (valid_to is null or valid_from is null or valid_from <= valid_to)
);
create index working_rules_staff_idx on booking.working_rules (staff_id, weekday);

-- One-off blocks as concrete instants: leave, holiday, closure, extra hours.
create table booking.schedule_exceptions (
  id          bigint generated always as identity primary key,
  staff_id    bigint references booking.staff(id) on delete cascade,      -- null = whole salon
  kind        text not null check (kind in ('leave', 'holiday', 'closure', 'block', 'extra_hours')),
  during      tstzrange not null check (not isempty(during) and lower_inc(during) and not upper_inc(during)),
  reason      text check (reason is null or length(reason) <= 200),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index schedule_exceptions_during_idx on booking.schedule_exceptions using gist (staff_id, during);

-- ============================================================ holds, appointments, allocations
create table booking.holds (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid references auth.users(id) on delete cascade,
  guest_session  text,                                  -- digest of a secure guest session id
  status         text not null default 'active' check (status in ('active', 'converted', 'expired', 'released')),
  expires_at     timestamptz not null,
  renewals       smallint not null default 0,
  itinerary      jsonb not null,                        -- requested services/variants/staff, for re-validation
  created_ip     inet,
  created_at     timestamptz not null default now(),
  check (num_nonnulls(owner_user_id, guest_session) = 1)
);
create index holds_active_expiry_idx on booking.holds (expires_at) where status = 'active';

create table booking.appointments (
  id                 uuid primary key default gen_random_uuid(),
  -- Non-enumerable public reference (ARCH-06). Never sufficient for auth on its own.
  reference          text not null unique default upper(encode(extensions.gen_random_bytes(5), 'hex')),
  customer_id        uuid not null references booking.customers(id),
  status             text not null check (status in ('pending_approval', 'confirmed', 'arrived', 'completed', 'no_show', 'cancelled')),
  source             text not null check (source in ('online', 'phone', 'walk_in', 'admin', 'waitlist')),
  version            integer not null default 1,             -- optimistic locking (SCH-14)
  starts_at          timestamptz not null,                   -- UTC instants (SCH-16)
  ends_at            timestamptz not null,                   -- customer-visible departure
  cancel_deadline    timestamptz,
  pending_expires_at timestamptz,
  policy_snapshot    jsonb not null,                         -- policy version + values at booking time (SCH-18)
  total_price_minor  integer check (total_price_minor is null or total_price_minor >= 0),
  price_is_estimate  boolean not null,
  currency           char(3) not null default 'EUR',
  customer_message   text check (customer_message is null or length(customer_message) <= 500),
  no_email_reason    text,                                   -- honest marker for manual bookings w/o email (AT-24)
  cancelled_at       timestamptz,
  cancelled_by       uuid references auth.users(id) on delete set null,
  cancel_reason      text,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (starts_at < ends_at),
  check ((status = 'cancelled') = (cancelled_at is not null)),
  check (status <> 'pending_approval' or pending_expires_at is not null)
);
create index appointments_starts_idx   on booking.appointments (starts_at);
create index appointments_status_idx   on booking.appointments (status, starts_at);
create index appointments_customer_idx on booking.appointments (customer_id, starts_at desc);

-- Line items keep price/name/duration/phase snapshots (ADM-10).
create table booking.appointment_items (
  id                uuid primary key default gen_random_uuid(),
  appointment_id    uuid not null references booking.appointments(id) on delete cascade,
  seq               smallint not null,
  service_id        bigint not null references booking.services(id),
  variant_id        bigint references booking.service_variants(id),
  staff_id          bigint references booking.staff(id),
  name_de           text not null,
  name_en           text not null,
  price_mode        text not null check (price_mode in ('exact', 'from', 'consultation')),
  price_minor       integer,
  duration_min      integer not null,
  phases_snapshot   jsonb not null,
  unique (appointment_id, seq)
);

-- Concrete occupied intervals. Holds and bookings share this table, so both
-- take part in the same conflict control (SCH-11). Half-open [start, end) so
-- adjacent reservations are allowed (SCH-10). Released/cancelled/expired rows
-- flip active=false; no time-dependent predicate is involved.
create table booking.allocations (
  id              bigint generated always as identity primary key,
  hold_id         uuid references booking.holds(id) on delete cascade,
  appointment_id  uuid references booking.appointments(id) on delete cascade,
  item_id         uuid references booking.appointment_items(id) on delete cascade,
  kind            text not null check (kind in ('staff', 'resource', 'customer')),
  staff_id        bigint references booking.staff(id),
  resource_id     bigint references booking.resources(id),
  customer_id     uuid references booking.customers(id),
  phase_kind      text check (phase_kind in ('prep', 'hands_on', 'processing', 'cleanup', 'visit')),
  during          tstzrange not null,
  active          boolean not null default true,
  released_at     timestamptz,
  created_at      timestamptz not null default now(),
  check (num_nonnulls(hold_id, appointment_id) = 1),
  check (not isempty(during) and lower_inc(during) and not upper_inc(during)),
  check (
    (kind = 'staff'    and staff_id    is not null and resource_id is null and customer_id is null) or
    (kind = 'resource' and resource_id is not null and staff_id    is null and customer_id is null) or
    (kind = 'customer' and customer_id is not null and staff_id    is null and resource_id is null)
  ),
  check (active or released_at is not null),
  -- The core double-booking guarantees (SCH-09, AT-09, AT-12):
  constraint no_staff_overlap    exclude using gist (staff_id    with =, during with &&) where (active and kind = 'staff'),
  constraint no_resource_overlap exclude using gist (resource_id with =, during with &&) where (active and kind = 'resource'),
  constraint no_customer_overlap exclude using gist (customer_id with =, during with &&) where (active and kind = 'customer')
);
create index allocations_appointment_idx on booking.allocations (appointment_id) where appointment_id is not null;
create index allocations_hold_idx        on booking.allocations (hold_id) where hold_id is not null;
create index allocations_staff_during_idx    on booking.allocations using gist (staff_id, during)    where active and kind = 'staff';
create index allocations_resource_during_idx on booking.allocations using gist (resource_id, during) where active and kind = 'resource';

-- Transaction-safe hold expiry; call from the cron worker and lazily before writes (SCH-11).
create function booking.expire_holds(p_now timestamptz default now()) returns integer
language plpgsql as $$
declare n integer;
begin
  with expired as (
    update booking.holds set status = 'expired'
     where status = 'active' and expires_at <= p_now
     returning id
  )
  update booking.allocations a
     set active = false, released_at = p_now
    from expired e
   where a.hold_id = e.id and a.active;
  get diagnostics n = row_count;
  return n;
end $$;

-- ============================================================ idempotency (SCH-13)
create table booking.idempotency_keys (
  key            text not null,
  scope          text not null,                  -- e.g. 'confirm_hold', 'reschedule'
  actor          text not null,                  -- user id or guest session digest
  request_hash   text not null,
  status         text not null default 'in_progress' check (status in ('in_progress', 'succeeded', 'failed')),
  response       jsonb,
  created_at     timestamptz not null default now(),
  primary key (scope, actor, key)
);

-- ============================================================ history & audit
create table booking.appointment_events (
  id              bigint generated always as identity primary key,
  appointment_id  uuid not null references booking.appointments(id) on delete cascade,
  version         integer not null,
  action          text not null,     -- created, rescheduled, reassigned, status_changed, cancelled, repriced, note
  actor_user_id   uuid references auth.users(id) on delete set null,
  actor_kind      text not null check (actor_kind in ('customer', 'staff', 'system', 'guest')),
  reason          text,
  changes         jsonb,             -- minimal field diff; never private note content
  notify_customer boolean,           -- MSG-07 decision record
  created_at      timestamptz not null default now()
);
create index appointment_events_appt_idx on booking.appointment_events (appointment_id, id);

create table booking.audit_events (
  id             bigint generated always as identity primary key,
  actor_user_id  uuid references auth.users(id) on delete set null,
  action         text not null,       -- e.g. role.granted, export.customers, privacy.erasure
  entity         text,
  entity_id      text,
  reason         text,
  created_at     timestamptz not null default now()
);

-- ============================================================ notifications (MSG-02)
create table booking.notification_outbox (
  id                   bigint generated always as identity primary key,
  event_key            text not null unique,           -- dedupe, e.g. 'confirm:<appt>:v<version>'
  appointment_id       uuid references booking.appointments(id) on delete cascade,
  appointment_version  integer,
  channel              text not null default 'email' check (channel in ('email', 'sms')),
  template             text not null,
  recipient            text not null,
  scheduled_for        timestamptz not null default now(),
  status               text not null default 'queued' check (status in ('queued', 'sending', 'accepted', 'delivered', 'failed', 'cancelled')),
  attempts             smallint not null default 0,
  last_error           text,
  provider_message_id  text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index outbox_due_idx on booking.notification_outbox (scheduled_for) where status = 'queued';

-- ============================================================ waitlist (WAIT-*)
create table booking.waitlist_requests (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references booking.customers(id) on delete cascade,
  itinerary      jsonb not null,                 -- services/variants
  staff_ids      bigint[],                       -- null = any eligible professional
  date_from      date not null,
  date_to        date not null,
  time_windows   jsonb not null default '[]',    -- [{weekday, from, to}]
  channel        text not null default 'email' check (channel in ('email', 'sms')),
  status         text not null default 'open' check (status in ('open', 'offered', 'booked', 'withdrawn', 'expired', 'removed')),
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now(),
  check (date_from <= date_to)
);
create index waitlist_open_idx on booking.waitlist_requests (created_at) where status = 'open';

create table booking.waitlist_offers (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references booking.waitlist_requests(id) on delete cascade,
  token_digest   text not null unique,           -- sha256 of the emailed token; token itself never stored
  hold_id        uuid references booking.holds(id) on delete set null,   -- set when the offer is exclusive
  slot           jsonb not null,
  status         text not null default 'sent' check (status in ('sent', 'accepted', 'declined', 'expired', 'superseded')),
  expires_at     timestamptz not null,
  redeemed_at    timestamptz,
  override_reason text,
  created_at     timestamptz not null default now()
);

-- ============================================================ privacy (PRIV-*)
-- Restricted health-related prerequisite data, separate from ordinary notes (PRIV-09).
-- Collection stays disabled until the salon's privacy review approves it.
create table booking.restricted_records (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references booking.customers(id) on delete cascade,
  kind          text not null check (kind in ('patch_test')),
  status        text not null check (status in ('passed', 'failed', 'pending')),
  verified_on   date,
  review_by     date,
  purpose       text not null,
  legal_basis   text not null,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create table booking.restricted_access_grants (
  user_id      uuid not null references auth.users(id) on delete cascade,
  customer_id  uuid references booking.customers(id) on delete cascade,   -- null = all clients (owner-granted)
  granted_by   uuid references auth.users(id) on delete set null,
  granted_at   timestamptz not null default now(),
  revoked_at   timestamptz
);

create table booking.consents (
  id              bigint generated always as identity primary key,
  customer_id     uuid not null references booking.customers(id) on delete cascade,
  purpose         text not null check (purpose in ('marketing_email', 'marketing_sms', 'reminder_sms', 'privacy_notice_ack')),
  granted         boolean not null,
  notice_version  text not null,
  source          text not null,
  created_at      timestamptz not null default now()   -- append-only: latest row per purpose wins
);
create index consents_customer_idx on booking.consents (customer_id, purpose, created_at desc);

create table booking.privacy_requests (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references booking.customers(id) on delete set null,
  requester_email citext not null,
  kind            text not null check (kind in ('access', 'rectification', 'erasure', 'restriction', 'objection', 'portability', 'consent_withdrawal')),
  status          text not null default 'received' check (status in ('received', 'verifying', 'in_progress', 'completed', 'rejected', 'extended')),
  received_at     timestamptz not null default now(),
  verified_at     timestamptz,
  due_at          timestamptz not null default (now() + interval '1 month'),   -- Art. 12(3)
  extended_until  timestamptz,
  assigned_to     uuid references auth.users(id) on delete set null,
  decision        text,
  rationale       text,
  completed_at    timestamptz
);

-- Restore-safe deletion ledger (PRIV-17): re-applied after any backup restore.
create table booking.deletion_ledger (
  id            bigint generated always as identity primary key,
  subject_kind  text not null check (subject_kind in ('customer', 'user', 'waitlist_request', 'other')),
  subject_id    text not null,
  action        text not null check (action in ('deleted', 'anonymized')),
  request_id    uuid references booking.privacy_requests(id) on delete set null,
  executed_at   timestamptz not null default now()
);

create table booking.retention_policies (
  category     text primary key,
  keep_days    integer check (keep_days is null or keep_days > 0),   -- null = not yet approved by owner
  approved_by  uuid references auth.users(id) on delete set null,
  approved_at  timestamptz,
  note         text
);

-- ============================================================ updated_at triggers
create function booking.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['salon_settings', 'customers', 'staff', 'services', 'appointments', 'notification_outbox'] loop
    execute format('create trigger %I_touch before update on booking.%I for each row execute function booking.touch_updated_at()', t, t);
  end loop;
end $$;

-- ============================================================ RLS: deny by default
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'booking' loop
    execute format('alter table booking.%I enable row level security', r.tablename);
  end loop;
end $$;
revoke all on all tables in schema booking from public, anon, authenticated;
revoke all on all functions in schema booking from public, anon, authenticated;
