'use client';
import { useState } from 'react';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';

export default function Contact() {
  const { t } = useLang();
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" style={{ background: 'var(--ghg-ink)', padding: '120px 0' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80 }}>
        <div>
          <Eyebrow num="07" label={t('contact.eyebrow')}/>
          <h2 className="section-heading">{t('contact.heading1')}<br/>{t('contact.heading2')}</h2>
          <div className="copper-rule"/>
          <p style={{ fontSize: 18, color: 'var(--fg-2)', fontWeight: 300 }}>
            {t('contact.intro')}
          </p>
          <div style={{ marginTop: 36 }}>
            <a href="tel:+498980039037" style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(30px, 8vw, 36px)', letterSpacing: '0.01em', color: 'var(--fg)' }}>089 800 39 037</a>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          style={{ display: 'grid', gap: 12 }}
        >
          <div className="contact-names" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input name="vorname" autoComplete="given-name" aria-label={t('contact.firstName')} placeholder={t('contact.firstName')} required/>
            <input name="nachname" autoComplete="family-name" aria-label={t('contact.lastName')} placeholder={t('contact.lastName')} required/>
          </div>
          <input name="telefon" type="tel" inputMode="tel" autoComplete="tel" aria-label={t('contact.phone')} placeholder={t('contact.phone')}/>
          <input name="email" type="email" inputMode="email" autoComplete="email" aria-label={t('contact.email')} placeholder={t('contact.email')} required/>
          <textarea name="nachricht" placeholder={t('contact.message')} required style={{ minHeight: 140, resize: 'vertical' }}/>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--fg-2)', marginTop: 8, lineHeight: 1.5 }}>
            <input type="checkbox" required style={{ width: 'auto', marginTop: 3, flexShrink: 0 }}/>
            <span>{t('contact.consent')}</span>
          </label>
          <button type="submit" className="btn" disabled={sent} style={{ justifySelf: 'start', marginTop: 16 }}>
            {sent ? t('contact.sent') : t('contact.submit')}
          </button>
        </form>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #contact .container { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 480px) {
          #contact .contact-names { grid-template-columns: 1fr !important; }
          #contact button[type="submit"] { width: 100%; justify-self: stretch !important; }
        }
      `}</style>
    </section>
  );
}
