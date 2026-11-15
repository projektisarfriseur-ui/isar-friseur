'use client';
import { useCallback, useEffect, useState } from 'react';
import AdminShell from '../AdminShell';
import { useMe } from '../useMe';
import { useAdminT } from '../i18n';

const ACCESS_COLOR = { active: '#7bd178', revoked: '#ff8c66', none: '#9aa0a6' };
const KNOWN_ERRORS = ['invalid_input', 'staff_has_other_account', 'account_linked_elsewhere', 'auth_provider_error', 'cannot_revoke_self', 'forbidden'];

export default function TeamPage() {
  const me = useMe();
  const { t, locale } = useAdminT();
  const [team, setTeam] = useState(null);
  const [emails, setEmails] = useState({});
  const [links, setLinks] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/staff/team');
    if (r.ok) setTeam((await r.json()).team);
    else setTeam([]);
  }, []);
  useEffect(() => { if (me?.user?.isOwner) load(); }, [me, load]);

  async function act(staffId, action) {
    if (action === 'revoke' && !confirm(t('team.revokeConfirm'))) return;
    setBusy(staffId); setErrors(e => ({ ...e, [staffId]: '' }));
    const r = await fetch(`/api/staff/team/${staffId}/access`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, email: emails[staffId] }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (!r.ok) { setErrors(e => ({ ...e, [staffId]: t(KNOWN_ERRORS.includes(j.error) ? `team.err.${j.error}` : 'team.err.failed') })); return; }
    setLinks(l => ({ ...l, [staffId]: j.link || null }));
    load();
  }

  if (!me) return <AdminShell me={null}><p style={{ color: 'var(--fg-2)' }}>{t('common.loading')}</p></AdminShell>;
  if (!me.user.isOwner) return <AdminShell me={me}><p>{t('team.ownerOnly')}</p></AdminShell>;

  return (
    <AdminShell me={me}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, margin: 0 }}>{t('team.title')}</h1>
      <p style={{ color: 'var(--fg-2)', fontSize: 14, maxWidth: 680, lineHeight: 1.6, marginTop: 8 }}>
        {t('team.intro')}
      </p>
      <div className="copper-rule" />

      {!team && <p style={{ color: 'var(--fg-2)' }}>{t('common.loading')}</p>}
      <div style={{ display: 'grid', gap: 14 }}>
        {(team || []).map(s => {
          const acc = { color: ACCESS_COLOR[s.access], label: t(`team.access.${s.access}`) };
          return (
            <section key={s.id} aria-labelledby={`staff-${s.id}`} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 18, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
                  {s.photo_url && <img src={s.photo_url} alt="" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <h2 id={`staff-${s.id}`} style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: 0 }}>{s.name}</h2>
                  <div style={{ fontSize: 12, color: acc.color, marginTop: 4 }}>
                    ● {acc.label}{s.email ? ` · ${s.email}` : ''}
                    {s.lastSignInAt && <span style={{ color: 'var(--fg-3)' }}> · {t('team.lastSignIn', { date: new Date(s.lastSignInAt).toLocaleDateString(locale) })}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {s.access !== 'active' && (
                  <>
                    <label className="sr-only" htmlFor={`email-${s.id}`}>{t('team.emailFor', { name: s.name })}</label>
                    <input id={`email-${s.id}`} type="email" placeholder={t('team.emailPlaceholder')}
                      defaultValue={s.email || ''}
                      onChange={e => setEmails(m => ({ ...m, [s.id]: e.target.value }))}
                      style={{ flex: '1 1 240px', minHeight: 44 }} />
                    <button className="btn" disabled={busy === s.id} onClick={() => act(s.id, 'invite')}>
                      {s.access === 'none' ? t('team.invite') : t('team.restore')}
                    </button>
                  </>
                )}
                {s.access === 'active' && (
                  <>
                    <button className="btn-ghost" disabled={busy === s.id} onClick={() => act(s.id, 'reset')}>{t('team.reset')}</button>
                    <button className="btn-ghost" disabled={busy === s.id} onClick={() => act(s.id, 'revoke')} style={{ color: '#ff8c66', borderColor: 'rgba(255,140,102,0.5)' }}>{t('team.revoke')}</button>
                  </>
                )}
              </div>

              {links[s.id] && <LinkBox link={links[s.id]} name={s.name} />}
              <div role="alert" style={{ color: '#ff8c66', fontSize: 13 }}>{errors[s.id]}</div>
            </section>
          );
        })}
      </div>
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>
    </AdminShell>
  );
}

function LinkBox({ link, name }) {
  const [copied, setCopied] = useState(false);
  const { t } = useAdminT();
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }
  return (
    <div style={{ background: 'rgba(255,90,31,0.08)', border: '1px solid rgba(255,90,31,0.4)', borderRadius: 10, padding: 14, display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 13 }}>{t('team.linkFor', { name })}</div>
      <code style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--fg-2)' }}>{link}</code>
      <div><button className="btn" onClick={copy}>{copied ? t('team.copied') : t('team.copy')}</button></div>
    </div>
  );
}
