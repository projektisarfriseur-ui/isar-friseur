import Nav from '../components/Nav';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export const metadata = { title: 'Kontakt — Isar Friseur' };

export default function ContactPage() {
  return (
    <>
      <Nav/>
      <main style={{ background: 'var(--ghg-ink)' }}>
        <Contact/>
      </main>
      <Footer/>
    </>
  );
}
