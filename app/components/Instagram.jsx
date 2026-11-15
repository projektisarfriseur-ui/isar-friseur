'use client';
import Eyebrow from './Eyebrow';
import HorizontalImageStack from './HorizontalImageStack';
import { useLang } from '../lib/i18n';

const IG_URL = 'https://www.instagram.com/isar_friseur';

const IMAGES = [
  { id: 2, src: '/instagram/ig-2.webp', alt: 'Isar Friseur post 2', fallback: 'linear-gradient(135deg, #2b2b2b 0%, #ff5a1f 100%)' },
  { id: 3, src: '/instagram/ig-3.webp', alt: 'Isar Friseur post 3', fallback: 'linear-gradient(135deg, #020202 0%, #3c4043 100%)' },
  { id: 4, src: '/instagram/ig-4.webp', alt: 'Isar Friseur post 4', fallback: 'linear-gradient(135deg, #1a1410 0%, #69727d 100%)' },
  { id: 5, src: '/instagram/ig-5.webp', alt: 'Isar Friseur post 5', fallback: 'linear-gradient(135deg, #ff5a1f 0%, #2b2b2b 100%)' },
  { id: 7, src: '/instagram/ig-7.webp', alt: 'Isar Friseur post 7', fallback: '#0a0a0a', fit: 'contain' },
];

export default function Instagram() {
  const { t } = useLang();
  return (
    <section id="instagram" style={{ background: 'var(--ghg-ink)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="06" label={t('ig.eyebrow')}/>
        <h2 className="section-heading">{t('ig.heading')}</h2>
        <div className="copper-rule"/>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 24, marginBottom: 36,
        }}>
          <p style={{ maxWidth: 640, fontSize: 18, color: 'var(--fg-2)', fontWeight: 300, margin: 0 }}>
            {t('ig.intro')}
          </p>
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400, fontStyle: 'italic',
              fontSize: 30, letterSpacing: '0.01em',
              color: 'var(--ghg-copper)', textDecoration: 'none',
            }}
          >
            {t('ig.handle')}
          </a>
        </div>

        <HorizontalImageStack
          images={IMAGES}
          href={IG_URL}
          cardWidth={360}
          cardHeight={360}
          height={460}
        />

        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor"/>
            </svg>
            {t('ig.cta')}
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          #instagram .stack-hint { display: none !important; }
        }
      `}</style>
    </section>
  );
}
