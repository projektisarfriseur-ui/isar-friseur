'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import AdminShell from './AdminShell';
import { useMe } from './useMe';
import { useAdminT } from './i18n';
import PaymentBox, { METHOD_ICON } from './PaymentBox';
import HistoryPanel from './HistoryPanel';

const STATUS = {
  pending_approval: { color: '#f7b955' },
  confirmed: { color: '#7bd178' },
  arrived: { color: '#4fd1c5' },
  completed: { color: '#6aa6ff' },
  no_show: { color: '#9aa0a6' },
  cancelled: { color: '#ff8c66' },
};

// One accent per stylist so the boss can tell calendars apart at a glance.
const STAFF_COLORS = ['#ff5a1f', '#6aa6ff', '#7bd178', '#f7b955', '#c084fc', '#4fd1c5', '#f472b6', '#a3e635'];

const NEXT_ACTIONS = {
  pending_approval: [['confirmed', 'act.confirm', true]],
  confirmed: [['arrived', 'act.arrived'], ['no_show', 'act.no_show'], ['cancelled', 'act.cancel', true]],
  arrived: [['completed', 'act.completed'], ['cancelled', 'act.cancel', true]],
  completed: [['arrived', 'act.fixArrived', true]],
  no_show: [['confirmed', 'act.fixConfirmed', true]],
  cancelled: [],
};

const euro = (minor, estimate, t, locale) => minor == null ? '—'
  : `${estimate ? `${t('appt.from')} ` : ''}${(minor / 100).toLocaleString(locale, { minimumFractionDigits: minor % 100 ? 2 : 0 })} €`;

const serviceName = (item, lang) => (lang === 'en' && item.name_en) || item.name_de;

export default function AdminCalendarPage() {
  const me = useMe();
  const { t, lang } = useAdminT();
  const calRef = useRef(null);
  const [staffFilter, setStaffFilter] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [histKey, setHistKey] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const on = () => setNarrow(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const colorOf = useMemo(() => {
    const map = new Map((me?.staff || []).map((s, i) => [s.id, STAFF_COLORS[i % STAFF_COLORS.length]]));
    return (id) => map.get(id) || '#ffffff';
  }, [me]);
  const nameOf = useCallback((id) => me?.staff.find(s => s.id === id)?.name || '—', [me]);

  const fetchEvents = useCallback(async (info, success, failure) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ from: info.start.toISOString(), to: info.end.toISOString() });
      if (staffFilter) q.set('staffId', staffFilter);
      if (showCancelled) q.set('cancelled', '1');
      const r = await fetch(`/api/staff/appointments?${q}`);
      if (r.status === 401) { window.location.href = '/admin/login'; return; }
      const { appointments = [] } = await r.json();
      success(appointments.map(a => {
        const staffId = a.items[0]?.staff_id;
        const meta = STATUS[a.status] || STATUS.confirmed;
        const accent = me?.user?.isAdmin ? colorOf(staffId) : meta.color;
        const dim = a.status === 'cancelled' || a.status === 'no_show';
        return {
          id: a.id,
          start: a.starts_at,
          end: a.ends_at,
          title: `${a.first_name} ${a.last_name}`,
          backgroundColor: dim ? hexToRgba(accent, 0.22) : accent,
          borderColor: dim ? hexToRgba(accent, 0.6) : accent,
          textColor: dim ? '#fff' : readableOn(accent),
          classNames: dim ? ['cal-evt-dim'] : [],
          extendedProps: { appt: a, staffId },
        };
      }));
    } catch (e) {
      failure(e);
    } finally {
      setLoading(false);
    }
  }, [staffFilter, showCancelled, colorOf, me]);

  const refetch = useCallback(() => calRef.current?.getApi().refetchEvents(), []);

  // New online bookings appear without reloading (30 s, only while visible).
  useEffect(() => {
    const iv = setInterval(() => { if (document.visibilityState === 'visible') refetch(); }, 30000);
    return () => clearInterval(iv);
  }, [refetch]);

  useEffect(() => { refetch(); }, [staffFilter, showCancelled, refetch]);

  if (!me) return <AdminShell me={null}><p style={{ color: 'var(--fg-2)' }}>{t('common.loading')}</p></AdminShell>;

  const isBoss = me.user.isAdmin;
  return (
    <AdminShell me={me} wide>
      <style>{calendarCss}</style>
      <div className={`cal-layout${isBoss ? ' side-hist' : ''}`}>
      <aside className="cal-side">
        {isBoss && (
          <div role="group" aria-label={t('cal.filter')} className="cal-chips">
            <Chip active={!staffFilter} onClick={() => setStaffFilter('')}>{t('cal.all')}</Chip>
            {me.staff.map(s => (
              <Chip key={s.id} active={staffFilter === String(s.id)} color={colorOf(s.id)} onClick={() => setStaffFilter(String(s.id))}>
                {s.name}
              </Chip>
            ))}
          </div>
        )}
        <label className="cal-toggle">
          <input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} />
          {t('cal.showCancelled')}
        </label>
        {isBoss && <HistoryPanel refreshKey={histKey} onDeleted={refetch} />}
      </aside>

      <div className="cal-scroll" style={{ position: 'relative', minWidth: 0 }}>
        {loading && <div className="cal-loading" aria-live="polite"><span className="cal-spinner" /> {t('cal.loadingEvents')}</div>}
        <FullCalendar
          key={narrow ? 'narrow' : 'wide'}
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={lang === 'en' ? enGbLocale : deLocale}
          firstDay={1}
          initialView={narrow ? 'timeGridDay' : 'timeGridWeek'}
          headerToolbar={narrow
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : { left: 'timeGridDay,timeGridWeek,dayGridMonth', center: 'title', right: 'prev,next today' }}
          events={fetchEvents}
          eventClick={(info) => setSelectedId(info.event.id)}
          eventContent={(arg) => renderEvent(arg, isBoss, nameOf, t, lang)}
          height="auto"
          nowIndicator
          // Opening hours: Mon–Fri 9–19, Sat 9–17, Sun closed (Sat after 17:00 is shaded).
          slotMinTime="09:00:00"
          slotMaxTime="19:00:00"
          businessHours={[
            { daysOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '19:00' },
            { daysOfWeek: [6], startTime: '09:00', endTime: '17:00' },
          ]}
          scrollTime="09:00:00"
          allDaySlot={false}
          hiddenDays={[0]}
          eventDisplay="block"
          slotEventOverlap={false}
          eventMinHeight={34}
          dayMaxEvents={4}
        />
      </div>
      </div>

      {selectedId && (
        <AppointmentModal
          id={selectedId}
          me={me}
          nameOf={nameOf}
          onClose={() => setSelectedId(null)}
          onChanged={() => { refetch(); setHistKey(k => k + 1); }}
        />
      )}
    </AdminShell>
  );
}

function Chip({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`cal-chip${color ? ' cal-chip-filled' : ''}`}
      data-active={active}
      style={color ? { background: color, borderColor: color, color: readableOn(color) } : undefined}
    >
      {children}
      {active && color && <span aria-hidden="true" style={{ marginLeft: 'auto', fontWeight: 700 }}>✓</span>}
    </button>
  );
}

function renderEvent(arg, isBoss, nameOf, t, lang) {
  const { appt, staffId } = arg.event.extendedProps;
  const meta = STATUS[appt.status];
  // Short slots (< 35 min in day/week view) put time + name on one line so
  // nothing is cut off; the status pill always sits in the top row, right side.
  // Week view: colour + start time + a check when done. Full details on hover / click.
  if (arg.view.type === 'timeGridWeek') {
    const done = appt.status === 'completed';
    const [from, to] = (arg.timeText || '').split(/ [-–] /);
    const pay = appt.payment_method;
    const tip = `${arg.timeText} · ${arg.event.title}${isBoss ? ` · ${nameOf(staffId)}` : ''} · ${appt.items.map(i => serviceName(i, lang)).join(', ')}`;
    return (
      <div className="cal-evt cal-evt-week" title={tip}>
        <span className="cal-evt-time">
          <span>{from}</span>{to && <> – <span>{to}</span></>}
        </span>
        <span className="cal-evt-wstatus">
          {done ? '✓ ' : ''}{t(`status.${appt.status}`)}
          {pay && <span className="cal-evt-wpay"> · {METHOD_ICON[pay]} {t(`pay.method.${pay}`)}</span>}
        </span>
      </div>
    );
  }
  const minutes = arg.event.end ? (arg.event.end - arg.event.start) / 60000 : 60;
  const short = arg.view.type.startsWith('timeGrid') && minutes < 35;
  const status = appt.status !== 'confirmed' && (
    <span className="cal-evt-status">
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta?.color }} />
      {t(`status.${appt.status}`)}
    </span>
  );
  const sub = (
    <div className="cal-evt-sub">
      {isBoss ? `${nameOf(staffId)} · ` : ''}{appt.items.map(i => serviceName(i, lang)).join(', ')}
    </div>
  );
  if (short) {
    return (
      <div className="cal-evt cal-evt-short">
        <div className="cal-evt-top">
          {arg.timeText ? <span className="cal-evt-time">{arg.timeText}</span> : <span />}
          {status}
        </div>
        <div className="cal-evt-name">{arg.event.title}</div>
      </div>
    );
  }
  return (
    <div className="cal-evt">
      <div className="cal-evt-top">
        {arg.timeText ? <span className="cal-evt-time">{arg.timeText}</span> : <span />}
        {status}
      </div>
      <div className="cal-evt-name">{arg.event.title}</div>
      {sub}
    </div>
  );
}

function AppointmentModal({ id, me, nameOf, onClose, onChanged }) {
  const [appt, setAppt] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);   // status awaiting a reason
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeRef = useRef(null);
  const { t, lang, locale } = useAdminT();

  const load = useCallback(async () => {
    const r = await fetch(`/api/staff/appointments/${id}`);
    if (!r.ok) { setError(t('appt.err.load')); return; }
    setAppt((await r.json()).appointment);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function setStatus(status) {
    setBusy(true); setError('');
    const r = await fetch(`/api/staff/appointments/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, version: appt.version, reason: reason || undefined, notifyCustomer: notify }),
    });
    setBusy(false);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const known = ['stale_version', 'reason_required', 'forbidden', 'invalid_transition'];
      setError(t(known.includes(j.error) ? `appt.err.${j.error}` : 'appt.err.save'));
      if (j.error === 'stale_version') load();
      return;
    }
    setPending(null); setReason('');
    await load();
    onChanged();
  }

  async function addNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/staff/appointments/${id}/notes`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: note }),
    });
    setBusy(false);
    if (r.ok) { setNote(''); load(); onChanged(); } else setError(t('appt.err.note'));
  }

  async function deleteAppt() {
    setBusy(true); setError('');
    const r = await fetch(`/api/staff/appointments/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error === 'forbidden' ? 'Dafür fehlt dir die Berechtigung.' : 'Löschen fehlgeschlagen.');
      return;
    }
    onChanged();
    onClose();
  }

  const meta = appt ? STATUS[appt.status] : null;
  const actions = appt ? (NEXT_ACTIONS[appt.status] || []).filter(([, , adminOnly]) => !adminOnly || me.user.isAdmin) : [];
  const fmt = (iso, opts) => new Date(iso).toLocaleString(locale, { timeZone: me.timezone, ...opts });

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" role="dialog" aria-modal="true" aria-labelledby="appt-title" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-bar" />
        <div style={{ padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 id="appt-title" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: 0 }}>
                {appt ? `${appt.first_name} ${appt.last_name}` : t('appt.fallbackTitle')}
              </h2>
              {meta && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: meta.color }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />{t(`status.${appt.status}`)} · #{appt.reference}
                </span>
              )}
            </div>
            <button ref={closeRef} className="cal-x" onClick={onClose} aria-label={t('common.close')}>×</button>
          </div>

          {!appt && !error && <p style={{ color: 'var(--fg-2)' }}>{t('common.loading')}</p>}
          {appt && (
            <>
              <div className="cal-rows">
                <Row label={t('appt.date')} value={fmt(appt.starts_at, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} />
                <Row label={t('appt.time')} value={`${fmt(appt.starts_at, { hour: '2-digit', minute: '2-digit' })} – ${fmt(appt.ends_at, { hour: '2-digit', minute: '2-digit' })}`} />
                <Row label={t('appt.stylist')} value={nameOf(appt.items[0]?.staff_id)} />
                <Row label={t('appt.services')} value={appt.items.map(i => `${serviceName(i, lang)} (${i.duration_min} min)`).join(', ')} />
                <Row label={t('appt.price')} value={euro(appt.total_price_minor, appt.price_is_estimate, t, locale)} />
                {appt.phone && <Row label={t('appt.phone')} value={<a className="cal-link" href={`tel:${appt.phone}`}>{appt.phone}</a>} />}
                {appt.email && <Row label={t('common.email')} value={<a className="cal-link" href={`mailto:${appt.email}`}>{appt.email}</a>} />}
                {appt.customer_message && <Row label={t('appt.message')} value={<em style={{ color: 'var(--fg-2)' }}>„{appt.customer_message}“</em>} />}
                {appt.cancel_reason && <Row label={t('appt.cancelReason')} value={appt.cancel_reason} />}
                <Row label={t('appt.source')} value={['online', 'phone', 'walk_in', 'admin', 'waitlist'].includes(appt.source) ? t(`source.${appt.source}`) : appt.source} />
              </div>

              {actions.length > 0 && (
                <div className="cal-section">
                  <div className="cal-label">{t('appt.status')}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {actions.map(([status, label]) => {
                      const needsReason = status === 'cancelled' || appt.status === 'completed' || appt.status === 'no_show';
                      return (
                        <button key={status} disabled={busy} className={`cal-act${status === 'cancelled' ? ' danger' : ''}`}
                          onClick={() => needsReason ? setPending(status) : setStatus(status)}>{t(label)}</button>
                      );
                    })}
                  </div>
                  {pending && (
                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                      <label htmlFor="reason" className="cal-label" style={{ margin: 0 }}>{t('appt.reason')}</label>
                      <input id="reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={300} className="cal-textarea" />
                      {pending === 'cancelled' && appt.email && (
                        <label style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--fg-2)', alignItems: 'center' }}>
                          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} /> {t('appt.notify')}
                        </label>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="cal-act" onClick={() => { setPending(null); setReason(''); }}>{t('common.cancel')}</button>
                        <button className="cal-save" data-dirty={Boolean(reason.trim())} disabled={busy || !reason.trim()} onClick={() => setStatus(pending)}>{t('common.confirm')}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <PaymentBox appt={appt} onSaved={() => { load(); onChanged(); }} />

              <div className="cal-section">
                <div className="cal-label">{t('appt.notes', { n: appt.notes.length })}</div>
                {appt.notes.length === 0 && <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '0 0 10px' }}>{t('appt.noNotes')}</p>}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'grid', gap: 10 }}>
                  {appt.notes.map(n => (
                    <li key={n.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginBottom: 4 }}>
                        {n.author_name} · {fmt(n.created_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                    </li>
                  ))}
                </ul>
                <form onSubmit={addNote} style={{ display: 'grid', gap: 8 }}>
                  <label htmlFor="note" className="cal-label" style={{ margin: 0 }}>{t('appt.newNote')}</label>
                  <textarea id="note" rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={2000}
                    className="cal-textarea" placeholder={t('appt.notePlaceholder')} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t('appt.noteHint')}</span>
                    <button className="cal-save" data-dirty={Boolean(note.trim())} disabled={busy || !note.trim()}>{t('common.save')}</button>
                  </div>
                </form>
              </div>

              {me.user.isAdmin && (
                <div className="cal-section">
                  <div className="cal-label">Löschen</div>
                  {!confirmDelete ? (
                    <button className="cal-act danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
                      Termin & Kundendaten löschen
                    </button>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#ff8c66' }}>
                        Termin, Kundendaten, Notizen und E-Mail-Einträge werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="cal-act" disabled={busy} onClick={() => setConfirmDelete(false)}>Abbrechen</button>
                        <button className="cal-delete" disabled={busy} onClick={deleteAppt}>Endgültig löschen</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <div role="alert" aria-live="assertive" style={{ color: '#ff8c66', fontSize: 13, marginTop: 12 }}>{error}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="cal-row">
      <span className="cal-row-k">{label}</span>
      <span className="cal-row-v">{value}</span>
    </div>
  );
}

// Dark text on light fills (yellow, green, teal), white on darker ones.
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? '#141414' : '#ffffff';
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const calendarCss = `
  .fc { font-family: var(--font-body); font-variant-numeric: tabular-nums; --fc-border-color: rgba(255,255,255,0.10); --fc-page-bg-color: transparent; --fc-neutral-bg-color: rgba(255,255,255,0.02); --fc-today-bg-color: rgba(255,90,31,0.07); }
  .fc .fc-toolbar-title { font-family: var(--font-body); font-size: 1.3rem; font-weight: 700; letter-spacing: 0.01em; color: var(--ghg-paper); }
  .fc .fc-toolbar { flex-wrap: wrap; gap: 8px; }
  .fc .fc-button { background: transparent !important; border: 1px solid rgba(255,255,255,0.22) !important; color: var(--ghg-paper) !important; box-shadow: none !important; font-family: var(--font-body) !important; font-size: 0.76rem !important; font-weight: 700 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; padding: 0.55rem 0.8rem !important; min-height: 44px; border-radius: 6px !important; }
  @media (hover: hover) and (pointer: fine) { .fc .fc-button:hover { background: rgba(255,255,255,0.07) !important; } }
  .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background: var(--ghg-copper) !important; border-color: var(--ghg-copper) !important; color: #fff !important; }
  .fc .fc-button-primary:disabled { opacity: 0.4 !important; }
  .fc .fc-col-header-cell-cushion { color: var(--ghg-paper); font-size: 0.8rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 4px; text-decoration: none !important; }
  .fc .fc-daygrid-day-number { color: var(--ghg-paper); font-size: 0.85rem; font-weight: 700; text-decoration: none !important; }
  .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.08); }
  .fc .fc-timegrid-slot { height: 5rem; }
  .fc .fc-timegrid-slot-label-cushion { color: var(--fg-2); font-size: 0.8rem; font-weight: 600; }
  .fc-event { cursor: pointer; border-radius: 10px !important; border-width: 1px !important; box-shadow: 0 4px 14px -6px rgba(0,0,0,0.6) !important; }
  .fc .fc-timegrid-event-harness { padding: 3px 4px; box-sizing: border-box; }
  .fc .fc-timegrid-event-harness-inset .fc-timegrid-event { box-shadow: 0 4px 14px -6px rgba(0,0,0,0.6) !important; }
  .fc .fc-timegrid-col-events { margin: 0 4px 0 2px; }
  .fc .fc-daygrid-event { margin: 2px 4px !important; padding: 2px 0; }
  .cal-evt-dim { border-style: dashed !important; }
  .cal-evt-dim .cal-evt-name { text-decoration: line-through; opacity: 0.85; }
  @media (hover: hover) and (pointer: fine) { .fc-event:hover { filter: brightness(1.25); } }
  .fc .fc-non-business { background: repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 6px, rgba(255,255,255,0.07) 6px 12px); }
  .fc-timegrid-now-indicator-line { border-color: var(--ghg-copper) !important; }
  .cal-evt { padding: 7px 10px; overflow: hidden; line-height: 1.3; height: 100%; display: flex; flex-direction: column; gap: 3px; }
  .cal-evt-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 8px; min-width: 0; }
  .cal-evt-short { padding: 5px 10px; gap: 1px; }
  .cal-evt-week { padding: 4px 5px; gap: 1px; line-height: 1.2; }
  .cal-evt-week .cal-evt-time { font-size: 12px; opacity: 1; white-space: normal; }
  .cal-evt-week .cal-evt-time span { white-space: nowrap; }
  .cal-evt-wstatus, .cal-evt-wpay { font-size: 11px; font-weight: 700; line-height: 1.25; overflow-wrap: normal; word-break: keep-all; hyphens: none; }
  .cal-evt-wpay { font-weight: 600; opacity: 0.9; }
  .cal-evt-done { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; font-size: 11px; font-weight: 700; line-height: 1; }
  .cal-evt-short .cal-evt-top { flex-wrap: nowrap; }
  .cal-evt-short .cal-evt-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cal-evt-time { font-size: 12px; font-weight: 700; opacity: 0.85; white-space: nowrap; }
  .cal-evt-name { font-size: 14.5px; font-weight: 700; white-space: normal; overflow-wrap: break-word; }
  .cal-evt-status { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; }
  .cal-evt-sub { font-size: 12.5px; font-weight: 600; opacity: 0.9; white-space: normal; overflow-wrap: break-word; }
  .cal-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: var(--ghg-paper); font-size: 14px; font-weight: 600; cursor: pointer; transition: background 150ms var(--e-brand), border-color 150ms var(--e-brand); }
  .cal-layout { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 20px; align-items: start; }
  /* Left column stays put while the calendar scrolls. top = header + main padding,
     i.e. exactly where it already sits, so it never shifts when scrolling starts. */
  .cal-side { position: sticky; top: calc(var(--admin-head, 73px) + 32px); display: grid; gap: 14px; min-width: 0; align-content: start;
    max-height: calc(100vh / 0.9 - var(--admin-head, 73px) - 48px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
  /* Boss: customer history sits in the left column under the filters. */
  .cal-layout.side-hist { grid-template-columns: 280px minmax(0, 1fr); }
  .cal-side .hist { position: static; max-height: none; }
  .cal-chips { display: grid; gap: 6px; }
  .cal-chips .cal-chip { width: 100%; justify-content: flex-start; min-height: 35px; padding: 0 11px; font-size: 11.5px; gap: 6px; }
  .cal-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 600; color: var(--ghg-paper); cursor: pointer; min-height: 35px; }
  .cal-toggle input { width: 14px; height: 14px; accent-color: var(--ghg-copper); }
  @media (max-width: 760px) {
    .cal-layout { grid-template-columns: 1fr; gap: 16px; }
    .cal-layout.side-hist { grid-template-columns: 1fr; }
    .cal-side { position: static; max-height: none; overflow: visible; }
    .cal-chips { display: flex; flex-wrap: wrap; }
    .cal-chips .cal-chip { width: auto; }
  }
  .cal-chip[data-active="true"] { background: rgba(255,90,31,0.16); border-color: var(--ghg-copper); }
  .cal-chip-filled { font-weight: 700; }
  .cal-chip-filled[data-active="true"] { box-shadow: 0 0 0 2px var(--ghg-ink), 0 0 0 4px var(--ghg-paper); }
  @media (hover: hover) and (pointer: fine) { .cal-chip-filled:hover { filter: brightness(1.08); } }
  .cal-chip:focus-visible, .cal-act:focus-visible, .cal-save:focus-visible, .cal-x:focus-visible { outline: 2px solid var(--ghg-copper); outline-offset: 2px; }
  .cal-loading { position: absolute; inset: 0; z-index: 5; display: flex; align-items: flex-start; justify-content: center; padding-top: 4rem; background: rgba(2,2,2,0.4); color: var(--fg-2); font-size: 13px; gap: 10px; pointer-events: none; }
  .cal-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.25); border-top-color: var(--ghg-copper); border-radius: 50%; animation: cal-spin 0.7s linear infinite; }
  @keyframes cal-spin { to { transform: rotate(360deg); } }
  .cal-modal-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(2,2,2,0.6); animation: cal-fade 180ms var(--e-brand); }
  .cal-modal { width: 100%; max-width: 480px; background: #0d0d0d; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.6); animation: cal-pop 200ms var(--e-brand); }
  .cal-modal-bar { height: 3px; background: linear-gradient(90deg, var(--ghg-copper), var(--ghg-rust)); }
  @keyframes cal-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cal-pop { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .cal-modal-overlay, .cal-modal, .cal-spinner { animation: none; } }
  .cal-x { background: transparent; border: 0; color: var(--fg-2); font-size: 28px; line-height: 1; cursor: pointer; min-width: 44px; min-height: 44px; }
  .cal-rows { margin-top: 18px; display: grid; gap: 10px; }
  .cal-row { display: grid; grid-template-columns: 100px 1fr; gap: 12px; font-size: 14px; font-weight: 500; }
  .cal-row-k { color: var(--fg-3); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding-top: 2px; }
  .cal-link { color: var(--ghg-copper); }
  .cal-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  .cal-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-3); margin-bottom: 10px; display: block; }
  .cal-act { background: transparent; border: 1px solid rgba(255,255,255,0.25); color: var(--ghg-paper); min-height: 44px; padding: 0 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 7px; cursor: pointer; }
  .cal-act:active { transform: scale(0.97); }
  .cal-act.danger { border-color: rgba(255,140,102,0.5); color: #ff8c66; }
  .cal-delete { background: #d93a1a; color: #fff; border: 0; min-height: 44px; padding: 0 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 7px; cursor: pointer; }
  .cal-delete:disabled, .cal-act:disabled { opacity: 0.5; cursor: default; }
  .cal-delete:focus-visible { outline: 2px solid var(--ghg-copper); outline-offset: 2px; }
  .cal-textarea { width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: var(--ghg-paper); font-family: var(--font-body); font-size: 14px; resize: vertical; }
  .cal-textarea:focus { border-color: var(--ghg-copper); outline: none; }
  .cal-save { background: rgba(255,255,255,0.08); color: var(--fg-2); border: 0; min-height: 44px; padding: 0 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 7px; cursor: pointer; }
  .cal-save[data-dirty="true"] { background: var(--ghg-copper); color: #fff; }
  @media (max-width: 520px) { .cal-row { grid-template-columns: 1fr; gap: 2px; } }
`;
