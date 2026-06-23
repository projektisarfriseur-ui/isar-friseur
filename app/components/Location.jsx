'use client';
import { useState } from 'react';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';

export default function Location() {
  const { t } = useLang();
  const [mapActive, setMapActive] = useState(false);
  return (
    <section id="location" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <div className="loc-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr',
          gap: 80,
          alignItems: 'start',
        }}>
          <div className="loc-left">
            <Eyebrow num="02" label={t('loc.eyebrow')}/>
            <h2 className="section-heading">{t('loc.heading')}</h2>
            <div className="copper-rule"/>

            <div style={{ marginTop: 40 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, letterSpacing: '0.22em',
                color: 'var(--ghg-copper)', marginBottom: 14, textTransform: 'uppercase',
              }}>{t('loc.salon')}</div>

              <div style={{ fontSize: 19, lineHeight: 1.6, whiteSpace: 'pre-line', color: 'var(--fg)', fontWeight: 300 }}>
                {t('loc.address')}
              </div>
            </div>

            <div style={{ marginTop: 36, borderTop: '1px solid var(--border)', paddingTop: 28 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.26em', color: 'var(--fg-2)', marginBottom: 16 }}>{t('loc.hours')}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <tbody>
                  <tr><td style={{ padding: '9px 0', color: 'var(--fg-2)' }}>{t('loc.mf')}</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>09:00 - 19:00</td></tr>
                  <tr><td style={{ padding: '9px 0', color: 'var(--fg-2)' }}>{t('loc.sa')}</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>09:00 - 17:00</td></tr>
                  <tr><td style={{ padding: '9px 0', color: 'var(--fg-2)' }}>{t('loc.su')}</td><td style={{ textAlign: 'right', color: 'var(--fg-3)' }}>{t('loc.closed')}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 36, borderTop: '1px solid var(--border)', paddingTop: 28 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.26em', color: 'var(--fg-2)', marginBottom: 14 }}>{t('loc.contact')}</div>
              <a href="tel:+498980039037" style={{ display: 'block', fontSize: 22, fontWeight: 400, marginBottom: 8, letterSpacing: '0.02em' }}>089 800 39 037</a>
              <a href="mailto:burhan380@gmail.com" style={{ display: 'block', fontSize: 15, color: 'var(--fg-2)' }}>burhan380@gmail.com</a>
            </div>
          </div>

          <div
            className="loc-map"
            onClick={() => setMapActive(true)}
            onMouseLeave={() => setMapActive(false)}
            style={{ position: 'relative', minHeight: 560, background: 'var(--ghg-ink)', cursor: mapActive ? 'grab' : 'pointer', alignSelf: 'stretch' }}
          >
            <iframe
              src="https://www.google.com/maps?q=Fraunhofer+Stra%C3%9Fe+14,+80469+M%C3%BCnchen&z=15&output=embed"
              title="Isar Friseur, Fraunhofer Straße 14"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: mapActive ? 'auto' : 'none' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {!mapActive && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: 16, pointerEvents: 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, letterSpacing: '0.24em',
                  color: 'var(--ghg-paper)', background: 'rgba(0,0,0,0.6)', padding: '8px 14px',
                  textTransform: 'uppercase',
                }}>
                  Click to interact
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .loc-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .loc-map { min-height: 360px !important; }
        }
      `}</style>
    </section>
  );
}
