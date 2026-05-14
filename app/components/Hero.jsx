'use client';
import PhotoTile from './PhotoTile';
import { useLang } from '../lib/i18n';

export default function Hero() {
  const { t } = useLang();
  return (
    <section id="top" style={{ position: 'relative', minHeight: '85vh', background: 'var(--ghg-ink)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <PhotoTile seed={2} aspect="auto" style={{ width: '100%', height: '100%' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, rgba(0,0,0,0.75) 100%)' }}/>
      </div>

      <div style={{
        position: 'absolute', left: 40, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12,
        zIndex: 2,
      }}>
        {['01','02','03'].map((n, i) => (
          <div key={n} style={{
            fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.18em',
            color: i === 0 ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.4)',
            paddingLeft: i === 0 ? 20 : 0,
            position: 'relative',
          }}>
            {i === 0 && <span style={{ position: 'absolute', left: 0, top: '50%', width: 14, height: 1, background: 'var(--ghg-copper)' }}/>}
            {n}
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', left: '50%', top: '52%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
        textAlign: 'center',
        color: 'var(--ghg-paper)',
        width: '100%', padding: '0 40px',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, letterSpacing: '0.22em',
          color: 'var(--ghg-copper)',
          marginBottom: 14,
        }}>{t('hero.eyebrow')}</div>
        <h1 className="display" style={{
          fontSize: 'clamp(48px, 8vw, 112px)',
          lineHeight: 0.95,
          margin: 0,
        }}>
          {t('hero.title1')}<br/>
          {t('hero.title2')}
        </h1>
        <div style={{
          marginTop: 28,
          fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.75)',
        }}>{t('hero.address')}</div>
        <div style={{ marginTop: 36, display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/booking" className="btn">{t('hero.bookBtn')}</a>
          <a href="#services" className="btn-ghost">{t('hero.pricesBtn')}</a>
        </div>
      </div>

      <div style={{ position: 'absolute', right: 40, bottom: 32, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ghg-paper)', zIndex: 2 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.22em' }}>{t('hero.scroll')}</span>
        <div style={{ width: 30, height: 1, background: 'var(--ghg-paper)' }}/>
      </div>

      <div className="copper-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}/>
    </section>
  );
}
