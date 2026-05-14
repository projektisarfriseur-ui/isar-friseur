'use client';
import { useEffect, useState } from 'react';
import AdminShell from '../AdminShell';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('');
  const [loaded, setLoaded] = useState(false);

  function load() {
    fetch('/api/admin/bookings').then(r => r.json()).then(d => {
      setBookings(d.bookings || []); setLoaded(true);
    });
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }
  async function remove(id) {
    if (!confirm('Buchung wirklich löschen?')) return;
    await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    load();
  }

  const rows = bookings.filter(b => !filter
    || `${b.first_name} ${b.last_name} ${b.email} ${b.phone}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <AdminShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em' }}>BOOKINGS</h1>
      <div className="copper-rule"/>
      <input placeholder="Suche Name / Mail / Telefon" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 360, marginBottom: 18 }}/>

      {!loaded && <div style={{ color: 'var(--fg-2)' }}>Lade…</div>}
      {loaded && rows.length === 0 && <div style={{ color: 'var(--fg-2)' }}>Keine Buchungen.</div>}
      {rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left', color: 'var(--fg-2)', fontFamily: 'var(--font-display)', letterSpacing: '0.16em' }}>
                <th style={{ padding: '12px 8px' }}>DATUM</th>
                <th style={{ padding: '12px 8px' }}>ZEIT</th>
                <th style={{ padding: '12px 8px' }}>KUNDE</th>
                <th style={{ padding: '12px 8px' }}>KONTAKT</th>
                <th style={{ padding: '12px 8px' }}>PREIS</th>
                <th style={{ padding: '12px 8px' }}>STATUS</th>
                <th style={{ padding: '12px 8px' }}/>
              </tr>
            </thead>
            <tbody>
              {rows.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '12px 8px' }}>{b.date}</td>
                  <td style={{ padding: '12px 8px' }}>{b.start_time} – {b.end_time}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{b.first_name} {b.last_name}{b.is_walkin && <span style={{ marginLeft: 6, color: 'var(--ghg-copper)', fontSize: 10 }}>WALK-IN</span>}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--fg-2)' }}>{b.phone || '—'}<br/>{b.email || '—'}</td>
                  <td style={{ padding: '12px 8px', color: 'var(--fg-2)' }}>{b.price_estimate}</td>
                  <td style={{ padding: '12px 8px', color: statusColor(b.status), fontWeight: 600 }}>{b.status}</td>
                  <td style={{ padding: '12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {b.status === 'pending' && <Btn onClick={() => setStatus(b.id, 'confirmed')}>OK</Btn>}
                    {(b.status === 'pending' || b.status === 'confirmed') && <Btn onClick={() => setStatus(b.id, 'cancelled')}>Storno</Btn>}
                    {b.status === 'confirmed' && <Btn onClick={() => setStatus(b.id, 'completed')}>Erledigt</Btn>}
                    {b.status === 'confirmed' && <Btn onClick={() => setStatus(b.id, 'no_show')}>No-show</Btn>}
                    <Btn onClick={() => remove(b.id)} danger>×</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function Btn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: `1px solid ${danger ? 'rgba(255,140,102,0.5)' : 'rgba(255,255,255,0.3)'}`,
      color: danger ? '#ff8c66' : 'var(--ghg-paper)',
      padding: '4px 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase', cursor: 'pointer',
    }}>{children}</button>
  );
}
function statusColor(s) {
  return s === 'confirmed' ? '#7bd178' : s === 'pending' ? '#f7b955' : s === 'cancelled' ? '#ff8c66' : s === 'completed' ? '#6aa6ff' : 'var(--fg-2)';
}
