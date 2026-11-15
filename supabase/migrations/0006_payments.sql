-- What the customer actually paid, recorded by the stylist after the visit.
-- Informational only (no card processing, no POS): one row per appointment.
create table booking.payments (
  appointment_id     uuid primary key references booking.appointments(id) on delete cascade,
  method             text not null check (method in ('cash', 'card', 'voucher', 'other')),
  amount_minor       integer not null check (amount_minor between 0 and 10000000),
  currency           char(3) not null default 'EUR',
  recorded_by_user   uuid references auth.users(id) on delete set null,
  recorded_by_staff  bigint references booking.staff(id) on delete set null,
  recorded_by_name   text not null,
  recorded_at        timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table booking.payments enable row level security;
revoke all on booking.payments from public, anon, authenticated;
