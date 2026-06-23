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
    'hero.title2': 'Isar Friseur',
    'hero.address': 'FRAUNHOFER STRASSE 14 · 80469 MÜNCHEN',
    'hero.bookBtn': 'Termin buchen',
    'hero.pricesBtn': 'Preisliste',
    'hero.scroll': 'SCROLL',

    'about.eyebrow': 'ABOUT',
    'about.heading1': 'Wir bringen München',
    'about.heading2': 'jeden Tag zum Lächeln.',
    'about.body1': 'In unserem Salon arbeiten die geschicktesten Hände Deutschlands, und wir meinen das ernst. Wir schneiden, föhnen, färben und beraten mit dem Anspruch, dass du danach besser aussiehst als du es dir selbst zugetraut hast. Komm vorbei, setz dich, lass uns reden. Wir finden zusammen die Linie und Farbe, die zu deinem Leben passt.',
    'about.body2': 'Kaffee, Tee, ein Glas Wasser stehen bereit. Und ja, wir sprechen Deutsch, English, Türkçe.',

    'loc.eyebrow': 'LOCATION',
    'loc.heading': 'So findest du uns.',
    'loc.salon': 'SALON',
    'loc.address': 'Fraunhofer Straße 14\n80469 München\nLudwigsvorstadt-Isarvorstadt',
    'loc.hours': 'ÖFFNUNGSZEITEN',
    'loc.mf': 'Mo - Fr',
    'loc.sa': 'Sa',
    'loc.su': 'So',
    'loc.closed': 'geschlossen',
    'loc.contact': 'KONTAKT',

    'svc.eyebrow': 'SERVICES',
    'svc.heading': 'Preise & Leistungen.',
    'svc.intro': 'Richtwerte. Endpreis abhängig von Haarlänge, Aufwand und Pflegezustand. Wir besprechen vor der Behandlung, was sinnvoll ist. Ohne Druck.',
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
    'team.intro': 'Erfahren, ruhig, ehrlich. Jeder im Team hat einen klaren Schwerpunkt. Sag uns bei der Buchung, mit wem du arbeiten möchtest, oder lass dich vorschlagen.',
    'team.role.owner': 'Inhaber · Master Stylist',
    'team.role.color': 'Color Specialist',
    'team.role.stylist': 'Stylist',
    'team.viewWork': 'Arbeiten ansehen',
    'team.profileOf': 'Profil von',
    'team.close': 'Schließen',

    'ig.eyebrow': 'INSTAGRAM',
    'ig.heading': 'Folge uns auf Instagram.',
    'ig.intro': 'Aktuelle Arbeiten, Color-Transformationen und Salon-Momente. Tippe auf eine Kachel und schau auf unserem Profil vorbei.',
    'ig.handle': '@isar_friseur',
    'ig.cta': 'Profil ansehen',

    'contact.eyebrow': 'CONTACT',
    'contact.heading1': 'Schreib uns,',
    'contact.heading2': 'oder ruf einfach an.',
    'contact.intro': 'Für einen Termin reicht ein Anruf. Wer lieber schreibt: das Formular kommt direkt im Salon an. Antwort meist am selben Tag.',
    'contact.firstName': 'Vorname',
    'contact.lastName': 'Nachname',
    'contact.phone': 'Telefon',
    'contact.email': 'E-Mail',
    'contact.message': 'Nachricht (Wunschtermin, gewünschte Leistung)',
    'contact.consent': 'Mit dem Absenden bestätige ich, dass ich die Datenschutzerklärung zur Kenntnis genommen habe.',
    'contact.submit': 'ABSCHICKEN',
    'contact.sent': 'Danke, wir melden uns',

    'foot.tagline': 'Friseur und Color-Studio mitten in der Isarvorstadt. Inhabergeführt seit Jahren. Kein Filialcharakter, kein Druck.',
    'foot.salon': 'SALON',
    'foot.hours': 'ÖFFNUNG',
    'foot.hoursLines': 'Mo - Fr · 09 - 19 Uhr\nSa · 09 - 17 Uhr\nSo geschlossen',
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
    'hero.title2': 'Isar Friseur',
    'hero.address': 'FRAUNHOFER STRASSE 14 · 80469 MUNICH',
    'hero.bookBtn': 'Book a chair',
    'hero.pricesBtn': 'Price list',
    'hero.scroll': 'SCROLL',

    'about.eyebrow': 'ABOUT',
    'about.heading1': 'We make Munich smile',
    'about.heading2': 'every single day.',
    'about.body1': 'In our salon you find the most skilled hands in Germany, and we say that with a straight face. We cut, blow-dry, colour and consult with one goal: you walk out looking better than you thought possible. Sit down, talk to us. Together we find the line and colour that fit your life.',
    'about.body2': 'Coffee, tea, water on the house. And yes, we speak German, English, Türkçe.',

    'loc.eyebrow': 'LOCATION',
    'loc.heading': 'How to find us.',
    'loc.salon': 'SALON',
    'loc.address': 'Fraunhofer Straße 14\n80469 Munich\nLudwigsvorstadt-Isarvorstadt',
    'loc.hours': 'OPENING HOURS',
    'loc.mf': 'Mon - Fri',
    'loc.sa': 'Sat',
    'loc.su': 'Sun',
    'loc.closed': 'closed',
    'loc.contact': 'CONTACT',

    'svc.eyebrow': 'SERVICES',
    'svc.heading': 'Pricing & services.',
    'svc.intro': 'Guideline prices. Final price depends on hair length, effort, and condition. We talk through what makes sense before we start. No pressure.',
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
    'team.intro': 'Experienced, calm, honest. Each stylist has a clear specialism. Tell us at booking who you want to work with, or let us suggest.',
    'team.role.owner': 'Owner · Master stylist',
    'team.role.color': 'Colour specialist',
    'team.role.stylist': 'Stylist',
    'team.viewWork': 'View Work',
    'team.profileOf': 'Profile of',
    'team.close': 'Close',

    'ig.eyebrow': 'INSTAGRAM',
    'ig.heading': 'Follow us on Instagram.',
    'ig.intro': 'Latest work, colour transformations, salon moments. Tap a tile and meet us on the grid.',
    'ig.handle': '@isar_friseur',
    'ig.cta': 'Visit profile',

    'contact.eyebrow': 'CONTACT',
    'contact.heading1': 'Write to us,',
    'contact.heading2': 'or just give us a call.',
    'contact.intro': 'For a booking a phone call is enough. If you prefer to write: the form lands straight in the salon. Reply usually same day.',
    'contact.firstName': 'First name',
    'contact.lastName': 'Last name',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.message': 'Message (preferred time, requested service)',
    'contact.consent': 'By submitting I confirm that I have read the privacy policy.',
    'contact.submit': 'SEND',
    'contact.sent': 'Thanks, we will be in touch',

    'foot.tagline': 'Hair and colour studio in the heart of Isarvorstadt. Independently owned for years. No chain feel, no pressure.',
    'foot.salon': 'SALON',
    'foot.hours': 'HOURS',
    'foot.hoursLines': 'Mon - Fri · 9am - 7pm\nSat · 9am - 5pm\nSun closed',
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
