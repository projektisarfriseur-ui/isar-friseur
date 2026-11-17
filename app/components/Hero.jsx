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
        height: '100svh', width: '100%',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {PHOTOS.map((src, i) => {
            const dist = Math.abs(progress - i);
            const opacity = Math.max(0, 1 - dist * 2.4);
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
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none',
          }}/>
        </div>

        <div className="hero-counter" aria-hidden="true" style={{
          position: 'absolute', left: 40, top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 14,
          zIndex: 2,
        }}>
          {PHOTOS.map((_, i) => {
            const active = i === activeIdx;
            return (
              <span key={i} style={{
                display: 'block', width: active ? 28 : 14, height: 1,
                background: active ? 'var(--ghg-copper)' : 'rgba(255,255,255,0.38)',
                transition: 'width 320ms var(--e-out), background 320ms ease',
              }}/>
            );
          })}
        </div>

        <div className="hero-content" style={{
          position: 'absolute', left: '50%', top: '52%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          textAlign: 'center',
          color: 'var(--ghg-paper)',
          width: '100%', padding: '0 40px',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 600,
            fontSize: 11, letterSpacing: '0.34em',
            color: 'var(--ghg-copper)',
            marginBottom: 22,
            textTransform: 'uppercase',
          }}>{t('hero.eyebrow')}</div>
          <h1 className="display" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(52px, 8.6vw, 128px)',
            lineHeight: 1.04,
            margin: 0,
            fontWeight: 300,
            letterSpacing: '-0.012em',
            color: '#ffffff',
            fontKerning: 'normal',
          }}>
            {t('hero.title1')}<br/>
            <em style={{ fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.005em' }}>{t('hero.title2')}</em>
          </h1>
          <div className="hero-address" style={{
            marginTop: 32,
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.36em',
            color: 'rgba(255,255,255,0.66)',
            textTransform: 'uppercase',
          }}>{t('hero.address')}</div>
          <div className="hero-ctas" style={{ marginTop: 40, display: 'inline-flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/booking" className="btn">{t('hero.bookBtn')}</a>
            <a href="/services" className="btn-ghost">{t('hero.pricesBtn')}</a>
          </div>
        </div>

        <div className="hero-scroll" style={{ position: 'absolute', right: 40, bottom: 32, display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.78)', zIndex: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.34em', textTransform: 'uppercase' }}>{t('hero.scroll')}</span>
          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.78)' }}/>
        </div>

        <div className="copper-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}/>
      </div>
      <style>{`
        @media (max-width: 700px) {
          .hero-counter { display: none !important; }
          .hero-content { padding: 0 20px !important; }
          .hero-content h1 { font-size: clamp(44px, 13vw, 64px) !important; }
          .hero-address { letter-spacing: 0.18em !important; font-size: 11px !important; }
          .hero-ctas { display: grid !important; grid-template-columns: 1fr; width: 100%; max-width: 340px; }
          .hero-ctas a { text-align: center; }
          .hero-scroll { right: 20px !important; bottom: 20px !important; gap: 6px !important; }
          .hero-scroll span { font-size: 10px !important; letter-spacing: 0.28em !important; }
          .hero-scroll > div { width: 18px !important; }
        }
      `}</style>
    </section>
  );
}
