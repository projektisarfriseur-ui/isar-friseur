'use client';
import { useEffect, useState } from 'react';
import AdminShell from '../AdminShell';

const EMPTY = { name: '', role_key: 'Stylist', photo_url: '', bio: '', service_ids: [], active: true, sort_order: 99 };

export default function StylistsPage() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [draft, setDraft] = useState(EMPTY);

  function load() {
    fetch('/api/admin/stylists').then(r => r.json()).then(d => setItems(d.stylists || []));
    fetch('/api/admin/services').then(r => r.json()).then(d => setServices(d.services || []));
  }
  useEffect(() => { load(); }, []);

  async function save(it) {
    await fetch(`/api/admin/stylists/${it.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(it),
    });
    load();
  }
  async function remove(id) {
    if (!confirm('Löschen?')) return;
    await fetch(`/api/admin/stylists/${id}`, { method: 'DELETE' });
    load();
  }
  async function add() {
    if (!draft.name) return;
    await fetch('/api/admin/stylists', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft(EMPTY);
    load();
  }

  return (
    <AdminShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em' }}>STYLISTS</h1>
      <div className="copper-rule"/>
      <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 24 }}>
        Hier fügst du dein Team hinzu. Jede:r Stylist:in erscheint im Buchungs-Wizard.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18, marginBottom: 36 }}>
        {items.map(it => <Card key={it.id} it={it} services={services} onSave={save} onRemove={remove}/>)}
      </div>

      <div style={{ borderTop: '2px solid rgba(184,89,51,0.4)', paddingTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.2em', color: 'var(--ghg-copper)', marginBottom: 14 }}>+ NEU HINZUFÜGEN</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 720 }}>
          <input placeholder="Name" value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})}/>
          <input placeholder="Rolle (z.B. Master Stylist)" value={draft.role_key} onChange={e => setDraft({...draft, role_key: e.target.value})}/>
          <input placeholder="Foto-URL (optional)" value={draft.photo_url} onChange={e => setDraft({...draft, photo_url: e.target.value})} style={{ gridColumn: '1 / -1' }}/>
          <textarea placeholder="Bio (optional)" value={draft.bio} onChange={e => setDraft({...draft, bio: e.target.value})} style={{ gridColumn: '1 / -1' }}/>
          <ServiceMulti value={draft.service_ids} onChange={ids => setDraft({...draft, service_ids: ids})} services={services}/>
          <div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--fg-2)' }}>
              <input type="checkbox" checked={draft.active} onChange={e => setDraft({...draft, active: e.target.checked})} style={{ width: 'auto' }}/>
              aktiv
            </label>
            <input type="number" placeholder="Sort" value={draft.sort_order} onChange={e => setDraft({...draft, sort_order: +e.target.value})} style={{ width: 80, marginTop: 8 }}/>
          </div>
          <button className="btn" onClick={add} style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>+ STYLIST HINZUFÜGEN</button>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ it, services, onSave, onRemove }) {
  const [v, setV] = useState(it);
  useEffect(() => setV(it), [it]);
  const dirty = JSON.stringify(v) !== JSON.stringify(it);

  return (
    <div style={{ padding: 18, border: '1px solid rgba(255,255,255,0.12)', display: 'grid', gap: 10 }}>
      <div style={{
        aspectRatio: '4/5',
        background: v.photo_url ? `url(${v.photo_url}) center/cover` : 'linear-gradient(135deg, #1a1410, #5a3220)',
      }}/>
      <input value={v.name} onChange={e => setV({...v, name: e.target.value})}/>
      <input value={v.role_key} onChange={e => setV({...v, role_key: e.target.value})}/>
      <input placeholder="Foto-URL" value={v.photo_url || ''} onChange={e => setV({...v, photo_url: e.target.value})}/>
      <textarea placeholder="Bio" value={v.bio || ''} onChange={e => setV({...v, bio: e.target.value})}/>
      <ServiceMulti value={v.service_ids || []} onChange={ids => setV({...v, service_ids: ids})} services={services}/>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--fg-2)' }}>
        <input type="checkbox" checked={v.active} onChange={e => setV({...v, active: e.target.checked})} style={{ width: 'auto' }}/>
        aktiv
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={!dirty} onClick={() => onSave(v)} className="btn" style={{ background: dirty ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.1)' }}>SAVE</button>
        <button onClick={() => onRemove(it.id)} style={{ background: 'transparent', border: '1px solid rgba(255,140,102,0.5)', color: '#ff8c66', padding: '8px 14px', cursor: 'pointer' }}>LÖSCHEN</button>
      </div>
    </div>
  );
}

function ServiceMulti({ value, onChange, services }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Erlaubte Leistungen</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 160, overflowY: 'auto', padding: 4 }}>
        {services.map(s => {
          const on = value.includes(s.id);
          return (
            <button key={s.id} type="button"
              onClick={() => onChange(on ? value.filter(x => x !== s.id) : [...value, s.id])}
              style={{
                background: on ? 'var(--ghg-copper)' : 'transparent',
                color: on ? '#fff' : 'var(--ghg-paper)',
                border: `1px solid ${on ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.18)'}`,
                padding: '4px 8px', fontSize: 11, cursor: 'pointer',
              }}>{s.name_de}</button>
          );
        })}
      </div>
    </div>
  );
}
