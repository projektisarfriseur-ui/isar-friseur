'use client';
import Eyebrow from './Eyebrow';
import PhotoTile from './PhotoTile';
import { useLang } from '../lib/i18n';

const PEOPLE = [
  { name: 'Khalid', roleKey: 'team.role.owner',   seed: 0 },
  { name: 'Gülay',  roleKey: 'team.role.color',   seed: 3 },
  { name: 'Burhan', roleKey: 'team.role.stylist', seed: 4 },
];

export default function Team() {
  const { t } = useLang();
  return (
    <section id="team" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="04" label={t('team.eyebrow')}/>
        <h2 className="section-heading">{t('team.heading')}</h2>
        <div className="copper-rule"/>
        <p style={{ maxWidth: 640, fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 60 }}>
          {t('team.intro')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }} className="team-grid">
          {PEOPLE.map(p => (
            <div key={p.name}>
              <PhotoTile seed={p.seed} aspect="3/4"/>
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--ghg-copper)', marginTop: 4 }}>{t(p.roleKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .team-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
