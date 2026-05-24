import { addMinutes, format, parse, isBefore, isEqual } from 'date-fns';

export const TZ = 'Europe/Berlin';

export function toHHMM(date) {
  return format(date, 'HH:mm');
}

export function parseHHMM(dateStr, hhmm) {
  return parse(`${dateStr} ${hhmm}`, 'yyyy-MM-dd HH:mm', new Date());
}

export function addMin(date, min) {
  return addMinutes(date, min);
}

// Build slot list given working hours, existing bookings, and required duration.
// hours = { open: 'HH:MM', close: 'HH:MM' }
// bookings = [{ start_time, end_time }]
// returns array of 'HH:MM' start times
export function computeSlots({ dateStr, hours, bookings, durationMin, slotMinutes = 30, bufferMin = 10, notBefore = null }) {
  if (!hours?.open || !hours?.close) return [];
  const openAt = parseHHMM(dateStr, hours.open);
  const closeAt = parseHHMM(dateStr, hours.close);
  const minStart = notBefore ? parseHHMM(dateStr, notBefore) : null;

  const taken = bookings.map(b => ({
    start: parseHHMM(dateStr, b.start_time),
    end: parseHHMM(dateStr, b.end_time),
  }));

  const slots = [];
  let cursor = openAt;
  while (true) {
    const slotEnd = addMin(cursor, durationMin);
    if (isBefore(closeAt, slotEnd) && !isEqual(closeAt, slotEnd)) break;

    const tooEarly = minStart && isBefore(cursor, minStart);

    const conflict = taken.some(t => {
      const tStart = addMin(t.start, -bufferMin);
      const tEnd = addMin(t.end, bufferMin);
      return isBefore(cursor, tEnd) && isBefore(tStart, slotEnd);
    });
    if (!conflict && !tooEarly) slots.push(toHHMM(cursor));

    cursor = addMin(cursor, slotMinutes);
    if (!isBefore(cursor, closeAt) && !isEqual(cursor, closeAt)) break;
  }
  return slots;
}

// Returns 'HH:MM' rounded up to next `step` minute boundary in Europe/Berlin.
export function nowInBerlinHHMM(leadMin = 0, step = 5) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
  let total = h * 60 + m + leadMin;
  total = Math.ceil(total / step) * step;
  if (total >= 24 * 60) total = 24 * 60 - 1;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function todayInBerlin() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

export function todayInTz() {
  return format(new Date(), 'yyyy-MM-dd');
}
