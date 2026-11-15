-- Internal notes staff write on an appointment. Visible to the assigned
-- hairdresser(s) and the owner; never sent to customers.
create table booking.appointment_notes (
  id               bigint generated always as identity primary key,
  appointment_id   uuid not null references booking.appointments(id) on delete cascade,
  author_user_id   uuid references auth.users(id) on delete set null,
  author_staff_id  bigint references booking.staff(id) on delete set null,
  author_name      text not null,
  body             text not null check (length(body) between 1 and 2000),
  created_at       timestamptz not null default now()
);
create index appointment_notes_appt_idx on booking.appointment_notes (appointment_id, id);

alter table booking.appointment_notes enable row level security;
revoke all on booking.appointment_notes from public, anon, authenticated;

-- Appointment items are looked up by staff for per-employee calendars.
create index appointment_items_staff_idx on booking.appointment_items (staff_id, appointment_id);
