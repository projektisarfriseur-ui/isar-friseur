'use client';
import { useEffect, useState } from 'react';
import AdminShell from '../AdminShell';

const EMPTY = { group_key: 'women', name_de: '', name_en: '', price_from: 0, duration_min: 30, is_fixed_price: false, sort_order: 99, active: true };

export default function ServicesPage() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(EMPTY);

  function load() { fetch('/api/admin/services').then(r => r.json()).then(d => setItems(d.services || [])); }
  useEffect(() => { load(); }, []);

  async function save(it) {
    await fetch(`/api/admin/services/${it.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(it),
    });
    load();
  }
  async function remove(id) {
    if (!confirm('Löschen?')) return;
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    load();
  }
  async function add() {
    if (!draft.name_de) return;
    await fetch('/api/admin/services', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setDraft(EMPTY);
    load();
  }

  return (
    <AdminShell>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '0.06em' }}>SERVICES</h1>
      <div className="copper-rule"/>

      <div style={{ overflowX: 'auto', marginTop: 18 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: 'var(--fg-2)', fontFamily: 'var(--font-display)', letterSpacing: '0.16em', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>GRUPPE</th>
              <th style={{ padding: 8 }}>NAME DE</th>
              <th style={{ padding: 8 }}>NAME EN</th>
              <th style={{ padding: 8 }}>AB €</th>
              <th style={{ padding: 8 }}>MIN</th>
              <th style={{ padding: 8 }}>FIX</th>
              <th style={{ padding: 8 }}>SORT</th>
              <th style={{ padding: 8 }}>AKTIV</th>
              <th style={{ padding: 8 }}/>
            </tr>
          </thead>
          <tbody>
            {items.map(it => <Row key={it.id} it={it} onSave={save} onRemove={remove}/>)}
            <NewRow draft={draft} setDraft={setDraft} onAdd={add}/>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Row({ it, onSave, onRemove }) {
  const [v, setV] = useState(it);
  useEffect(() => setV(it), [it]);
  const dirty = JSON.stringify(v) !== JSON.stringify(it);
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <td><select value={v.group_key} onChange={e => setV({...v, group_key: e.target.value})}><option>women</option><option>men</option><option>color</option><option>care</option></select></td>
      <td><input value={v.name_de} onChange={e => setV({...v, name_de: e.target.value})}/></td>
      <td><input value={v.name_en} onChange={e => setV({...v, name_en: e.target.value})}/></td>
      <td><input type="number" value={v.price_from} onChange={e => setV({...v, price_from: +e.target.value})} style={{ width: 70 }}/></td>
      <td><input type="number" value={v.duration_min} onChange={e => setV({...v, duration_min: +e.target.value})} style={{ width: 70 }}/></td>
      <td><input type="checkbox" checked={v.is_fixed_price} onChange={e => setV({...v, is_fixed_price: e.target.checked})}/></td>
      <td><input type="number" value={v.sort_order} onChange={e => setV({...v, sort_order: +e.target.value})} style={{ width: 60 }}/></td>
      <td><input type="checkbox" checked={v.active} onChange={e => setV({...v, active: e.target.checked})}/></td>
      <td style={{ display: 'flex', gap: 6 }}>
        <button disabled={!dirty} onClick={() => onSave(v)} style={btn(dirty ? 'var(--ghg-copper)' : 'transparent')}>SAVE</button>
        <button onClick={() => onRemove(it.id)} style={btn('transparent', true)}>×</button>
      </td>
    </tr>
  );
}
function NewRow({ draft, setDraft, onAdd }) {
  return (
    <tr style={{ borderTop: '2px solid rgba(184,89,51,0.4)' }}>
      <td><select value={draft.group_key} onChange={e => setDraft({...draft, group_key: e.target.value})}><option>women</option><option>men</option><option>color</option><option>care</option></select></td>
      <td><input value={draft.name_de} placeholder="Name DE" onChange={e => setDraft({...draft, name_de: e.target.value})}/></td>
      <td><input value={draft.name_en} placeholder="Name EN" onChange={e => setDraft({...draft, name_en: e.target.value})}/></td>
      <td><input type="number" value={draft.price_from} onChange={e => setDraft({...draft, price_from: +e.target.value})} style={{ width: 70 }}/></td>
      <td><input type="number" value={draft.duration_min} onChange={e => setDraft({...draft, duration_min: +e.target.value})} style={{ width: 70 }}/></td>
      <td><input type="checkbox" checked={draft.is_fixed_price} onChange={e => setDraft({...draft, is_fixed_price: e.target.checked})}/></td>
      <td><input type="number" value={draft.sort_order} onChange={e => setDraft({...draft, sort_order: +e.target.value})} style={{ width: 60 }}/></td>
      <td><input type="checkbox" checked={draft.active} onChange={e => setDraft({...draft, active: e.target.checked})}/></td>
      <td><button onClick={onAdd} style={btn('var(--ghg-copper)')}>+ ADD</button></td>
    </tr>
  );
}
function btn(bg, danger) {
  return {
    background: bg, color: danger ? '#ff8c66' : '#fff', border: `1px solid ${danger ? 'rgba(255,140,102,0.5)' : 'rgba(255,255,255,0.3)'}`,
    padding: '4px 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
  };
}
