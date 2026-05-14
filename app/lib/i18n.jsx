'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const DICT = {
  de: {
    'nav.about': 'ABOUT',
    'nav.location': 'LOCATION',
    'nav.services': 'SERVICES',
    'nav.team': 'TEAM',
    'nav.contact': 'CONTACT',
    'nav.cta': 'TERMIN',

    'hero.eyebrow': 'FRISEUR · MÜNCHEN · ISARVORSTADT',
    'hero.title1': 'Dein Salon',
    'hero.title2': 'an der Isar',
    'hero.address': 'FRAUNHOFER STRASSE 14 · 80469 MÜNCHEN',
    'hero.bookBtn': 'Termin buchen',
    'hero.pricesBtn': 'Preisliste',
    'hero.scroll': 'SCROLL',

    'about.eyebrow': 'ABOUT',
    'about.heading1': 'Friseur mit Charakter.',
    'about.heading2': 'Mitten in der Isarvorstadt.',
    'about.body1': 'Isar Friseur ist ein kleiner Salon an der Fraunhofer Straße — zwei Stationen zu Fuß vom Gärtnerplatz, drei vom Reichenbachplatz. Schneiden, Föhnen, Färben, Beratung. Wir nehmen uns Zeit, hören zu, und finden mit dir die Schnittlinie und Farbe, die zu deinem Alltag passt.',
    'about.body2': 'Kaffee, Tee, ein Glas Wasser stehen bereit. Und ja — wir sprechen Deutsch, English, Türkçe.',

    'loc.eyebrow': 'LOCATION',
    'loc.heading': 'So findest du uns.',
    'loc.salon': 'SALON',
    'loc.address': 'Fraunhofer Straße 14\n80469 München\nLudwigsvorstadt-Isarvorstadt',
    'loc.hours': 'ÖFFNUNGSZEITEN',
    'loc.mf': 'Mo – Fr',
    'loc.sa': 'Sa',
    'loc.su': 'So',
    'loc.closed': 'geschlossen',
    'loc.contact': 'KONTAKT',

    'svc.eyebrow': 'SERVICES',
    'svc.heading': 'Preise & Leistungen.',
    'svc.intro': 'Richtwerte. Endpreis abhängig von Haarlänge, Aufwand und Pflegezustand. Wir besprechen vor der Behandlung, was sinnvoll ist — ohne Druck.',
    'svc.women': 'DAMEN',
    'svc.men': 'HERREN',
    'svc.color': 'COLOR',
    'svc.care': 'PFLEGE',
    'svc.from': 'ab',
    'svc.r.wash': 'Waschen, Schneiden, Föhnen',
    'svc.r.dry': 'Trockenhaarschnitt',
    'svc.r.bang': 'Pony nachschneiden',
    'svc.r.updo': 'Hochsteckfrisur',
    'svc.r.beard': 'Bart konturieren',
    'svc.r.machine': 'Maschinenschnitt',
    'svc.r.root': 'Ansatz färben',
    'svc.r.full': 'Komplettfärbung',
    'svc.r.balay': 'Balayage',
    'svc.r.foil': 'Foliensträhnen',
    'svc.r.tone': 'Tönung',
    'svc.r.olaplex': 'Olaplex Behandlung',
    'svc.r.keratin': 'Keratin Kur',
    'svc.r.scalp': 'Kopfhautmassage',

    'team.eyebrow': 'TEAM',
    'team.heading': 'Die Hände hinter dem Schnitt.',
    'team.intro': 'Erfahren, ruhig, ehrlich. Jeder im Team hat einen klaren Schwerpunkt — sag uns bei der Buchung, mit wem du arbeiten möchtest, oder lass dich vorschlagen.',
    'team.role.owner': 'Inhaber · Master Stylist',
    'team.role.color': 'Color Specialist',
    'team.role.stylist': 'Stylist',

    'contact.eyebrow': 'CONTACT',
    'contact.heading1': 'Schreib uns,',
    'contact.heading2': 'oder ruf einfach an.',
    'contact.intro': 'Für einen Termin reicht ein Anruf. Wer lieber schreibt — das Formular kommt direkt im Salon an. Antwort meist am selben Tag.',
    'contact.firstName': 'Vorname',
    'contact.lastName': 'Nachname',
    'contact.phone': 'Telefon',
    'contact.email': 'E-Mail',
    'contact.message': 'Nachricht (Wunschtermin, gewünschte Leistung …)',
    'contact.consent': 'Mit dem Absenden bestätige ich, dass ich die Datenschutzerklärung zur Kenntnis genommen habe.',
    'contact.submit': 'ABSCHICKEN',
    'contact.sent': 'Danke — wir melden uns',

    'foot.tagline': 'Friseur und Color-Studio mitten in der Isarvorstadt. Inhabergeführt seit Jahren — kein Filialcharakter, kein Druck.',
    'foot.salon': 'SALON',
    'foot.hours': 'ÖFFNUNG',
    'foot.hoursLines': 'Mo – Fr · 09 – 19 Uhr\nSa · 09 – 17 Uhr\nSo geschlossen',
    'foot.contact': 'KONTAKT',
    'foot.imprint': 'IMPRESSUM',
    'foot.privacy': 'DATENSCHUTZ',
  },
  en: {
    'nav.about': 'ABOUT',
    'nav.location': 'LOCATION',
    'nav.services': 'SERVICES',
    'nav.team': 'TEAM',
    'nav.contact': 'CONTACT',
    'nav.cta': 'BOOK',

    'hero.eyebrow': 'HAIR SALON · MUNICH · ISARVORSTADT',
    'hero.title1': 'Your salon',
    'hero.title2': 'by the Isar',
    'hero.address': 'FRAUNHOFER STRASSE 14 · 80469 MUNICH',
    'hero.bookBtn': 'Book a chair',
    'hero.pricesBtn': 'Price list',
    'hero.scroll': 'SCROLL',

    'about.eyebrow': 'ABOUT',
    'about.heading1': 'A salon with character.',
    'about.heading2': 'In the heart of Isarvorstadt.',
    'about.body1': 'Isar Friseur is a small salon on Fraunhofer Straße — two stops on foot from Gärtnerplatz, three from Reichenbachplatz. Cuts, blow-dries, colour, consultation. We take our time, listen, and find the cut line and colour that fit your everyday life.',
    'about.body2': 'Coffee, tea, water on the house. And yes — we speak German, English, Türkçe.',

    'loc.eyebrow': 'LOCATION',
    'loc.heading': 'How to find us.',
    'loc.salon': 'SALON',
    'loc.address': 'Fraunhofer Straße 14\n80469 Munich\nLudwigsvorstadt-Isarvorstadt',
    'loc.hours': 'OPENING HOURS',
    'loc.mf': 'Mon – Fri',
    'loc.sa': 'Sat',
    'loc.su': 'Sun',
    'loc.closed': 'closed',
    'loc.contact': 'CONTACT',

    'svc.eyebrow': 'SERVICES',
    'svc.heading': 'Pricing & services.',
    'svc.intro': 'Guideline prices. Final price depends on hair length, effort, and condition. We talk through what makes sense before we start — no pressure.',
    'svc.women': 'WOMEN',
    'svc.men': 'MEN',
    'svc.color': 'COLOUR',
    'svc.care': 'CARE',
    'svc.from': 'from',
    'svc.r.wash': 'Wash, cut, blow-dry',
    'svc.r.dry': 'Dry cut',
    'svc.r.bang': 'Fringe trim',
    'svc.r.updo': 'Updo',
    'svc.r.beard': 'Beard contouring',
    'svc.r.machine': 'Clipper cut',
    'svc.r.root': 'Root colour',
    'svc.r.full': 'Full colour',
    'svc.r.balay': 'Balayage',
    'svc.r.foil': 'Foil highlights',
    'svc.r.tone': 'Toning',
    'svc.r.olaplex': 'Olaplex treatment',
    'svc.r.keratin': 'Keratin treatment',
    'svc.r.scalp': 'Scalp massage',

    'team.eyebrow': 'TEAM',
    'team.heading': 'The hands behind the cut.',
    'team.intro': 'Experienced, calm, honest. Each stylist has a clear specialism — tell us at booking who you want to work with, or let us suggest.',
    'team.role.owner': 'Owner · Master stylist',
    'team.role.color': 'Colour specialist',
    'team.role.stylist': 'Stylist',

    'contact.eyebrow': 'CONTACT',
    'contact.heading1': 'Write to us,',
    'contact.heading2': 'or just give us a call.',
    'contact.intro': 'For a booking a phone call is enough. If you prefer to write — the form lands straight in the salon. Reply usually same day.',
    'contact.firstName': 'First name',
    'contact.lastName': 'Last name',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.message': 'Message (preferred time, requested service …)',
    'contact.consent': 'By submitting I confirm that I have read the privacy policy.',
    'contact.submit': 'SEND',
    'contact.sent': 'Thanks — we will be in touch',

    'foot.tagline': 'Hair and colour studio in the heart of Isarvorstadt. Independently owned for years — no chain feel, no pressure.',
    'foot.salon': 'SALON',
    'foot.hours': 'HOURS',
    'foot.hoursLines': 'Mon – Fri · 9am – 7pm\nSat · 9am – 5pm\nSun closed',
    'foot.contact': 'CONTACT',
    'foot.imprint': 'IMPRINT',
    'foot.privacy': 'PRIVACY',
  },
};

const LangCtx = createContext({ lang: 'de', setLang: () => {}, t: (k) => k });

export function LangProvider({ children }) {
  const [lang, setLang] = useState('de');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lang') : null;
    if (stored === 'de' || stored === 'en') setLang(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = (key) => DICT[lang][key] ?? DICT.de[key] ?? key;

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
