'use client';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';

const PEOPLE = [
  { name: 'Gülay',  role: { de: 'Friseurmeisterin', en: 'Master Stylist' }, photo: '/team/gulay.jpg' },
  { name: 'Paula',  role: { de: 'Friseurmeisterin', en: 'Master Stylist' }, photo: '/team/paula.jpg' },
  { name: 'Karam',  role: { de: 'Friseur',          en: 'Stylist'        }, photo: '/team/karam.jpg' },
  { name: 'Gjent',  role: { de: 'Friseur',          en: 'Stylist'        }, photo: '/team/gjent.jpg' },
  { name: 'Haji',   role: { de: 'Friseur',          en: 'Stylist'        }, photo: '/team/haji.jpg' },
  { name: 'Khalid', role: { de: 'Friseur',          en: 'Stylist'        }, photo: null },
  { name: 'Sascha', role: { de: 'Team',             en: 'Team'           }, photo: null },
];

export default function Team() {
  const { t, lang } = useLang();
  return (
    <section id="team" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="04" label={t('team.eyebrow')}/>
        <h2 className="section-heading">{t('team.heading')}</h2>
        <div className="copper-rule"/>
        <p style={{ maxWidth: 640, fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 60 }}>
          {t('team.intro')}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center' }} className="team-grid">
          {PEOPLE.map(p => (
            <div key={p.name} style={{ width: 240, textAlign: 'center' }}>
              <div style={{
                width: 220, height: 220,
                margin: '0 auto',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid var(--ghg-copper)',
                background: p.photo ? '#1a1410' : 'linear-gradient(135deg, #1a1410, #5a3220)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ghg-copper)',
                fontFamily: 'var(--font-display)',
                fontSize: 72, letterSpacing: '0.1em',
              }}>
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    width={220} height={220}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', imageRendering: '-webkit-optimize-contrast' }}
                  />
                ) : p.name[0]}
              </div>
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--ghg-copper)', marginTop: 4 }}>{p.role[lang] || p.role.en}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
