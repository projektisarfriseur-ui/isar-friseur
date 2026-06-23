'use client';
import { useLang } from '../lib/i18n';

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1px solid var(--border)',
      fontFamily: 'var(--font-body)',
    }}>
      {['de', 'en'].map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-pressed={active}
            style={{
              background: active ? 'var(--ghg-copper)' : 'transparent',
              color: active ? '#ffffff' : 'var(--fg-2)',
              border: 0,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 300ms var(--e-brand), color 300ms var(--e-brand)',
            }}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
