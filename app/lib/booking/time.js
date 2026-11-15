// Time-zone helpers. Appointment instants are UTC; schedules are local wall
// clock in the salon's IANA zone (SCH-16). No dependency on the server's TZ.

const MIN = 60_000;
export const MINUTE = MIN;

const fmtCache = new Map();
function partsFormatter(tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return fmtCache.get(tz);
}

// Local wall-clock parts of a UTC instant.
export function localParts(ms, tz) {
  const p = Object.fromEntries(partsFormatter(tz).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour: +p.hour, minute: +p.minute, second: +p.second,
    date: `${p.year}-${p.month}-${p.day}`,
    hhmm: `${p.hour}:${p.minute}`,
    weekday: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay(), // 0 = Sunday
  };
}

function offsetAt(ms, tz) {
  const p = localParts(ms, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
}

// UTC ms for a local date ('YYYY-MM-DD') + minutes after local midnight.
// Returns null for wall-clock times that don't exist (spring-forward gap).
// For repeated times (fall-back) the earlier instant is used.
export function zonedToUtc(dateStr, minutes, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  const candidates = new Set([naive - offsetAt(naive, tz)]);
  candidates.add(naive - offsetAt(naive - 3 * 3600_000, tz));
  candidates.add(naive - offsetAt(naive + 3 * 3600_000, tz));
  const ok = [...candidates]
    .filter(ms => {
      const p = localParts(ms, tz);
      return p.date === dateStr && p.hour * 60 + p.minute === ((minutes % 1440) + 1440) % 1440;
    })
    .sort((a, b) => a - b);
  return ok.length ? ok[0] : null;
}

export function hhmmToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function isValidDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function todayIn(tz, now = Date.now()) {
  return localParts(now, tz).date;
}
