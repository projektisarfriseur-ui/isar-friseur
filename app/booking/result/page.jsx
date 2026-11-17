import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const MSG = {
  confirmed: { de: 'Dein Termin ist bestätigt. Wir freuen uns auf dich.', en: 'Your appointment is confirmed. See you soon.' },
  cancelled: { de: 'Dein Termin wurde storniert.', en: 'Your appointment has been cancelled.' },
  invalid:   { de: 'Link ungültig oder bereits eingelöst.', en: 'Link invalid or already used.' },
  demo:      { de: 'Demo-Modus. Datenbank noch nicht verbunden.', en: 'Demo mode. Database not connected.' },
};

export default async function ResultPage({ searchParams }) {
  const sp = await searchParams;
  const status = sp?.status || 'invalid';
  const msg = MSG[status] || MSG.invalid;
  return (
    <>
      <Nav/>
      <main style={{ minHeight: '60vh', padding: '120px 0', background: 'var(--ghg-ink)', textAlign: 'center' }}>
        <div className="container">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--ghg-copper)' }}>
            {status === 'confirmed' ? 'BESTÄTIGT' : status === 'cancelled' ? 'STORNIERT' : ''}
          </div>
          <h1 className="section-heading" style={{ marginTop: 18, fontSize: 36 }}>{msg.de}</h1>
          <p style={{ color: 'var(--fg-2)', fontSize: 16, marginTop: 8 }}>{msg.en}</p>
          <a href="/" className="btn" style={{ marginTop: 36, display: 'inline-block' }}>Zur Startseite</a>
        </div>
      </main>
      <Footer/>
    </>
  );
}
