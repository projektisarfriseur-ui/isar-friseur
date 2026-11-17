'use client';
// Stylist records how the customer paid once they have left the chair.
import { useEffect, useState } from 'react';
import { useAdminT } from './i18n';

export const METHODS = ['cash', 'card', 'voucher', 'other'];
export const METHOD_ICON = { cash: '💶', card: '💳', voucher: '🎁', other: '•' };

export const formatEuro = (minor, locale) =>
  `${(minor / 100).toLocaleString(locale, { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`;

// "38,50" / "38.50" / "38" -> 3850 cents; null when not a valid amount.
function parseEuro(text) {
  const clean = String(text).trim().replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export default function PaymentBox({ appt, onSaved }) {
  const { t, locale } = useAdminT();
  const [payment, setPayment] = useState(undefined);   // undefined = loading, null = none yet
  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = appt.status === 'arrived' || appt.status === 'completed';

  useEffect(() => {
    let alive = true;
    fetch(`/api/staff/appointments/${appt.id}/payment`).then(r => r.ok ? r.json() : { payment: null })
      .then(j => { if (alive) setPayment(j.payment); });
    return () => { alive = false; };
  }, [appt.id]);

  function startEdit() {
    setMethod(payment?.method || '');
    const base = payment?.amount_minor ?? appt.total_price_minor;
    setAmount(base == null ? '' : String(base / 100).replace('.', locale === 'de-DE' ? ',' : '.'));
    setError('');
    setEditing(true);
  }

  async function save(e) {
    e.preventDefault();
    const cents = parseEuro(amount);
    if (!method || cents == null) { setError(t('pay.err.invalid_input')); return; }
    setBusy(true); setError('');
    const r = await fetch(`/api/staff/appointments/${appt.id}/payment`, {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method, amount_minor: cents }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setError(t(['invalid_input', 'not_ready_for_payment'].includes(j.error) ? `pay.err.${j.error}` : 'pay.err.failed'));
      return;
    }
    setPayment(j.payment);
    setEditing(false);
    onSaved?.();
  }

  if (appt.status === 'cancelled' || appt.status === 'no_show') return null;

  return (
    <div className="cal-section">
      <div className="cal-label">{t('pay.title')}</div>
      {payment === undefined && <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0 }}>{t('common.loading')}</p>}

      {payment && !editing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              <span aria-hidden="true">{METHOD_ICON[payment.method]} </span>
              {formatEuro(payment.amount_minor, locale)}, {t(`pay.method.${payment.method}`)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{t('pay.by', { name: payment.recorded_by_name })}</div>
          </div>
          <button className="cal-act" onClick={startEdit}>{t('pay.update')}</button>
        </div>
      )}

      {payment === null && !editing && (ready
        ? <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: 0 }}>{t('pay.hint')}</p>
            <div><button className="cal-save" data-dirty="true" onClick={startEdit}>{t('pay.save')}</button></div>
          </div>
        : <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0 }}>{t('pay.notYet')}</p>)}

      {editing && (
        <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          <div role="radiogroup" aria-label={t('pay.method')} className="pay-methods">
            {METHODS.map(m => (
              <button key={m} type="button" role="radio" aria-checked={method === m} className="pay-method"
                data-active={method === m} onClick={() => setMethod(m)}>
                <span aria-hidden="true" style={{ fontSize: 18 }}>{METHOD_ICON[m]}</span>{t(`pay.method.${m}`)}
              </button>
            ))}
          </div>
          <label htmlFor="pay-amount" className="cal-label" style={{ margin: 0 }}>{t('pay.amount')}</label>
          <input id="pay-amount" inputMode="decimal" autoComplete="off" value={amount} onChange={e => setAmount(e.target.value)}
            className="cal-textarea" style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }} placeholder="0,00" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="cal-act" onClick={() => setEditing(false)}>{t('common.cancel')}</button>
            <button className="cal-save" data-dirty={Boolean(method && amount)} disabled={busy}>{t('pay.save')}</button>
          </div>
        </form>
      )}
      <div role="alert" style={{ color: '#ff8c66', fontSize: 13, marginTop: error ? 8 : 0 }}>{error}</div>
      <style>{`
        .pay-methods { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .pay-method { display: grid; justify-items: center; gap: 4px; min-height: 64px; padding: 8px 4px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.2); background: transparent; color: var(--ghg-paper); font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 150ms var(--e-brand), border-color 150ms var(--e-brand); }
        .pay-method[data-active="true"] { background: rgba(255,90,31,0.16); border-color: var(--ghg-copper); }
        .pay-method:focus-visible { outline: 2px solid var(--ghg-copper); outline-offset: 2px; }
        @media (max-width: 420px) { .pay-methods { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
