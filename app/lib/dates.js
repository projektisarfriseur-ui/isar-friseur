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
export function computeSlots({ dateStr, hours, bookings, durationMin, slotMinutes = 30, bufferMin = 10 }) {
  if (!hours?.open || !hours?.close) return [];
  const openAt = parseHHMM(dateStr, hours.open);
  const closeAt = parseHHMM(dateStr, hours.close);

  const taken = bookings.map(b => ({
    start: parseHHMM(dateStr, b.start_time),
    end: parseHHMM(dateStr, b.end_time),
  }));

  const slots = [];
  let cursor = openAt;
  while (true) {
    const slotEnd = addMin(cursor, durationMin);
    if (isBefore(closeAt, slotEnd) && !isEqual(closeAt, slotEnd)) break;

    const conflict = taken.some(t => {
      // overlap if cursor < t.end + buffer && slotEnd > t.start - buffer
      const tStart = addMin(t.start, -bufferMin);
      const tEnd = addMin(t.end, bufferMin);
      return isBefore(cursor, tEnd) && isBefore(tStart, slotEnd);
    });
    if (!conflict) slots.push(toHHMM(cursor));

    cursor = addMin(cursor, slotMinutes);
    if (!isBefore(cursor, closeAt) && !isEqual(cursor, closeAt)) break;
  }
  return slots;
}

export function todayInTz() {
  return format(new Date(), 'yyyy-MM-dd');
}
