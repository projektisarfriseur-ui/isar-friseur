'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLang } from '../lib/i18n';

const PHOTOS = ['/hero/1.webp', '/hero/2.webp'];

// Scroll-linked crossfade between the two salon photos. Runs on framer-motion
// motion values, so scrolling never triggers a React re-render.
function HeroPhotos({ progress }) {
  const firstOpacity = useTransform(progress, [0.25, 0.65], [1, 0]);
  const secondOpacity = useTransform(progress, [0.25, 0.65], [0, 1]);
  const scale = useTransform(progress, [0, 1], [1.06, 1]);
  const opacities = [firstOpacity, secondOpacity];

  return (
    <motion.div style={{ position: 'absolute', inset: 0, scale }}>
      {PHOTOS.map((src, i) => (
        <motion.div
          key={src}
          style={{
            position: 'absolute', inset: 0,
            background: `url(${src}) center/cover no-repeat`,
            opacity: opacities[i],
          }}
        />
      ))}
    </motion.div>
  );
}

function Indicator({ progress, index }) {
  const range = [0.25, 0.65];
  const width = useTransform(progress, range, index === 0 ? [28, 14] : [14, 28]);
  const background = useTransform(
    progress, range,
    index === 0 ? ['#e0662f', 'rgba(255,255,255,0.38)'] : ['rgba(255,255,255,0.38)', '#e0662f'],
  );
  return <motion.span style={{ display: 'block', height: 1, width, background }}/>;
}

export default function Hero() {
  const { t } = useLang();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  return (
    <section
      id="top"
      ref={sectionRef}
      style={{ position: 'relative', height: '180vh', background: 'var(--ghg-ink)' }}
    >
      <div style={{
        position: 'sticky', top: 0,
        height: '100svh', minHeight: 560, width: '100%',
        overflow: 'hidden',
      }}>
        <HeroPhotos progress={scrollYProgress}/>

        {/* Directional fade: dark on the text side, the salon stays visible on the right */}
        <div className="hero-fade" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(15,13,12,0.94) 0%, rgba(15,13,12,0.82) 34%, rgba(15,13,12,0.35) 66%, rgba(15,13,12,0.15) 100%)',
        }}/>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(15,13,12,0.85), transparent)',
        }}/>

        <div className="container hero-inner" style={{
          position: 'relative', height: '100%',
          display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
          alignItems: 'center',
        }}>
          <div className="hero-content" style={{ color: 'var(--ghg-paper)', paddingTop: 40 }}>
            <div className="hero-enter" style={{ animationDelay: '0.05s',
              display: 'flex', alignItems: 'center', gap: 14,
              fontFamily: 'var(--font-body)', fontWeight: 600,
              fontSize: 11, letterSpacing: '0.34em',
              color: 'var(--ghg-copper)',
              marginBottom: 26,
              textTransform: 'uppercase',
            }}>
              <span aria-hidden="true" style={{ width: 36, height: 1, background: 'var(--ghg-copper)' }}/>
              {t('hero.eyebrow')}
            </div>
            <h1 className="display hero-enter" style={{ animationDelay: '0.15s',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 7vw, 108px)',
              lineHeight: 0.98,
              margin: 0,
              fontWeight: 300,
              letterSpacing: '-0.018em',
              color: '#ffffff',
            }}>
              {t('hero.title1')}<br/>
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.86)' }}>{t('hero.title2')}</em>
            </h1>
            <div className="hero-address hero-enter" style={{ animationDelay: '0.3s',
              marginTop: 30,
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.62)',
              textTransform: 'uppercase',
            }}>{t('hero.address')}</div>
            <div className="hero-ctas hero-enter" style={{ animationDelay: '0.42s', marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/booking" className="btn">{t('hero.bookBtn')}</a>
              <a href="/services" className="btn-ghost">{t('hero.pricesBtn')}</a>
            </div>
          </div>

          <div className="hero-counter" aria-hidden="true" style={{
            justifySelf: 'end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14,
          }}>
            {PHOTOS.map((_, i) => <Indicator key={i} index={i} progress={scrollYProgress}/>)}
          </div>
        </div>

        <div className="hero-scroll" style={{ position: 'absolute', right: 40, bottom: 32, display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.78)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.34em', textTransform: 'uppercase' }}>{t('hero.scroll')}</span>
          <span className="hero-scroll-line" style={{ position: 'relative', width: 32, height: 1, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}/>
        </div>

        <div className="copper-divider" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}/>
      </div>
      <style>{`
        .hero-enter { animation: hero-enter 900ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes hero-enter {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: none; }
        }
        .hero-scroll-line::after {
          content: ''; position: absolute; inset: 0;
          background: rgba(255,255,255,0.9);
          transform: translateX(-100%);
          animation: hero-scroll-line 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @keyframes hero-scroll-line {
          0% { transform: translateX(-100%); }
          55% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-enter { animation: hero-enter 900ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes hero-enter {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: none; }
        }
        .hero-scroll-line::after { animation: none; transform: none; }
        }
        @media (max-width: 760px) {
          .hero-inner { grid-template-columns: 1fr !important; align-items: end !important; padding-bottom: 168px !important; }
          .hero-counter { display: none !important; }
          .hero-content > div:first-child > span { display: none; }
          .hero-fade { background: linear-gradient(to top, rgba(15,13,12,0.95) 0%, rgba(15,13,12,0.7) 45%, rgba(15,13,12,0.3) 100%) !important; }
          .hero-content h1 { font-size: clamp(44px, 13vw, 64px) !important; }
          .hero-address { letter-spacing: 0.18em !important; font-size: 11px !important; }
          .hero-ctas { display: grid !important; grid-template-columns: 1fr; width: 100%; max-width: 360px; }
          .hero-ctas a { text-align: center; }
          .hero-scroll { right: 20px !important; bottom: 24px !important; gap: 6px !important; }
          .hero-scroll span:first-child { font-size: 10px !important; letter-spacing: 0.28em !important; }
          .hero-scroll-line { width: 18px !important; }
        }
      `}</style>
    </section>
  );
}
