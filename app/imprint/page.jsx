'use client';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useLang } from '../lib/i18n';

const COPY = {
  de: {
    eyebrow: 'Rechtliches',
    title: 'Impressum',
    updated: 'Stand: Juni 2026',
    sections: [
      {
        h: 'Angaben gemäß § 5 TMG',
        p: 'Isar Friseur\nInhaber: Burhan Kaya\nFraunhofer Straße 14\n80469 München\nDeutschland',
      },
      {
        h: 'Kontakt',
        p: 'Telefon: 089 800 39 037\nE-Mail: burhan380@gmail.com',
      },
      {
        h: 'Umsatzsteuer-ID',
        p: 'Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: wird auf Anfrage mitgeteilt.',
      },
      {
        h: 'Aufsichtsbehörde',
        p: 'Handwerkskammer für München und Oberbayern\nMax-Joseph-Straße 4, 80333 München',
      },
      {
        h: 'Berufsbezeichnung',
        p: 'Friseurhandwerk (verliehen in Deutschland).\nZuständige Kammer: Handwerkskammer für München und Oberbayern.',
      },
      {
        h: 'Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV',
        p: 'Burhan Kaya\nFraunhofer Straße 14\n80469 München',
      },
      {
        h: 'EU-Streitschlichtung',
        p: 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.\nUnsere E-Mail-Adresse finden Sie oben im Impressum.',
      },
      {
        h: 'Verbraucherstreitbeilegung',
        p: 'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
      },
      {
        h: 'Haftung für Inhalte',
        p: 'Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.',
      },
      {
        h: 'Haftung für Links',
        p: 'Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.',
      },
      {
        h: 'Urheberrecht',
        p: 'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
      },
    ],
  },
  en: {
    eyebrow: 'Legal',
    title: 'Imprint',
    updated: 'Last updated: June 2026',
    sections: [
      {
        h: 'Information pursuant to § 5 TMG',
        p: 'Isar Friseur\nOwner: Burhan Kaya\nFraunhofer Straße 14\n80469 Munich\nGermany',
      },
      {
        h: 'Contact',
        p: 'Phone: +49 89 800 39 037\nE-mail: burhan380@gmail.com',
      },
      {
        h: 'VAT ID',
        p: 'VAT identification number pursuant to § 27 a German VAT Act: provided on request.',
      },
      {
        h: 'Supervisory Authority',
        p: 'Chamber of Crafts for Munich and Upper Bavaria\nMax-Joseph-Straße 4, 80333 Munich, Germany',
      },
      {
        h: 'Professional Title',
        p: 'Hairdressing craft (awarded in Germany).\nCompetent chamber: Chamber of Crafts for Munich and Upper Bavaria.',
      },
      {
        h: 'Responsible for content pursuant to § 55 (2) RStV',
        p: 'Burhan Kaya\nFraunhofer Straße 14\n80469 Munich, Germany',
      },
      {
        h: 'EU Dispute Resolution',
        p: 'The European Commission provides a platform for online dispute resolution (ODR): https://ec.europa.eu/consumers/odr.\nOur e-mail address can be found above in the imprint.',
      },
      {
        h: 'Consumer Dispute Resolution',
        p: 'We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.',
      },
      {
        h: 'Liability for Content',
        p: 'As a service provider, we are responsible under § 7 (1) TMG for our own content on these pages in accordance with general law. According to §§ 8 to 10 TMG, however, we are not obliged as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.',
      },
      {
        h: 'Liability for Links',
        p: 'Our website contains links to external third-party websites whose content we have no influence over. Therefore, we cannot accept any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content.',
      },
      {
        h: 'Copyright',
        p: 'The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator.',
      },
    ],
  },
};

export default function ImprintPage() {
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
