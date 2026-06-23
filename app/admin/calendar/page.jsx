'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import AdminShell from '../AdminShell';

// status → accent colour (isar dark palette)
const STATUS = {
  pending:   { color: '#f7b955', label: 'Offen' },
  confirmed: { color: '#7bd178', label: 'Bestätigt' },
  completed: { color: '#6aa6ff', label: 'Erledigt' },
  no_show:   { color: '#9aa0a6', label: 'No-show' },
  cancelled: { color: '#ff8c66', label: 'Storniert' },
};

export default function CalendarPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, stRes, svRes] = await Promise.all([
      fetch('/api/admin/bookings'),
      fetch('/api/admin/stylists'),
      fetch('/api/admin/services'),
    ]);
    if (bRes.status === 401) { router.replace('/admin/login'); return; }
    const b = await bRes.json().catch(() => ({}));
    const st = await stRes.json().catch(() => ({}));
    const sv = await svRes.json().catch(() => ({}));
    setBookings(b.bookings || []);
    setStylists(st.stylists || []);
    setServices(sv.services || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // poll every 30s while tab visible (catch guest confirm/cancel)
  useEffect(() => {
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const stylistName = useCallback((id) => {
    if (!id) return 'Egal';
    const s = stylists.find(x => x.id === id);
    return s ? (s.name || s.name_de || `#${id}`) : `#${id}`;
  }, [stylists]);

  const serviceNames = useCallback((ids) => {
    if (!ids?.length) return [];
    return ids.map(id => {
      const s = services.find(x => x.id === id);
      return s ? (s.name_de || s.name_en || `#${id}`) : `#${id}`;
    });
  }, [services]);

  const events = bookings
    .filter(b => showCancelled || b.status !== 'cancelled')
    .map(b => {
      const meta = STATUS[b.status] || STATUS.pending;
      const dimmed = b.status === 'cancelled' || b.status === 'no_show';
      return {
        id: String(b.id),
        title: `${b.first_name} ${b.last_name}`.trim(),
        start: `${b.date}T${b.start_time}:00`,
        end:   `${b.date}T${b.end_time}:00`,
        backgroundColor: dimmed ? 'transparent' : hexToRgba(meta.color, 0.16),
        borderColor: meta.color,
        textColor: '#ffffff',
        extendedProps: b,
      };
    });

  async function setStatus(id, status) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSelected(prev => prev && prev.id === id ? { ...prev, status } : prev);
    load();
  }

  async function remove(id) {
    if (!confirm('Buchung wirklich löschen?')) return;
    await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  }

  return (
    <AdminShell>
      <style>{calendarCss}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em', margin: 0 }}>KALENDER</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.08em', color: 'var(--fg-2)', textTransform: 'uppercase' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: v.color, display: 'inline-block' }} />
              {v.label}
            </span>
          ))}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.08em', color: 'var(--fg-2)', textTransform: 'uppercase', cursor: 'pointer' }}>
            <input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} />
            Storno zeigen
          </label>
        </div>
      </div>
      <div className="copper-rule" />

      <div style={{ position: 'relative', marginTop: 12 }}>
        {loading && (
          <div className="cal-loading">
            <span className="cal-spinner" /> Lade Buchungen…
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={deLocale}
          firstDay={1}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'dayGridMonth,timeGridWeek,timeGridDay',
            center: 'title',
            right: 'prev,next today',
          }}
          events={events}
          eventClick={(info) => setSelected(info.event.extendedProps)}
          eventContent={(arg) => renderEvent(arg, stylistName)}
          height="calc(100vh - 240px)"
          nowIndicator
          eventDisplay="block"
          dayMaxEvents={4}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          scrollTime="09:00:00"
          allDaySlot={false}
        />
      </div>

      {selected && (
        <BookingModal
          b={selected}
          stylistName={stylistName}
          serviceNames={serviceNames}
          onClose={() => setSelected(null)}
          onStatus={setStatus}
          onDelete={remove}
          onNotesSaved={(notes) => {
            setSelected(prev => prev ? { ...prev, admin_notes: notes } : prev);
            setBookings(list => list.map(x => x.id === selected.id ? { ...x, admin_notes: notes } : x));
          }}
        />
      )}
    </AdminShell>
  );
}

/* ── calendar event cell ── */
function renderEvent(arg, stylistName) {
  const b = arg.event.extendedProps;
  const time = arg.timeText;
  return (
    <div className="cal-evt">
      {time && <div className="cal-evt-time">{time}</div>}
      <div className="cal-evt-name">
        {b.status === 'confirmed' ? '✓ ' : ''}{b.first_name} {b.last_name}
        {b.is_walkin && <span className="cal-evt-walkin"> · WALK-IN</span>}
      </div>
      <div className="cal-evt-sub">{stylistName(b.stylist_id)}</div>
    </div>
  );
}

/* ── detail modal ── */
function BookingModal({ b, stylistName, serviceNames, onClose, onStatus, onDelete, onNotesSaved }) {
  const meta = STATUS[b.status] || STATUS.pending;
  const svc = serviceNames(b.service_ids);
  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-bar" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, letterSpacing: '0.01em' }}>
                {b.first_name} {b.last_name}
              </h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: meta.color }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                {meta.label}
                {b.is_walkin && <span style={{ color: 'var(--ghg-copper)', marginLeft: 8 }}>· Walk-in</span>}
              </span>
            </div>
            <button className="cal-x" onClick={onClose} aria-label="Schließen">×</button>
          </div>

          <div className="cal-rows">
            <Row label="Datum" value={formatDate(b.date)} />
            <Row label="Zeit" value={`${b.start_time} – ${b.end_time}`} />
            <Row label="Stylist" value={stylistName(b.stylist_id)} />
            {svc.length > 0 && <Row label="Leistungen" value={svc.join(', ')} />}
            <Row label="Preis" value={b.price_estimate || '—'} />
            {b.phone && <Row label="Telefon" value={<a href={`tel:${b.phone}`} className="cal-link">{b.phone}</a>} />}
            {b.email && <Row label="E-Mail" value={<a href={`mailto:${b.email}`} className="cal-link">{b.email}</a>} />}
            {b.message && <Row label="Nachricht" value={<span style={{ fontStyle: 'italic', color: 'var(--fg-2)' }}>"{b.message}"</span>} />}
          </div>

          {/* status actions */}
          <div className="cal-section">
            <div className="cal-label">Status ändern</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {b.status === 'pending' && <ActBtn onClick={() => onStatus(b.id, 'confirmed')}>Bestätigen</ActBtn>}
              {(b.status === 'pending' || b.status === 'confirmed') && <ActBtn onClick={() => onStatus(b.id, 'cancelled')}>Stornieren</ActBtn>}
              {b.status === 'confirmed' && <ActBtn onClick={() => onStatus(b.id, 'completed')}>Erledigt</ActBtn>}
              {b.status === 'confirmed' && <ActBtn onClick={() => onStatus(b.id, 'no_show')}>No-show</ActBtn>}
              {(b.status === 'cancelled' || b.status === 'no_show' || b.status === 'completed') && <ActBtn onClick={() => onStatus(b.id, 'confirmed')}>Reaktivieren</ActBtn>}
              <ActBtn onClick={() => onDelete(b.id)} danger>Löschen</ActBtn>
            </div>
          </div>

          <NotesEditor bookingId={b.id} initial={b.admin_notes || ''} onSaved={onNotesSaved} />
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

function ActBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} className={`cal-act${danger ? ' danger' : ''}`}>{children}</button>
  );
}

function NotesEditor({ bookingId, initial, onSaved }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const busy = useRef(false);
  useEffect(() => { setValue(initial); }, [bookingId, initial]);
  const dirty = value !== initial;

  async function save() {
    if (!dirty || busy.current) return;
    busy.current = true; setSaving(true);
    const res = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ admin_notes: value.trim() || null }),
    });
    if (res.ok) { onSaved(value.trim() || ''); setFlash(true); setTimeout(() => setFlash(false), 1600); }
    busy.current = false; setSaving(false);
  }

  return (
    <div className="cal-section">
      <div className="cal-label">Interne Notizen</div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={3}
        placeholder="z.B. Allergien, Stammkunde, Wünsche…"
        className="cal-textarea"
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>Nur im Adminbereich sichtbar.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {flash && <span style={{ fontSize: 11, color: '#7bd178' }}>Gespeichert</span>}
          <button onClick={save} disabled={!dirty || saving} className="cal-save" data-dirty={dirty}>
            {saving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function formatDate(d) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
}

const calendarCss = `
  .fc { font-family: var(--font-body); font-variant-numeric: tabular-nums; --fc-border-color: rgba(255,255,255,0.10); --fc-page-bg-color: transparent; --fc-neutral-bg-color: rgba(255,255,255,0.02); --fc-today-bg-color: rgba(255,90,31,0.07); }
  .fc .fc-toolbar-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; letter-spacing: 0.02em; color: var(--ghg-paper); }
  .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 1rem; }
  .fc .fc-button {
    background: transparent !important; border: 1px solid rgba(255,255,255,0.22) !important;
    color: var(--ghg-paper) !important; box-shadow: none !important;
    font-family: var(--font-body) !important; font-size: 0.72rem !important; font-weight: 600 !important;
    letter-spacing: 0.1em !important; text-transform: uppercase !important;
    padding: 0.4rem 0.7rem !important; border-radius: 6px !important;
    transition: background 160ms var(--e-brand), border-color 160ms var(--e-brand) !important;
  }
  @media (hover: hover) and (pointer: fine) { .fc .fc-button:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.4) !important; } }
  .fc .fc-button:active { transform: scale(0.97); }
  .fc .fc-button-primary:not(:disabled).fc-button-active,
  .fc .fc-button-primary:not(:disabled):active {
    background: var(--ghg-copper) !important; border-color: var(--ghg-copper) !important; color: #fff !important;
  }
  .fc .fc-button-primary:disabled { opacity: 0.4 !important; }
  .fc .fc-col-header-cell-cushion { color: var(--fg-2); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 4px; text-decoration: none !important; }
  .fc .fc-daygrid-day-number { color: var(--fg-2); font-size: 0.78rem; text-decoration: none !important; padding: 6px 8px; }
  .fc .fc-day-today .fc-daygrid-day-number { color: var(--ghg-copper); font-weight: 700; }
  .fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.10); }
  .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.08); }
  .fc .fc-timegrid-slot { height: 2.3rem; }
  .fc .fc-timegrid-axis-cushion, .fc .fc-timegrid-slot-label-cushion { color: var(--fg-3); font-size: 0.7rem; }
  .fc-event { cursor: pointer; border-radius: 6px !important; border-left-width: 3px !important; padding: 1px 2px; transition: filter 140ms var(--e-brand); }
  @media (hover: hover) and (pointer: fine) { .fc-event:hover { filter: brightness(1.25); } }
  .fc-event-resizer { display: none !important; }
  .fc-timegrid-now-indicator-line { border-color: var(--ghg-copper) !important; }
  .fc-timegrid-now-indicator-arrow { display: none !important; }
  .fc .fc-more-link { color: var(--ghg-copper); font-size: 0.7rem; }
  .fc *::-webkit-scrollbar { width: 6px; height: 6px; }
  .fc *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 3px; }

  .cal-evt { padding: 2px 4px; overflow: hidden; line-height: 1.25; }
  .cal-evt-time { font-size: 9.5px; opacity: 0.8; }
  .cal-evt-name { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cal-evt-walkin { color: var(--ghg-copper); font-weight: 700; }
  .cal-evt-sub { font-size: 10px; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .cal-loading { position: absolute; inset: 0; z-index: 20; display: flex; align-items: flex-start; justify-content: center; padding-top: 5rem; background: rgba(2,2,2,0.5); backdrop-filter: blur(1px); color: var(--fg-2); font-size: 13px; gap: 10px; }
  .cal-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.25); border-top-color: var(--ghg-copper); border-radius: 50%; animation: cal-spin 0.7s linear infinite; }
  @keyframes cal-spin { to { transform: rotate(360deg); } }

  .cal-modal-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(2,2,2,0.6); backdrop-filter: blur(2px); animation: cal-fade 180ms var(--e-brand); }
  .cal-modal { width: 100%; max-width: 440px; background: #0d0d0d; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,0.6); animation: cal-pop 200ms var(--e-brand); }
  .cal-modal-bar { height: 3px; background: linear-gradient(90deg, var(--ghg-copper), var(--ghg-rust)); }
  @keyframes cal-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cal-pop { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .cal-modal-overlay, .cal-modal { animation: none; } }

  .cal-x { background: transparent; border: 0; color: var(--fg-2); font-size: 26px; line-height: 1; cursor: pointer; transition: color 150ms var(--e-brand); }
  .cal-x:hover { color: var(--ghg-paper); }
  .cal-rows { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
  .cal-row { display: grid; grid-template-columns: 96px 1fr; gap: 12px; font-size: 14px; }
  .cal-row-k { color: var(--fg-3); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding-top: 2px; }
  .cal-row-v { color: var(--ghg-paper); }
  .cal-link { color: var(--ghg-copper); text-decoration: none; }
  .cal-link:hover { text-decoration: underline; }

  .cal-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  .cal-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-3); margin-bottom: 10px; }
  .cal-act { background: transparent; border: 1px solid rgba(255,255,255,0.25); color: var(--ghg-paper); padding: 7px 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 7px; cursor: pointer; transition: background 150ms var(--e-brand), border-color 150ms var(--e-brand), transform 120ms var(--e-brand); }
  @media (hover: hover) and (pointer: fine) { .cal-act:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.45); } }
  .cal-act:active { transform: scale(0.97); }
  .cal-act.danger { border-color: rgba(255,140,102,0.5); color: #ff8c66; }
  .cal-act.danger:hover { background: rgba(255,140,102,0.1); }

  .cal-textarea { width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: var(--ghg-paper); font-family: var(--font-body); font-size: 14px; resize: vertical; outline: none; transition: border-color 150ms var(--e-brand); }
  .cal-textarea:focus { border-color: var(--ghg-copper); }
  .cal-save { background: rgba(255,255,255,0.08); color: var(--fg-2); border: 0; padding: 7px 14px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 7px; cursor: pointer; transition: background 150ms var(--e-brand), color 150ms var(--e-brand); }
  .cal-save[data-dirty="true"] { background: var(--ghg-copper); color: #fff; }
  .cal-save:disabled { cursor: default; }
`;
