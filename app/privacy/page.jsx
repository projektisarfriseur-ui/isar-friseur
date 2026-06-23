'use client';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useLang } from '../lib/i18n';

const COPY = {
  de: {
    eyebrow: 'Rechtliches',
    title: 'Datenschutzerklärung',
    updated: 'Stand: Juni 2026',
    sections: [
      {
        h: '1. Verantwortlicher',
        p: 'Isar Friseur\nFraunhofer Straße 14\n80469 München\nTelefon: 089 800 39 037\nE-Mail: burhan380@gmail.com',
      },
      {
        h: '2. Erhebung und Speicherung personenbezogener Daten',
        p: 'Beim Besuch unserer Website werden automatisch Informationen allgemeiner Natur erfasst. Diese Informationen (Server-Logfiles) beinhalten etwa die Art des Webbrowsers, das verwendete Betriebssystem, den Domainnamen Ihres Internet-Service-Providers und Ähnliches. Hierbei handelt es sich ausschließlich um Informationen, welche keine Rückschlüsse auf Ihre Person zulassen.',
      },
      {
        h: '3. Terminbuchung',
        p: 'Wenn Sie über das Buchungsformular einen Termin vereinbaren, erheben wir Name, Telefonnummer, E-Mail-Adresse und gewählte Dienstleistung. Diese Daten werden ausschließlich zur Abwicklung Ihres Termins und zur Terminbestätigung per E-Mail verwendet (Resend). Die Daten werden in unserer Datenbank (Supabase, EU-Region) gespeichert und nach 24 Monaten gelöscht.',
      },
      {
        h: '4. Cookies',
        p: 'Wir verwenden ausschließlich technisch notwendige Cookies (z. B. für die Admin-Authentifizierung). Es findet kein Tracking statt. Es werden keine Cookies von Drittanbietern für Marketingzwecke gesetzt.',
      },
      {
        h: '5. Google Maps',
        p: 'Auf unserer Standort-Seite binden wir Google Maps ein. Die Karte wird erst geladen, wenn Sie die Seite öffnen. Beim Laden überträgt Ihr Browser Daten an Google. Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.',
      },
      {
        h: '6. Ihre Rechte',
        p: 'Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten. Eine Anfrage richten Sie bitte formlos an die oben genannte E-Mail-Adresse.',
      },
      {
        h: '7. Beschwerderecht',
        p: 'Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.',
      },
    ],
  },
  en: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    updated: 'Last updated: June 2026',
    sections: [
      {
        h: '1. Data Controller',
        p: 'Isar Friseur\nFraunhofer Straße 14\n80469 Munich\nPhone: +49 89 800 39 037\nE-mail: burhan380@gmail.com',
      },
      {
        h: '2. Collection and Storage of Personal Data',
        p: 'When you visit our website, general information is collected automatically. This information (server log files) includes the type of web browser, the operating system used, the domain name of your internet service provider and similar. None of this data allows conclusions to be drawn about your person.',
      },
      {
        h: '3. Appointment Booking',
        p: 'When you book an appointment via our booking form, we collect your name, phone number, e-mail address and the chosen service. This data is used exclusively to process your appointment and to send the confirmation e-mail (via Resend). Data is stored in our database (Supabase, EU region) and deleted after 24 months.',
      },
      {
        h: '4. Cookies',
        p: 'We use only technically necessary cookies (e.g. for admin authentication). No tracking takes place. No third-party marketing cookies are set.',
      },
      {
        h: '5. Google Maps',
        p: 'On our location page we embed Google Maps. The map loads only when you open the page. When loading, your browser transmits data to Google. Provider: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.',
      },
      {
        h: '6. Your Rights',
        p: 'You have the right at any time to information, correction, deletion and restriction of the processing of your personal data. Please send any request informally to the e-mail address listed above.',
      },
      {
        h: '7. Right to Complain',
        p: 'You have the right to lodge a complaint with the competent supervisory authority: Bavarian State Office for Data Protection Supervision (BayLDA), Promenade 18, 91522 Ansbach, Germany.',
      },
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useLang();
  const c = COPY[lang] || COPY.de;

  return (
    <>
      <Nav/>
      <main style={{ background: 'var(--ghg-ink)', minHeight: '100vh', paddingTop: 120, paddingBottom: 120 }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: '0.24em', color: 'var(--ghg-copper)', textTransform: 'uppercase' }}>
            {c.eyebrow}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(38px, 5.4vw, 68px)',
            letterSpacing: '0.005em',
            margin: '14px 0 24px',
            lineHeight: 1.08,
          }}>
            {c.title}
          </h1>
          <div style={{ width: 64, height: 2, background: 'var(--ghg-copper)', marginBottom: 40 }}/>

          <div style={{ color: 'var(--fg)', fontSize: 16, lineHeight: 1.75, fontWeight: 300 }}>
            <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 32 }}>{c.updated}</p>

            {c.sections.map((s) => (
              <div key={s.h}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: 24,
                  letterSpacing: '0.005em',
                  color: 'var(--fg)',
                  marginTop: 36,
                  marginBottom: 12,
                }}>
                  {s.h}
                </h2>
                <p style={{ whiteSpace: 'pre-line' }}>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer/>
    </>
  );
}
