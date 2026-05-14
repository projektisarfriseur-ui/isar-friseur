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
          <Eyebrow num="05" label={t('contact.eyebrow')}/>
          <h2 className="section-heading">{t('contact.heading1')}<br/>{t('contact.heading2')}</h2>
          <div className="copper-rule"/>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }}>
            {t('contact.intro')}
          </p>
          <div style={{ marginTop: 36 }}>
            <a href="tel:+498980039037" style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.04em', color: 'var(--ghg-paper)' }}>089 800 39 037</a>
            <a href="mailto:burhan380@gmail.com" style={{ display: 'block', marginTop: 6, fontSize: 16, color: 'var(--fg-2)' }}>burhan380@gmail.com</a>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          style={{ display: 'grid', gap: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <input name="vorname" placeholder={t('contact.firstName')} required/>
            <input name="nachname" placeholder={t('contact.lastName')} required/>
          </div>
          <input name="telefon" type="tel" placeholder={t('contact.phone')}/>
          <input name="email" type="email" placeholder={t('contact.email')} required/>
          <textarea name="nachricht" placeholder={t('contact.message')} required/>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--fg-2)' }}>
            <input type="checkbox" required style={{ width: 'auto', marginTop: 4 }}/>
            <span>{t('contact.consent')}</span>
          </label>
          <button type="submit" className="btn" disabled={sent} style={{ justifySelf: 'start' }}>
            {sent ? t('contact.sent') : t('contact.submit')}
          </button>
        </form>
      </div>
      <style>{`
        @media (max-width: 900px) {
          #contact .container { grid-template-columns: 1fr !important; gap: 50px !important; }
        }
      `}</style>
    </section>
  );
}
