'use client';
import { useLang } from '../lib/i18n';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer style={{ background: 'var(--ghg-ink)', borderTop: '1px solid var(--border)' }}>
      <div className="copper-divider"/>
      <div className="container" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }} className="foot-grid">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 34, letterSpacing: '0.005em' }}>Isar Friseur</div>
            <p style={{ marginTop: 14, fontSize: 14, color: 'var(--fg-2)', maxWidth: 320, fontWeight: 300 }}>
              {t('foot.tagline')}
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.22em', color: 'var(--ghg-copper)', marginBottom: 14 }}>{t('foot.salon')}</div>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.7, fontWeight: 300 }}>
              Fraunhofer Str. 14<br/>
              80469 München
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.22em', color: 'var(--ghg-copper)', marginBottom: 14 }}>{t('foot.hours')}</div>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.7, whiteSpace: 'pre-line', fontWeight: 300 }}>
              {t('foot.hoursLines')}
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.22em', color: 'var(--ghg-copper)', marginBottom: 14 }}>{t('foot.contact')}</div>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.9, fontWeight: 300 }}>
              <a href="tel:+498980039037">089 800 39 037</a><br/>
              <a href="mailto:burhan380@gmail.com">burhan380@gmail.com</a>
            </p>
          </div>
        </div>
        <div style={{
          marginTop: 50, paddingTop: 22,
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
          fontSize: 12, letterSpacing: '0.22em', color: 'var(--fg-3)',
          fontFamily: 'var(--font-body)', fontWeight: 400, textTransform: 'uppercase',
        }}>
          <span>© {new Date().getFullYear()} ISAR FRISEUR · MÜNCHEN</span>
          <span><a href="/imprint">{t('foot.imprint')}</a> · <a href="/privacy">{t('foot.privacy')}</a></span>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .foot-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .foot-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
