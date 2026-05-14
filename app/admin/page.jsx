'use client';
import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';

export default function Dashboard() {
  const [data, setData] = useState({ todayCount: 0, pendingCount: 0, weekCount: 0, revenue: 0, today: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/bookings').then(r => r.json()).then(({ bookings = [] }) => {
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const todayB = bookings.filter(b => b.date === today);
      const pending = bookings.filter(b => b.status === 'pending');
      const week = bookings.filter(b => b.date >= today && b.date <= in7);
      const revenue = week.filter(b => b.status === 'confirmed').reduce((sum, b) => {
        const m = (b.price_estimate || '').match(/(\d+)/);
        return sum + (m ? Number(m[1]) : 0);
      }, 0);
      setData({ todayCount: todayB.length, pendingCount: pending.length, weekCount: week.length, revenue, today: todayB });
      setLoaded(true);
    });
  }, []);

  return (
    <AdminShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em' }}>DASHBOARD</h1>
      <div className="copper-rule"/>
      {!loaded && <div style={{ color: 'var(--fg-2)' }}>Lade…</div>}
      {loaded && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 28 }} className="dash-stats">
            <Stat label="HEUTE" value={data.todayCount}/>
            <Stat label="OFFEN" value={data.pendingCount} accent/>
            <Stat label="7 TAGE" value={data.weekCount}/>
            <Stat label="UMSATZ 7T (€)" value={`ab ${data.revenue}`}/>
          </div>

          <h2 style={{ marginTop: 48, fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--ghg-copper)' }}>HEUTE</h2>
          {data.today.length === 0
            ? <div style={{ color: 'var(--fg-2)', marginTop: 12 }}>Keine Termine heute.</div>
            : (
              <table style={{ marginTop: 16, width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {data.today.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '12px 0', fontWeight: 600 }}>{b.start_time} – {b.end_time}</td>
                      <td style={{ padding: '12px 12px' }}>{b.first_name} {b.last_name}</td>
                      <td style={{ padding: '12px 12px', color: 'var(--fg-2)' }}>{b.price_estimate}</td>
                      <td style={{ padding: '12px 12px', color: statusColor(b.status) }}>{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </>
      )}
      <style>{`
        @media (max-width: 700px) { .dash-stats { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </AdminShell>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ padding: 20, border: '1px solid rgba(255,255,255,0.12)', background: accent ? 'rgba(184,89,51,0.08)' : 'transparent' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em', color: 'var(--fg-2)' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 32, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function statusColor(s) {
  return s === 'confirmed' ? '#7bd178' : s === 'pending' ? '#f7b955' : s === 'cancelled' ? '#ff8c66' : 'var(--fg-2)';
}
