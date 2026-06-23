'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../lib/i18n';
import { findPerson } from '../lib/people';

const GROUP_LABELS = {
  women: { de: 'DAMEN', en: 'WOMEN' },
  men:   { de: 'HERREN', en: 'MEN' },
  color: { de: 'COLOR', en: 'COLOUR' },
  care:  { de: 'PFLEGE', en: 'CARE' },
};

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// persist the whole booking flow so leaving + returning resumes where you left off
const STORE_KEY = 'isar_booking_v1';

export default function Wizard() {
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stylistId, setStylistId] = useState('any');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', message: '', consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(12, 0, 0, 0); return d;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services || []));
    fetch('/api/stylists').then(r => r.json()).then(d => setStylists(d.stylists || []));
  }, []);

  // restore saved progress on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.step) setStep(s.step);
        if (Array.isArray(s.selectedIds)) setSelectedIds(s.selectedIds);
        if (s.stylistId) setStylistId(s.stylistId);
        if (s.date) setDate(s.date);
        if (s.time) setTime(s.time);
        if (s.form) setForm(f => ({ ...f, ...s.form }));
        if (s.monthCursor) { const d = new Date(s.monthCursor); if (!isNaN(d.getTime())) setMonthCursor(d); }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // save progress whenever it changes (after hydration, so we don't clobber it)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        step, selectedIds, stylistId, date, time, form,
        monthCursor: monthCursor.toISOString(),
      }));
    } catch {}
  }, [hydrated, step, selectedIds, stylistId, date, time, form, monthCursor]);

  const grouped = useMemo(() => {
    const g = {};
    for (const s of services) {
      g[s.group_key] = g[s.group_key] || [];
      g[s.group_key].push(s);
    }
    return g;
  }, [services]);

  const chosen = services.filter(s => selectedIds.includes(s.id));
  const totalDur = chosen.reduce((sum, s) => sum + s.duration_min, 0);
  const totalFrom = chosen.reduce((sum, s) => sum + s.price_from, 0);
  const allFixed = chosen.every(s => s.is_fixed_price);
  const priceLabel = chosen.length === 0 ? '—'
    : allFixed ? `${totalFrom} €` : `${lang === 'de' ? 'ab' : 'from'} ${totalFrom} €`;

  // load slots when reaching step 3
  useEffect(() => {
    if (!date || !totalDur) { setSlots([]); return; }
    setSlotsLoading(true);
    const q = new URLSearchParams({ date, duration: String(totalDur), stylistId });
    fetch(`/api/bookings/availability?${q}`)
      .then(r => r.json())
      .then(d => { setSlots(d.slots || []); setSlotsLoading(false); });
  }, [date, totalDur, stylistId]);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  async function submit() {
    setSubmitting(true);
    setError('');
    const r = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service_ids: selectedIds,
        stylist_id: stylistId === 'any' ? null : Number(stylistId),
        date, start_time: time,
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, email: form.email, message: form.message,
        lang,
      }),
    });
    const j = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(j.error || 'Fehler'); return; }
    try { localStorage.removeItem(STORE_KEY); } catch {}
    setDone(true);
  }

  if (done) {
    return (
      <div className="container" style={{ textAlign: 'center', maxWidth: 640, paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--ghg-copper)' }}>
          ✓ {lang === 'de' ? 'ANFRAGE GESENDET' : 'REQUEST SENT'}
        </div>
        <h1 className="section-heading" style={{ marginTop: 18 }}>
          {lang === 'de' ? 'Bitte bestätige den Termin über die E-Mail in deinem Postfach.' : 'Please confirm the appointment via the email we just sent.'}
        </h1>
        <p style={{ color: 'var(--fg-2)', marginTop: 18 }}>
          {lang === 'de' ? 'Ohne Bestätigung halten wir den Slot nicht — wir wollen sichergehen, dass er auch wirklich passt.' : 'Without confirmation we cannot hold the slot — we want to be sure it works for you.'}
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <Steps step={step} lang={lang}/>

      {/* STEP 1 — SERVICE */}
      {step === 1 && (
        <div>
          <h2 className="section-heading">{lang === 'de' ? 'Wähle deine Leistungen.' : 'Pick your services.'}</h2>
          <div className="copper-rule"/>
          {Object.keys(GROUP_LABELS).map(gk => grouped[gk] && (
            <div key={gk} style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, letterSpacing: '0.24em', color: 'var(--ghg-copper)', marginBottom: 12, textTransform: 'uppercase' }}>
                {GROUP_LABELS[gk][lang]}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {grouped[gk].map(s => {
                  const sel = selectedIds.includes(s.id);
                  return (
                    <button key={s.id}
                      onClick={() => setSelectedIds(sel ? selectedIds.filter(id => id !== s.id) : [...selectedIds, s.id])}
                      style={{
                        textAlign: 'left',
                        background: sel ? 'var(--ghg-copper)' : 'transparent',
                        color: sel ? '#fff' : 'var(--ghg-paper)',
                        border: `1px solid ${sel ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.18)'}`,
                        padding: '18px 22px',
                        cursor: 'pointer',
                        transition: 'all 300ms var(--e-brand)',
                      }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '0.02em', lineHeight: 1.25 }}>{lang === 'de' ? s.name_de : s.name_en}</div>
                      <div style={{ fontSize: 12, color: sel ? 'rgba(255,255,255,0.85)' : 'var(--fg-2)', marginTop: 6, letterSpacing: '0.04em', wordSpacing: '0.08em' }}>
                        {s.is_fixed_price ? `${s.price_from} €` : `${lang === 'de' ? 'ab' : 'from'} ${s.price_from} €`} · {s.duration_min} min
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <SummaryBar lang={lang} chosen={chosen} totalDur={totalDur} priceLabel={priceLabel}>
            <button className="btn" disabled={!selectedIds.length} onClick={() => setStep(2)}>
              {lang === 'de' ? 'Weiter' : 'Next'}
            </button>
          </SummaryBar>
        </div>
      )}

      {/* STEP 2 — STYLIST */}
      {step === 2 && (
        <div>
          <h2 className="section-heading">{lang === 'de' ? 'Wähle dein:e Stylist:in.' : 'Pick your stylist.'}</h2>
          <div className="copper-rule"/>
          <p style={{ maxWidth: 720, fontSize: 15, color: 'var(--fg-2)', marginBottom: 28, lineHeight: 1.6 }}>
            {lang === 'de'
              ? 'Hinweis: Das ist nur deine Wunsch-Stylist:in. Falls sie oder er an deinem Termin nicht verfügbar ist, übernimmt eine andere Person aus unserem Team — alle bei uns sind erfahren und kümmern sich genauso gut um dein Haar.'
              : 'Note: this is only your preferred stylist. If they are not available at your appointment time, another member of our team will take care of you — everyone here is experienced and will treat your hair just as well.'}
          </p>
          <div className="stylist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, justifyItems: 'center', maxWidth: 960, margin: '0 auto' }}>
            <StylistCard
              active={stylistId === 'any'}
              onClick={() => setStylistId('any')}
              name={lang === 'de' ? 'Egal' : 'No preference'}
              subtitle={lang === 'de' ? 'Wer gerade frei ist' : "Anyone that's free"}
              placeholder="✶"
              lang={lang}
            />
            {stylists.map(st => {
              const person = findPerson(st.name);
              const photo = st.photo_url || person?.photo || null;
              const slug = person?.slug || null;
              return (
                <StylistCard key={st.id}
                  active={stylistId === String(st.id)}
                  onClick={() => setStylistId(String(st.id))}
                  name={st.name}
                  photo={photo}
                  slug={slug}
                  lang={lang}
                />
              );
            })}
          </div>
          <style>{`
            @media (max-width: 760px)  { .stylist-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            @media (max-width: 460px)  { .stylist-grid { grid-template-columns: 1fr !important; } }
          `}</style>
          <SummaryBar lang={lang} chosen={chosen} totalDur={totalDur} priceLabel={priceLabel}>
            <button className="btn-ghost" onClick={() => setStep(1)}>{lang === 'de' ? 'Zurück' : 'Back'}</button>
            <button className="btn" onClick={() => setStep(3)}>{lang === 'de' ? 'Weiter' : 'Next'}</button>
          </SummaryBar>
        </div>
      )}

      {/* STEP 3 — DATE + TIME */}
      {step === 3 && (
        <div>
          <h2 className="section-heading">{lang === 'de' ? 'Wann passt es?' : 'When works for you?'}</h2>
          <div className="copper-rule"/>
          <Calendar
            lang={lang}
            today={today}
            monthCursor={monthCursor}
            setMonthCursor={setMonthCursor}
            value={date}
            onChange={(v) => { setDate(v); setTime(''); }}
          />

          {date && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.2em', color: 'var(--fg-2)', marginBottom: 12 }}>
                {lang === 'de' ? 'FREIE ZEITEN' : 'AVAILABLE TIMES'}
              </div>
              {slotsLoading
                ? <div style={{ color: 'var(--fg-2)' }}>{lang === 'de' ? 'Lade…' : 'Loading…'}</div>
                : slots.length === 0
                  ? <div style={{ color: 'var(--fg-2)' }}>{lang === 'de' ? 'Keine freien Slots an diesem Tag.' : 'No free slots that day.'}</div>
                  : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {slots.map(s => {
                        const sel = time === s;
                        return (
                          <button key={s} onClick={() => setTime(s)} className="tnum" style={{
                            background: sel ? 'var(--ghg-copper)' : 'transparent',
                            color: sel ? '#fff' : 'var(--ghg-paper)',
                            border: `1px solid ${sel ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.18)'}`,
                            padding: '8px 14px', fontSize: 14, letterSpacing: '0.02em', cursor: 'pointer',
                            transition: 'background 200ms var(--e-out), border-color 200ms var(--e-out), color 200ms var(--e-out)',
                          }}>{s}</button>
                        );
                      })}
                    </div>
              }
            </div>
          )}

          <SummaryBar lang={lang} chosen={chosen} totalDur={totalDur} priceLabel={priceLabel}>
            <button className="btn-ghost" onClick={() => setStep(2)}>{lang === 'de' ? 'Zurück' : 'Back'}</button>
            <button className="btn" disabled={!date || !time} onClick={() => setStep(4)}>{lang === 'de' ? 'Weiter' : 'Next'}</button>
          </SummaryBar>
        </div>
      )}

      {/* STEP 4 — DETAILS */}
      {step === 4 && (
        <div>
          <h2 className="section-heading">{lang === 'de' ? 'Deine Daten.' : 'Your details.'}</h2>
          <div className="copper-rule"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 50 }} className="bk-grid">
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input placeholder={lang === 'de' ? 'Vorname' : 'First name'} value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required/>
                <input placeholder={lang === 'de' ? 'Nachname' : 'Last name'} value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required/>
              </div>
              <input placeholder={lang === 'de' ? 'Telefon' : 'Phone'} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
              <input type="email" placeholder={lang === 'de' ? 'E-Mail' : 'Email'} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
              <textarea placeholder={lang === 'de' ? 'Nachricht (optional)' : 'Message (optional)'} value={form.message} onChange={e => setForm({...form, message: e.target.value})}/>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--fg-2)' }}>
                <input type="checkbox" checked={form.consent} onChange={e => setForm({...form, consent: e.target.checked})} style={{ width: 'auto', marginTop: 4 }}/>
                <span>{lang === 'de'
                  ? 'Mit dem Absenden bestätige ich, dass ich die Datenschutzerklärung zur Kenntnis genommen habe.'
                  : 'By submitting I confirm I have read the privacy policy.'}</span>
              </label>
              {error && <div style={{ color: '#ff8c66', fontSize: 14 }}>{error}</div>}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: 22, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--fg-2)', marginBottom: 14 }}>
                {lang === 'de' ? 'ZUSAMMENFASSUNG' : 'SUMMARY'}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                {chosen.map(s => (
                  <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, gap: 8 }}>
                    <span>{lang === 'de' ? s.name_de : s.name_en}</span>
                    <span style={{ color: 'var(--fg-2)' }}>{s.duration_min} min</span>
                  </li>
                ))}
              </ul>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '14px 0' }}/>
              <div style={{ fontSize: 14, color: 'var(--fg-2)' }}>
                <div>{date} · {time} ({totalDur} min)</div>
                <div style={{ marginTop: 6, color: 'var(--ghg-copper)', fontWeight: 600 }}>{priceLabel}</div>
              </div>
            </div>
          </div>
          <SummaryBar lang={lang} chosen={chosen} totalDur={totalDur} priceLabel={priceLabel}>
            <button className="btn-ghost" onClick={() => setStep(3)}>{lang === 'de' ? 'Zurück' : 'Back'}</button>
            <button className="btn" disabled={submitting || !form.first_name || !form.last_name || !form.email || !form.consent} onClick={submit}>
              {submitting ? '…' : (lang === 'de' ? 'TERMIN ANFRAGEN' : 'REQUEST APPOINTMENT')}
            </button>
          </SummaryBar>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) { .bk-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function Steps({ step, lang }) {
  const labels = lang === 'de'
    ? ['LEISTUNG', 'STYLIST', 'ZEIT', 'DETAILS']
    : ['SERVICE', 'STYLIST', 'TIME', 'DETAILS'];
  const progress = ((step - 1) / (labels.length - 1)) * 100;
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${labels.length}, 1fr)`,
        gap: 14, marginBottom: 18,
      }}>
        {labels.map((l, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={l} style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              color: active || done ? 'var(--ghg-paper)' : 'rgba(255,255,255,0.45)',
              transition: 'color 220ms ease',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300,
                color: active ? 'var(--ghg-copper)' : done ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.35)',
                lineHeight: 1,
              }}>{String(n).padStart(2, '0')}</span>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.24em', textTransform: 'uppercase',
              }}>{l}</span>
            </div>
          );
        })}
      </div>
      <div style={{
        position: 'relative', height: 2,
        background: 'rgba(255,255,255,0.10)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${progress}%`,
          background: 'var(--ghg-copper)',
          transition: 'width 320ms var(--e-brand)',
        }}/>
      </div>
    </div>
  );
}

function StylistCard({ active, onClick, name, photo, placeholder, lang, slug, subtitle }) {
  return (
    <div
      onClick={onClick}
      role="button"
      aria-pressed={active}
      style={{
        textAlign: 'center', cursor: 'pointer',
        color: 'var(--ghg-paper)',
        padding: 22,
        border: active ? '2px solid var(--ghg-copper)' : '1px solid rgba(255,255,255,0.08)',
        background: active ? 'rgba(255,90,31,0.06)' : 'transparent',
        boxShadow: active ? '0 18px 48px -20px rgba(255,90,31,0.45)' : 'none',
        transition: 'all 280ms var(--e-brand)',
        transform: active ? 'translateY(-4px)' : 'none',
      }}>
      <div style={{
        width: 220, height: 220,
        margin: '0 auto',
        borderRadius: '50%',
        overflow: 'hidden',
        background: photo ? '#1a1410' : 'linear-gradient(135deg, #1a1410, #5a3220)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ghg-copper)',
        fontFamily: 'var(--font-display)',
        fontSize: 84, letterSpacing: '0.02em',
      }}>
        {photo ? (
          <img src={photo} alt={name} width={220} height={220} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', imageRendering: '-webkit-optimize-contrast' }}/>
        ) : (placeholder ?? (name ? name[0] : '?'))}
      </div>
      <div style={{ marginTop: 18, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '0.01em' }}>{name}</div>
      {subtitle && (
        <div style={{ marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--fg-2)', fontWeight: 400, letterSpacing: '0.04em' }}>
          {subtitle}
        </div>
      )}
      {slug && (
        <Link
          href={`/team/${slug}?from=booking`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-block',
            marginTop: 14,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'var(--ghg-paper)',
            padding: '9px 18px',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            textDecoration: 'none',
            transition: 'all 220ms var(--e-brand)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ghg-copper)'; e.currentTarget.style.borderColor = 'var(--ghg-copper)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
        >
          {lang === 'de' ? 'Bio ansehen' : 'View Bio'}
        </Link>
      )}
    </div>
  );
}

function Calendar({ lang, today, monthCursor, setMonthCursor, value, onChange }) {
  const locale = lang === 'de' ? 'de-DE' : 'en-GB';
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthLabel = monthCursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const dowLabels = lang === 'de'
    ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function shift(delta) {
    const d = new Date(monthCursor); d.setMonth(d.getMonth() + delta); setMonthCursor(d);
  }

  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const canPrev = monthCursor > minMonth;

  return (
    <div style={{ maxWidth: 520, marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => canPrev && shift(-1)}
          disabled={!canPrev}
          aria-label={lang === 'de' ? 'Vorheriger Monat' : 'Previous month'}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.22)',
            color: canPrev ? 'var(--ghg-paper)' : 'rgba(255,255,255,0.25)',
            padding: '8px 12px', cursor: canPrev ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)', fontSize: 13,
          }}>‹</button>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ghg-paper)',
          letterSpacing: '0.04em', textTransform: 'capitalize',
        }}>{monthLabel}</div>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={lang === 'de' ? 'Nächster Monat' : 'Next month'}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.22)',
            color: 'var(--ghg-paper)',
            padding: '8px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13,
          }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {dowLabels.map(l => (
          <div key={l} style={{
            textAlign: 'center', fontFamily: 'var(--font-body)',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--fg-2)', padding: '6px 0',
          }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i}/>;
          const v = fmtDate(d);
          const sel = value === v;
          const past = d < today;
          const isToday = d.getTime() === today.getTime();
          return (
            <button
              key={v}
              type="button"
              onClick={() => !past && onChange(v)}
              disabled={past}
              aria-pressed={sel}
              style={{
                aspectRatio: '1 / 1',
                background: sel ? 'var(--ghg-copper)' : 'transparent',
                color: sel ? '#fff' : past ? 'rgba(255,255,255,0.22)' : 'var(--ghg-paper)',
                border: `1px solid ${sel ? 'var(--ghg-copper)' : isToday ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.14)'}`,
                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
                cursor: past ? 'not-allowed' : 'pointer',
                transition: 'all 200ms var(--e-brand)',
                padding: 0,
              }}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryBar({ lang, chosen, totalDur, priceLabel, children }) {
  return (
    <div style={{
      marginTop: 36, display: 'flex', justifyContent: 'space-between',
      gap: 14, flexWrap: 'wrap', paddingTop: 22,
      borderTop: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
        {chosen.length === 0
          ? (lang === 'de' ? 'Noch keine Leistung gewählt' : 'No service selected yet')
          : `${chosen.length} ${lang === 'de' ? 'Leistung(en)' : 'service(s)'} · ${totalDur} min · ${priceLabel}`}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>{children}</div>
    </div>
  );
}
