'use client';
import Eyebrow from './Eyebrow';
import { useLang } from '../lib/i18n';

const PRODUCTS = [
  {
    img: '/products/product-1.webp',
    name: { de: 'Pflege-Shampoo', en: 'Care Shampoo' },
    desc: {
      de: 'Mildes tägliches Shampoo für coloriertes und strapaziertes Haar. Sulfatfrei.',
      en: 'Gentle daily shampoo for coloured and stressed hair. Sulfate-free.',
    },
  },
  {
    img: '/products/product-2.webp',
    name: { de: 'Repair Maske', en: 'Repair Mask' },
    desc: {
      de: 'Tiefenkur einmal die Woche. Rekonstruiert die Haarstruktur nach Färbung und Hitze.',
      en: 'Weekly deep treatment. Rebuilds structure after colour and heat.',
    },
  },
  {
    img: '/products/product-3.webp',
    name: { de: 'Styling Öl', en: 'Styling Oil' },
    desc: {
      de: 'Leichtes Finish. Glanz ohne zu beschweren. Schutz vor Föhn und Hitze.',
      en: 'Lightweight finish. Shine without weight. Heat protection.',
    },
  },
  {
    img: '/products/product-4.webp',
    name: { de: 'Color Conditioner', en: 'Colour Conditioner' },
    desc: {
      de: 'Schützt die Farbe und versorgt Längen mit Feuchtigkeit. Für jeden Tag.',
      en: 'Locks in colour and hydrates lengths. Daily use.',
    },
  },
];

export default function Products() {
  const { t, lang } = useLang();
  return (
    <section id="products" style={{ background: 'var(--ghg-graphite)', padding: '120px 0' }}>
      <div className="container">
        <Eyebrow num="05" label={lang === 'de' ? 'PRODUKTE' : 'PRODUCTS'}/>
        <h2 className="section-heading">
          {lang === 'de' ? 'Pflege für zuhause.' : 'Care for at home.'}
        </h2>
        <div className="copper-rule"/>
        <p style={{ maxWidth: 640, fontSize: 18, color: 'var(--fg-2)', marginBottom: 60, fontWeight: 300 }}>
          {lang === 'de'
            ? 'Die Produkte, die wir im Salon verwenden, kannst du auch mit nach Hause nehmen. Wir empfehlen ehrlich, was zu deinem Haar passt.'
            : 'The products we use in the salon, you can take them home. We recommend honestly, only what fits your hair.'}
        </p>

        <div className="products-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 28,
        }}>
          {PRODUCTS.map((p) => (
            <article key={p.img} className="product-tile" style={{
              display: 'flex', flexDirection: 'column',
            }}>
              <div className="product-img" style={{
                aspectRatio: '4 / 5',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img
                  src={p.img}
                  alt={p.name[lang]}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
              <div style={{ paddingTop: 22 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  color: 'var(--fg)',
                  lineHeight: 1.25,
                }}>
                  {p.name[lang]}
                </div>
                <div style={{
                  marginTop: 12,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'var(--fg-2)',
                  fontWeight: 300,
                }}>
                  {p.desc[lang]}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .products-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .products-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .product-img { aspect-ratio: 16 / 10 !important; }
          .product-tile > div:last-child { padding-top: 10px !important; padding-bottom: 4px !important; }
        }
      `}</style>
    </section>
  );
}
