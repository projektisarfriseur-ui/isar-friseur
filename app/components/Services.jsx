'use client';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';

const GROUPS = [
  { titleKey: 'svc.women', rows: [
    { k: 'svc.r.wash',    p: 48 },
    { k: 'svc.r.dry',     p: 38 },
    { k: 'svc.r.bang',    p: 10, fixed: true },
    { k: 'svc.r.updo',    p: 65 },
  ]},
  { titleKey: 'svc.men', rows: [
    { k: 'svc.r.wash',    p: 32 },
    { k: 'svc.r.dry',     p: 26 },
    { k: 'svc.r.beard',   p: 12, fixed: true },
    { k: 'svc.r.machine', p: 20, fixed: true },
  ]},
  { titleKey: 'svc.color', rows: [
    { k: 'svc.r.root',  p: 55 },
    { k: 'svc.r.full',  p: 75 },
    { k: 'svc.r.balay', p: 140 },
    { k: 'svc.r.foil',  p: 90 },
    { k: 'svc.r.tone',  p: 45 },
  ]},
  { titleKey: 'svc.care', rows: [
    { k: 'svc.r.olaplex', p: 25 },
    { k: 'svc.r.keratin', p: 35 },
    { k: 'svc.r.scalp',   p: 15, fixed: true },
  ]},
];

export default function Services() {
  const { t } = useLang();
  return (
    <section id="services" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="03" label={t('svc.eyebrow')}/>
        <h2 className="section-heading">{t('svc.heading')}</h2>
        <div className="copper-rule"/>
        <p style={{ maxWidth: 640, fontSize: 18, color: 'var(--fg-2)', marginBottom: 60, fontWeight: 300 }}>
          {t('svc.intro')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 60 }} className="svc-grid stagger">
          {GROUPS.map((g, gi) => (
            <div key={g.titleKey} style={{ '--i': gi }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, fontSize: 30, letterSpacing: '0.02em',
                color: 'var(--ghg-copper)', marginBottom: 8,
              }}>{t(g.titleKey)}</div>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 4 }}/>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {g.rows.map(r => (
                    <tr key={r.k} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 0', fontSize: 16, fontWeight: 300 }}>{t(r.k)}</td>
                      <td style={{ padding: '14px 0', textAlign: 'right', fontSize: 16, color: 'var(--fg-2)', whiteSpace: 'nowrap', fontWeight: 300 }}>
                        {r.fixed ? `${r.p} €` : `${t('svc.from')} ${r.p} €`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .svc-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
