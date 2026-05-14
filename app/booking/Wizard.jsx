'use client';
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../lib/i18n';

const GROUP_LABELS = {
  women: { de: 'DAMEN', en: 'WOMEN' },
  men:   { de: 'HERREN', en: 'MEN' },
  color: { de: 'COLOR', en: 'COLOUR' },
  care:  { de: 'PFLEGE', en: 'CARE' },
};

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

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

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services || []));
    fetch('/api/stylists').then(r => r.json()).then(d => setStylists(d.stylists || []));
  }, []);

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

  const next7 = useMemo(() => {
    const arr = [];
    const today = new Date(); today.setHours(12, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
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
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--ghg-copper)', marginBottom: 12 }}>
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
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'all 300ms var(--e-brand)',
                      }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'de' ? s.name_de : s.name_en}</div>
                      <div style={{ fontSize: 12, color: sel ? 'rgba(255,255,255,0.85)' : 'var(--fg-2)', marginTop: 4 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            <StylistCard
              active={stylistId === 'any'}
              onClick={() => setStylistId('any')}
              name={lang === 'de' ? 'Egal — wer frei ist' : 'No preference'}
              role={lang === 'de' ? 'wir empfehlen einen Stylist' : 'we suggest a stylist'}
            />
            {stylists.map(st => (
              <StylistCard key={st.id}
                active={stylistId === String(st.id)}
                onClick={() => setStylistId(String(st.id))}
                name={st.name}
                role={st.role_key || 'Stylist'}
                photo={st.photo_url}
              />
            ))}
          </div>
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {next7.map(d => {
              const v = fmtDate(d);
              const dn = d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
              const sel = date === v;
              return (
                <button key={v} onClick={() => { setDate(v); setTime(''); }}
                  style={{
                    background: sel ? 'var(--ghg-copper)' : 'transparent',
                    color: sel ? '#fff' : 'var(--ghg-paper)',
                    border: `1px solid ${sel ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.18)'}`,
                    padding: '10px 14px', fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
                    transition: 'all 300ms var(--e-brand)',
                  }}>{dn}</button>
              );
            })}
          </div>

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
                          <button key={s} onClick={() => setTime(s)} style={{
                            background: sel ? 'var(--ghg-copper)' : 'transparent',
                            color: sel ? '#fff' : 'var(--ghg-paper)',
                            border: `1px solid ${sel ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.18)'}`,
                            padding: '8px 14px', fontSize: 14, cursor: 'pointer',
                            transition: 'all 300ms var(--e-brand)',
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
  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={l} style={{
            display: 'inline-flex', alignItems: 'baseline', gap: 10,
            fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.18em',
            color: active ? 'var(--ghg-copper)' : done ? 'var(--ghg-paper)' : 'rgba(255,255,255,0.35)',
          }}>
            <span style={{ fontSize: 18 }}>{String(n).padStart(2, '0')}</span>
            <span>/ {l}</span>
          </div>
        );
      })}
    </div>
  );
}

function StylistCard({ active, onClick, name, role, photo }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'rgba(184,89,51,0.12)' : 'transparent',
      border: `1px solid ${active ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.18)'}`,
      padding: 16, cursor: 'pointer', textAlign: 'left',
      color: 'var(--ghg-paper)',
      transition: 'all 300ms var(--e-brand)',
    }}>
      <div style={{
        aspectRatio: '4/5', marginBottom: 12,
        background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg, #1a1410, #5a3220)',
      }}/>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{name}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.18em', color: 'var(--ghg-copper)', marginTop: 4 }}>{role}</div>
    </button>
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
