'use client';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';

const PHOTOS = ['/hero/1.webp', '/hero/2.webp'];

export default function Hero() {
  const { t } = useLang();
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..2

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? (scrolled / total) * (PHOTOS.length - 1) : 0;
      setProgress(p);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const activeIdx = Math.round(progress);

  return (
    <section
      id="top"
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '180vh',
        background: 'var(--ghg-ink)',
      }}
    >
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh', width: '100%',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {PHOTOS.map((src, i) => {
            const dist = Math.abs(progress - i);
            const opacity = Math.max(0, Math.min(1, 1.6 - dist * 4));
            return (
              <div key={src} style={{
                position: 'absolute', inset: 0,
                background: `url(${src}) center/cover no-repeat`,
                opacity,
                transition: 'opacity 220ms linear',
                willChange: 'opacity',
              }}/>
            );
          })}
        </div>

        <div style={{
          position: 'absolute', left: 40, top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 12,
          zIndex: 2,
        }}>
          {PHOTOS.map((_, i) => {
            const active = i === activeIdx;
            return (
              <div key={i} style={{
                fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.18em',
                color: active ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.4)',
                paddingLeft: active ? 20 : 0,
                position: 'relative',
                transition: 'color 300ms ease, padding 300ms ease',
              }}>
                {active && <span style={{ position: 'absolute', left: 0, top: '50%', width: 14, height: 1, background: 'var(--ghg-copper)' }}/>}
                {String(i + 1).padStart(2, '0')}
              </div>
            );
          })}
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
            <a href="/services" className="btn-ghost">{t('hero.pricesBtn')}</a>
          </div>
        </div>

        <div style={{ position: 'absolute', right: 40, bottom: 32, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ghg-paper)', zIndex: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.22em' }}>{t('hero.scroll')}</span>
          <div style={{ width: 30, height: 1, background: 'var(--ghg-paper)' }}/>
        </div>

        <div className="copper-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}/>
      </div>
    </section>
  );
}
