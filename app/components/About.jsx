'use client';
import Eyebrow from './Eyebrow';
import PhotoTile from './PhotoTile';
import { useLang } from '../lib/i18n';

export default function About() {
  const { t } = useLang();
  return (
    <section id="about" style={{ background: 'var(--ghg-ink)', padding: '120px 0' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <PhotoTile seed={1} aspect="4/5"/>
        <div>
          <Eyebrow num="01" label={t('about.eyebrow')}/>
          <h2 className="section-heading">{t('about.heading1')}<br/>{t('about.heading2')}</h2>
          <div className="copper-rule"/>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>
            {t('about.body1')}
          </p>
          <p style={{ marginTop: 18, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>
            {t('about.body2')}
          </p>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #about .container { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
