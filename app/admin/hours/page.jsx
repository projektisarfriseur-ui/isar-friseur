'use client';
import { useEffect, useState } from 'react';
import AdminShell from '../AdminShell';

const DAYS = ['So','Mo','Di','Mi','Do','Fr','Sa'];

export default function HoursPage() {
  const [hours, setHours] = useState([]);
  const [closures, setClosures] = useState([]);
  const [newClosure, setNewClosure] = useState({ date: '', reason: '' });

  function load() {
    fetch('/api/admin/hours').then(r => r.json()).then(d => {
      setHours(d.hours || []); setClosures(d.closures || []);
    });
  }
  useEffect(() => { load(); }, []);

  async function saveDay(weekday, open_time, close_time) {
    await fetch('/api/admin/hours', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stylist_id: null, weekday, open_time, close_time }),
    });
    load();
  }
  async function addClosure() {
    if (!newClosure.date) return;
    await fetch('/api/admin/hours', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(newClosure),
    });
    setNewClosure({ date: '', reason: '' });
    load();
  }
  async function removeClosure(id) {
    await fetch(`/api/admin/hours?closure_id=${id}`, { method: 'DELETE' });
    load();
  }

  const salonHours = [0,1,2,3,4,5,6].map(wd => {
    const row = hours.find(h => h.stylist_id === null && h.weekday === wd);
    return row || { weekday: wd, open_time: '', close_time: '', stylist_id: null };
  });

  return (
    <AdminShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em' }}>HOURS</h1>
      <div className="copper-rule"/>

      <h2 style={{ marginTop: 24, fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.18em', color: 'var(--ghg-copper)' }}>ÖFFNUNGSZEITEN</h2>
      <table style={{ width: '100%', maxWidth: 520, borderCollapse: 'collapse', fontSize: 14, marginTop: 14 }}>
        <tbody>
          {salonHours.map(r => <DayRow key={r.weekday} row={r} onSave={saveDay}/>)}
        </tbody>
      </table>

      <h2 style={{ marginTop: 48, fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.18em', color: 'var(--ghg-copper)' }}>SCHLIESSTAGE</h2>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <input type="date" value={newClosure.date} onChange={e => setNewClosure({...newClosure, date: e.target.value})}/>
        <input placeholder="Grund (Urlaub, Feiertag …)" value={newClosure.reason} onChange={e => setNewClosure({...newClosure, reason: e.target.value})} style={{ minWidth: 240 }}/>
        <button className="btn" onClick={addClosure}>+ HINZUFÜGEN</button>
      </div>
      {closures.length === 0 ? <div style={{ color: 'var(--fg-2)' }}>Keine Schließtage.</div> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {closures.map(c => (
            <li key={c.id} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 14, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, minWidth: 110 }}>{c.date}</span>
              <span style={{ color: 'var(--fg-2)', flex: 1 }}>{c.reason || '—'}</span>
              <button onClick={() => removeClosure(c.id)} style={{ background: 'transparent', border: '1px solid rgba(255,140,102,0.5)', color: '#ff8c66', padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>×</button>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

function DayRow({ row, onSave }) {
  const [open, setOpen] = useState(row.open_time || '');
  const [close, setClose] = useState(row.close_time || '');
  const dirty = open !== (row.open_time || '') || close !== (row.close_time || '');
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{DAYS[row.weekday]}</td>
      <td style={{ padding: '10px 8px' }}><input type="time" value={open} onChange={e => setOpen(e.target.value)} style={{ width: 110 }}/></td>
      <td style={{ padding: '10px 8px' }}><input type="time" value={close} onChange={e => setClose(e.target.value)} style={{ width: 110 }}/></td>
      <td style={{ padding: '10px 8px' }}>
        <button disabled={!dirty} onClick={() => onSave(row.weekday, open || null, close || null)} style={{
          background: dirty ? 'var(--ghg-copper)' : 'transparent',
          color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
          padding: '4px 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        }}>SAVE</button>
      </td>
    </tr>
  );
}
