'use client';
import { useLang } from '../lib/i18n';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer style={{ background: 'var(--ghg-ink)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="copper-divider"/>
      <div className="container" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }} className="foot-grid">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.1em' }}>ISAR FRISEUR</div>
            <p style={{ marginTop: 14, fontSize: 14, color: 'var(--fg-2)', maxWidth: 320 }}>
              {t('foot.tagline')}
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--ghg-copper)', marginBottom: 14 }}>{t('foot.salon')}</div>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.7 }}>
              Fraunhofer Str. 14<br/>
              80469 München
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--ghg-copper)', marginBottom: 14 }}>{t('foot.hours')}</div>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {t('foot.hoursLines')}
            </p>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--ghg-copper)', marginBottom: 14 }}>{t('foot.contact')}</div>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.9 }}>
              <a href="tel:+498980039037">089 800 39 037</a><br/>
              <a href="mailto:burhan380@gmail.com">burhan380@gmail.com</a>
            </p>
          </div>
        </div>
        <div style={{
          marginTop: 50, paddingTop: 22,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
          fontSize: 12, letterSpacing: '0.12em', color: 'var(--fg-3)',
          fontFamily: 'var(--font-display)',
        }}>
          <span>© {new Date().getFullYear()} ISAR FRISEUR · MÜNCHEN</span>
          <span><a href="#">{t('foot.imprint')}</a> · <a href="#">{t('foot.privacy')}</a></span>
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
