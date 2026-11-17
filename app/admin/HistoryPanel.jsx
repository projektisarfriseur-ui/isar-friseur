'use client';
// Owner's customer history: right-hand panel next to the calendar, with a
// detail view per customer and multi-select delete.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminT } from './i18n';
import { METHOD_ICON, formatEuro } from './PaymentBox';

const STATUS_COLOR = {
  pending_approval: '#f7b955', confirmed: '#7bd178', arrived: '#4fd1c5',
  completed: '#6aa6ff', no_show: '#9aa0a6', cancelled: '#ff8c66',
};

export default function HistoryPanel({ refreshKey, onDeleted }) {
  const { t, locale } = useAdminT();
  const [q, setQ] = useState('');
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState(null);   // { key, vars } translated at render
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async (term) => {
    const r = await fetch(`/api/staff/customers?q=${encodeURIComponent(term)}`);
    if (!r.ok) { setError({ key: 'hist.err.load' }); setCustomers([]); return; }
    setError(null);
    setCustomers((await r.json()).customers);
  }, []);

  // Debounced search; also reloads when the calendar changes (refreshKey).
  useEffect(() => {
    const id = setTimeout(() => load(q), q ? 250 : 0);
    return () => clearTimeout(id);
  }, [q, refreshKey, load]);

  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function remove(ids) {
    setBusy(true); setError(null); setNotice(null);
    const r = await fetch('/api/staff/customers', {
      method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false); setConfirming(false);
    if (!r.ok) {
      setError(j.error === 'has_upcoming'
        ? { key: 'hist.err.has_upcoming', vars: { names: (j.detail?.customers || []).map(c => c.name).join(', ') } }
        : { key: 'hist.err.failed' });
      return false;
    }
    setNotice({ key: 'hist.deletedMsg', vars: { n: j.deleted } });
    setSelected(new Set()); setSelecting(false);
    await load(q);
    onDeleted?.();
    return true;
  }

  const errorText = error ? t(error.key, error.vars) : '';
  const noticeText = notice ? t(notice.key, notice.vars) : '';
  const date = (iso) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <aside className="hist" aria-labelledby="hist-title">
      <div className="hist-head">
        <h2 id="hist-title" className="hist-title">{t('hist.title')}</h2>
        <button className="hist-link" onClick={() => { setSelecting(s => !s); setSelected(new Set()); setConfirming(false); }}>
          {selecting ? t('hist.done') : t('hist.select')}
        </button>
      </div>
      <label className="sr-only" htmlFor="hist-q">{t('hist.search')}</label>
      <input id="hist-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('hist.search')} className="hist-search" />

      {selecting && selected.size > 0 && (
        <div className="hist-bulk">
          {!confirming ? (
            <>
              <span>{t('hist.selected', { n: selected.size })}</span>
              <button className="hist-del" onClick={() => setConfirming(true)}>{t('hist.delete')}</button>
            </>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#ff8c66', lineHeight: 1.45 }}>{t('hist.deleteConfirm', { n: selected.size })}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="cal-act" disabled={busy} onClick={() => setConfirming(false)}>{t('common.cancel')}</button>
                <button className="cal-delete" disabled={busy} onClick={() => remove([...selected])}>{t('hist.deleteFinal')}</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div role="status" aria-live="polite" className="hist-msg" style={{ color: error ? '#ff8c66' : '#7bd178' }}>{errorText || noticeText}</div>

      {!customers && <p className="hist-empty">{t('common.loading')}</p>}
      {customers && customers.length === 0 && <p className="hist-empty">{t('hist.empty')}</p>}
      <ul className="hist-list">
        {(customers || []).map(c => {
          const lv = c.last_visit || {};
          const checked = selected.has(c.id);
          return (
            <li key={c.id}>
              <div className="hist-item" data-checked={checked}>
                {selecting && (
                  <input type="checkbox" checked={checked} onChange={() => toggle(c.id)}
                    aria-label={`${c.first_name} ${c.last_name}`} className="hist-check" />
                )}
                <button className="hist-open" onClick={() => selecting ? toggle(c.id) : setOpenId(c.id)}>
                  <span className="hist-row1">
                    <span className="hist-name">{c.first_name} {c.last_name}</span>
                    <span className="hist-sum">{c.total_paid_minor > 0 ? formatEuro(c.total_paid_minor, locale) : ''}</span>
                  </span>
                  <span className="hist-row2">
                    <span className="hist-dot" style={{ background: STATUS_COLOR[lv.status] || '#fff' }} />
                    {lv.starts_at ? date(lv.starts_at) : ''}{lv.staff ? `, ${lv.staff}` : ''}
                  </span>
                  <span className="hist-row2">
                    {c.visits === 1 ? t('hist.visits1') : t('hist.visitsN', { n: c.visits })}
                    {', '}
                    {lv.method
                      ? <span>{METHOD_ICON[lv.method]} {formatEuro(lv.amount_minor, locale)} {t(`pay.method.${lv.method}`)}</span>
                      : <span style={{ color: 'var(--fg-3)' }}>{t('hist.notRecorded')}</span>}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {openId && createPortal(
        <CustomerDetail id={openId} onClose={() => setOpenId(null)}
          onDelete={async () => { if (await remove([openId])) setOpenId(null); }} busy={busy} error={errorText} />,
        document.body,
      )}
      <style>{historyCss}</style>
    </aside>
  );
}

function CustomerDetail({ id, onClose, onDelete, busy, error }) {
  const { t, lang, locale } = useAdminT();
  const [data, setData] = useState(null);
  const [loadErr, setLoadErr] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/staff/customers/${id}`).then(async r => {
      if (!alive) return;
      if (!r.ok) { setLoadErr(true); return; }
      setData(await r.json());
    });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const c = data?.customer;
  const visits = data?.visits || [];
  const counted = visits.filter(v => v.status !== 'cancelled');
  const paid = visits.filter(v => v.payment);
  const total = paid.reduce((s, v) => s + v.payment.amount_minor, 0);
  const fmt = (iso, o) => new Date(iso).toLocaleString(locale, { timeZone: 'Europe/Berlin', ...o });

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal" style={{ maxWidth: 640 }} role="dialog" aria-modal="true" aria-labelledby="cust-title" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-bar" />
        <div style={{ padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 id="cust-title" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: 0 }}>
                {c ? `${c.first_name} ${c.last_name}` : t('hist.title')}
              </h2>
              {c && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{t('hist.since', { date: fmt(c.created_at, { day: '2-digit', month: '2-digit', year: 'numeric' }) })}</div>}
            </div>
            <button ref={closeRef} className="cal-x" onClick={onClose} aria-label={t('common.close')}>×</button>
          </div>

          {!data && !loadErr && <p style={{ color: 'var(--fg-2)' }}>{t('common.loading')}</p>}
          {loadErr && <p style={{ color: '#ff8c66' }}>{t('hist.err.load')}</p>}
          {c && (
            <>
              <div className="cust-stats">
                <Stat label={t('hist.statVisits')} value={counted.length} />
                <Stat label={t('hist.statPaid')} value={formatEuro(total, locale)} />
                <Stat label={t('hist.statAvg')} value={paid.length ? formatEuro(Math.round(total / paid.length), locale) : '-'} />
              </div>

              <div className="cal-section">
                <div className="cal-label">{t('hist.contact')}</div>
                <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                  {c.phone && <a className="cal-link" href={`tel:${c.phone}`}>{c.phone}</a>}
                  {c.email && <a className="cal-link" href={`mailto:${c.email}`}>{c.email}</a>}
                </div>
              </div>

              <div className="cal-section">
                <div className="cal-label">{t('hist.allVisits')} ({visits.length})</div>
                <ol className="cust-visits">
                  {visits.map(v => {
                    const staff = [...new Set(v.items.map(i => i.staff).filter(Boolean))].join(', ');
                    return (
                      <li key={v.id} className="cust-visit" data-dim={v.status === 'cancelled' || v.status === 'no_show'}>
                        <div className="cust-visit-top">
                          <span style={{ fontWeight: 600 }}>
                            {fmt(v.starts_at, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {', '}{fmt(v.starts_at, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLOR[v.status] }}>
                            {t(`status.${v.status}`)}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>
                          {v.items.map(i => (lang === 'en' && i.name_en) || i.name_de).join(', ')}
                          {staff ? `, ${t('hist.with', { name: staff })}` : ''}
                        </div>
                        <div className="cust-visit-pay">
                          {v.payment
                            ? <><span aria-hidden="true">{METHOD_ICON[v.payment.method]}</span> <strong>{formatEuro(v.payment.amount_minor, locale)}</strong>, {t(`pay.method.${v.payment.method}`)}
                                <span style={{ color: 'var(--fg-3)' }}>, {t('pay.by', { name: v.payment.recorded_by_name })}</span></>
                            : <span style={{ color: 'var(--fg-3)' }}>{t('hist.paymentMissing')}</span>}
                          {v.notes_count > 0 && <span style={{ color: 'var(--fg-3)' }}>, {t('hist.notes', { n: v.notes_count })}</span>}
                        </div>
                        {v.cancel_reason && <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{t('appt.cancelReason')}: {v.cancel_reason}</div>}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="cal-section">
                {!confirming ? (
                  <button className="cal-act danger" onClick={() => setConfirming(true)}>{t('hist.deleteOne')}</button>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#ff8c66' }}>{t('hist.deleteConfirm', { n: 1 })}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="cal-act" disabled={busy} onClick={() => setConfirming(false)}>{t('common.cancel')}</button>
                      <button className="cal-delete" disabled={busy} onClick={onDelete}>{t('hist.deleteFinal')}</button>
                    </div>
                  </div>
                )}
                <div role="alert" style={{ color: '#ff8c66', fontSize: 13, marginTop: 8 }}>{error}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="cust-stat">
      <div className="cust-stat-v">{value}</div>
      <div className="cust-stat-k">{label}</div>
    </div>
  );
}

const historyCss = `
  .cal-layout.with-hist { grid-template-columns: 170px minmax(0, 1fr) 300px; }
  @media (max-width: 1280px) {
    .cal-layout.with-hist { grid-template-columns: 170px minmax(0, 1fr); }
    .cal-layout.with-hist > .hist { grid-column: 1 / -1; position: static; max-height: 520px; }
  }
  @media (max-width: 760px) { .cal-layout.with-hist { grid-template-columns: 1fr; } }
  .hist { position: sticky; top: 16px; display: grid; gap: 10px; align-content: start; max-height: calc(100vh - 32px);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px; background: rgba(255,255,255,0.02); }
  .hist-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .hist-title { font-family: var(--font-display); font-size: 20px; font-weight: 400; margin: 0; }
  .hist-link { background: transparent; border: 0; color: var(--ghg-copper); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; min-height: 44px; padding: 0 4px; }
  .hist-search { width: 100%; min-height: 40px; padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: var(--ghg-paper); font-size: 13px; }
  .hist-search:focus { border-color: var(--ghg-copper); outline: none; }
  .hist-bulk { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border-radius: 10px; background: rgba(255,90,31,0.08); border: 1px solid rgba(255,90,31,0.35); font-size: 13px; }
  .hist-del { background: #d93a1a; color: #fff; border: 0; min-height: 36px; padding: 0 14px; border-radius: 7px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; }
  .hist-msg { font-size: 12px; min-height: 0; }
  .hist-msg:empty { display: none; }
  .hist-empty { font-size: 13px; color: var(--fg-3); margin: 4px 0; }
  .hist-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; overflow-y: auto; overscroll-behavior: contain; }
  .hist-item { display: flex; align-items: center; gap: 8px; border-radius: 10px; border: 1px solid transparent; transition: background 150ms var(--e-brand), border-color 150ms var(--e-brand); }
  .hist-item[data-checked="true"] { background: rgba(255,90,31,0.1); border-color: rgba(255,90,31,0.4); }
  @media (hover: hover) and (pointer: fine) { .hist-item:hover { background: rgba(255,255,255,0.05); } }
  .hist-check { width: 18px; height: 18px; margin-left: 8px; accent-color: var(--ghg-copper); flex-shrink: 0; }
  .hist-open { flex: 1; min-width: 0; display: grid; gap: 3px; text-align: left; background: transparent; border: 0; color: var(--ghg-paper); padding: 10px; cursor: pointer; border-radius: 10px; }
  .hist-open:focus-visible, .hist-link:focus-visible { outline: 2px solid var(--ghg-copper); outline-offset: 1px; }
  .hist-row1 { display: flex; justify-content: space-between; gap: 8px; }
  .hist-name { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hist-sum { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ghg-copper); white-space: nowrap; }
  .hist-row2 { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--fg-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hist-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .cust-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }
  .cust-stat { background: rgba(255,255,255,0.04); border-radius: 10px; padding: 12px; }
  .cust-stat-v { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .cust-stat-k { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-3); margin-top: 2px; }
  .cust-visits { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .cust-visit { display: grid; gap: 4px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); border-left: 3px solid rgba(255,90,31,0.6); }
  .cust-visit[data-dim="true"] { opacity: 0.6; border-left-color: rgba(255,255,255,0.2); }
  .cust-visit-top { display: flex; justify-content: space-between; gap: 8px; font-size: 14px; flex-wrap: wrap; }
  .cust-visit-pay { font-size: 13px; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
  @media (max-width: 520px) { .cust-stats { grid-template-columns: 1fr 1fr 1fr; gap: 6px; } .cust-stat-v { font-size: 16px; } }
`;
