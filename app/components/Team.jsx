'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';
import { PEOPLE } from '../lib/people';

export default function Team() {
  const { t, lang } = useLang();
  const [active, setActive] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (active === null) return;
    function onKey(e) { if (e.key === 'Escape') setActive(null); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  const person = active !== null ? PEOPLE[active] : null;

  return (
    <section id="team" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="04" label={t('team.eyebrow')}/>
        <h2 className="section-heading">{t('team.heading')}</h2>
        <div className="copper-rule"/>
        <p style={{ maxWidth: 640, fontSize: 18, color: 'var(--fg-2)', marginBottom: 60, fontWeight: 300 }}>
          {t('team.intro')}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }} className="team-grid">
          {PEOPLE.map((p, i) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setActive(i)}
              className="team-card"
              style={{
                width: 280, textAlign: 'center',
                background: 'transparent', border: 0, padding: 0,
                color: 'inherit', cursor: 'pointer',
              }}
              aria-label={`${t('team.profileOf')} ${p.name}`}
            >
              <div className="team-photo" style={{
                width: 260, height: 260,
                margin: '0 auto',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#1a1410',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ghg-copper)',
                fontFamily: 'var(--font-display)',
                fontSize: 84, letterSpacing: '0.02em',
                transition: 'transform 220ms ease',
              }}>
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    width={260} height={260}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', imageRendering: '-webkit-optimize-contrast' }}
                  />
                ) : p.name[0]}
              </div>
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 30, letterSpacing: '0.01em' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ghg-copper)', marginTop: 6 }}>{p.role[lang] || p.role.en}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {mounted && person && createPortal(
        <div
          onClick={() => setActive(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(20,20,20,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, backdropFilter: 'blur(6px)',
          }}
          role="dialog" aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="team-modal"
            style={{
              background: 'var(--ghg-graphite)',
              border: '1px solid var(--border)',
              maxWidth: 1080, width: '100%', maxHeight: '92vh', overflow: 'auto',
              display: 'grid', gridTemplateColumns: '420px 1fr',
              gap: 56, padding: 56,
              position: 'relative',
              boxShadow: '0 30px 80px rgba(0,0,0,0.18)',
            }}
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label={t('team.close')}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 0, color: 'var(--fg-2)',
                fontSize: 34, cursor: 'pointer', lineHeight: 1, padding: 10,
              }}
            >
              ×
            </button>

            <div style={{
              width: 420, height: 420,
              borderRadius: '50%', overflow: 'hidden',
              background: '#1a1410',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ghg-copper)',
              fontFamily: 'var(--font-display)',
              fontSize: 160, letterSpacing: '0.02em',
              alignSelf: 'start',
            }}>
              {person.photo ? (
                <img
                  src={person.photo}
                  alt={person.name}
                  width={420} height={420}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : person.name[0]}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, letterSpacing: '0.26em',
                color: 'var(--ghg-copper)', textTransform: 'uppercase',
              }}>
                {person.role[lang] || person.role.en}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 68, margin: '14px 0 20px',
                letterSpacing: '0.005em', lineHeight: 1,
              }}>
                {person.name}
              </h3>
              <div style={{ width: 64, height: 2, background: 'var(--ghg-copper)', marginBottom: 28 }}/>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: 'var(--fg)', margin: 0, fontWeight: 300 }}>
                {person.bio[lang] || person.bio.en}
              </p>
              <Link
                href={`/team/${person.slug}`}
                onClick={() => setActive(null)}
                className="gallery-btn"
                style={{
                  marginTop: 36, alignSelf: 'flex-start',
                  fontFamily: 'var(--font-body)', fontWeight: 500,
                  fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase',
                  color: '#ffffff',
                  background: 'var(--ghg-copper)',
                  border: '1px solid var(--ghg-copper)',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  transition: 'background 180ms ease, box-shadow 180ms ease',
                  boxShadow: '0 4px 18px rgba(255,90,31,0.28)',
                }}
              >
                {t('team.viewWork')} →
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <style>{`
        .team-card:hover .team-photo {
          transform: translateY(-4px);
        }
        .gallery-btn:hover {
          background: var(--ghg-rust) !important;
          box-shadow: 0 6px 24px rgba(255,90,31,0.42) !important;
        }
        @media (max-width: 640px) {
          .team-modal {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            padding: 20px !important;
            text-align: center;
          }
          .team-modal > div:first-of-type {
            margin: 0 auto;
            width: 200px !important;
            height: 200px !important;
            font-size: 84px !important;
          }
          .team-modal h3 { font-size: 44px !important; margin: 8px 0 12px !important; }
          .team-modal > div:last-of-type > div:first-child { font-size: 11px !important; }
          .team-modal p { font-size: 15px !important; line-height: 1.6 !important; }
          .team-modal .gallery-btn {
            align-self: center !important;
            margin-top: 22px !important;
            padding: 12px 22px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
