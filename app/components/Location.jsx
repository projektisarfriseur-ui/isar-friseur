'use client';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';

export default function Location() {
  const { t } = useLang();
  return (
    <section id="location" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="02" label={t('loc.eyebrow')}/>
        <h2 className="section-heading">{t('loc.heading')}</h2>
        <div className="copper-rule"/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 60, marginTop: 60 }} className="loc-grid">
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.16em',
              color: 'var(--ghg-copper)', marginBottom: 18,
            }}>{t('loc.salon')}</div>

            <div style={{ fontSize: 20, lineHeight: 1.5, marginBottom: 28, whiteSpace: 'pre-line' }}>
              {t('loc.address')}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22, marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--fg-2)', marginBottom: 10 }}>{t('loc.hours')}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <tbody>
                  <tr><td style={{ padding: '6px 0', color: 'var(--fg-2)' }}>{t('loc.mf')}</td><td style={{ textAlign: 'right' }}>09:00 – 19:00</td></tr>
                  <tr><td style={{ padding: '6px 0', color: 'var(--fg-2)' }}>{t('loc.sa')}</td><td style={{ textAlign: 'right' }}>09:00 – 17:00</td></tr>
                  <tr><td style={{ padding: '6px 0', color: 'var(--fg-2)' }}>{t('loc.su')}</td><td style={{ textAlign: 'right', color: 'var(--fg-3)' }}>{t('loc.closed')}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.2em', color: 'var(--fg-2)', marginBottom: 10 }}>{t('loc.contact')}</div>
              <a href="tel:+498980039037" style={{ display: 'block', fontSize: 20, fontWeight: 600, marginBottom: 6 }}>089 800 39 037</a>
              <a href="mailto:burhan380@gmail.com" style={{ display: 'block', fontSize: 15, color: 'var(--fg-2)' }}>burhan380@gmail.com</a>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: 420, background: 'var(--ghg-ink)' }}>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=11.5680%2C48.1283%2C11.5770%2C48.1320&layer=mapnik&marker=48.1302%2C11.5728"
              title="Isar Friseur, Fraunhofer Straße 14"
              style={{ width: '100%', height: '100%', border: 0, filter: 'grayscale(1) invert(1) contrast(0.9)' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .loc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
