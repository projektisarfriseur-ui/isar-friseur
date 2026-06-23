'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLang } from '../../lib/i18n';

export default function StylistView({ person, images }) {
  const { lang, t } = useLang();
  const role = person.role[lang] || person.role.de;
  const bio = person.bio[lang] || person.bio.de;

  // if the visitor came from the booking flow, send them back there
  // (booking restores their saved step 2 stylist choice) instead of to the Team section
  const [fromBooking, setFromBooking] = useState(false);
  useEffect(() => {
    setFromBooking(new URLSearchParams(window.location.search).get('from') === 'booking');
  }, []);
  const backHref = fromBooking ? '/booking' : '/#team';
  const backLabel = fromBooking
    ? (lang === 'de' ? 'Zurück' : 'Back')
    : (lang === 'de' ? 'Team' : 'Team');

  return (
    <main style={{ background: 'var(--ghg-ink)', minHeight: '100vh', paddingTop: 120, paddingBottom: 120 }}>
      <div className="container">
        <Link href={backHref} style={{
          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12,
          letterSpacing: '0.24em', color: 'var(--ghg-copper)',
          textTransform: 'uppercase', textDecoration: 'none',
        }}>
          ← {backLabel}
        </Link>

        <div style={{
          display: 'grid', gridTemplateColumns: '340px 1fr',
          gap: 48, alignItems: 'center',
          marginTop: 32, marginBottom: 64,
        }} className="stylist-head">
          <div style={{
            width: 340, height: 340, borderRadius: '50%', overflow: 'hidden',
            background: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ghg-copper)', fontFamily: 'var(--font-display)', fontSize: 130,
          }}>
            {person.photo ? (
              <img src={person.photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) : person.name[0]}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12,
              letterSpacing: '0.24em', color: 'var(--ghg-copper)', textTransform: 'uppercase',
            }}>{role}</div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 76,
              letterSpacing: '0.005em', margin: '12px 0 18px', lineHeight: 1,
            }}>{person.name}</h1>
            <div style={{ width: 64, height: 2, background: 'var(--ghg-copper)', marginBottom: 24 }}/>
            <p style={{
              fontSize: 18, lineHeight: 1.75, color: 'var(--fg)',
              margin: 0, maxWidth: 560, fontWeight: 300,
            }}>{bio}</p>
            <div style={{
              marginTop: 28,
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12,
              letterSpacing: '0.22em', color: 'var(--fg-2)', textTransform: 'uppercase',
            }}>
              {lang === 'de' ? 'Galerie' : 'Gallery'}
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {images.map((src) => (
              <div key={src} style={{ aspectRatio: '1/1', overflow: 'hidden', background: '#1a1410' }}>
                <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .stylist-head { grid-template-columns: 1fr !important; justify-items: center; text-align: center; }
        }
      `}</style>
    </main>
  );
}
