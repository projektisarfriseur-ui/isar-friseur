'use client';
import { useEffect, useState } from 'react';
import AdminShell from '../AdminShell';

const FIELDS = [
  { key: 'salon_name', label: 'Salon Name' },
  { key: 'salon_address', label: 'Adresse' },
  { key: 'salon_phone', label: 'Telefon' },
  { key: 'admin_email', label: 'Admin E-Mail (für Benachrichtigungen)' },
  { key: 'cancel_policy_de', label: 'Stornopolitik DE', multi: true },
  { key: 'cancel_policy_en', label: 'Stornopolitik EN', multi: true },
  { key: 'slot_minutes', label: 'Slot-Granularität (Minuten)', num: true },
  { key: 'buffer_minutes', label: 'Puffer zwischen Buchungen (Minuten)', num: true },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => setSettings(d.settings || {}));
  }, []);

  function set(key, value) {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true);
  }

  async function save() {
    await fetch('/api/admin/settings', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setDirty(false); setSavedAt(new Date());
  }

  return (
    <AdminShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em' }}>SETTINGS</h1>
      <div className="copper-rule"/>
      <div style={{ display: 'grid', gap: 18, maxWidth: 720, marginTop: 18 }}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em', color: 'var(--fg-2)', marginBottom: 6 }}>{f.label}</label>
            {f.multi
              ? <textarea value={settings[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} style={{ minHeight: 80 }}/>
              : <input type={f.num ? 'number' : 'text'} value={settings[f.key] ?? ''} onChange={e => set(f.key, f.num ? +e.target.value : e.target.value)}/>}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn" onClick={save} disabled={!dirty}>SPEICHERN</button>
          {savedAt && <span style={{ color: 'var(--fg-2)', fontSize: 13 }}>gespeichert {savedAt.toLocaleTimeString()}</span>}
        </div>
      </div>
    </AdminShell>
  );
}
