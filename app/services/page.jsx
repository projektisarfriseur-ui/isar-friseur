import Nav from '../components/Nav';
import Services from '../components/Services';
import Footer from '../components/Footer';

export const metadata = { title: 'Leistungen — Isar Friseur' };

export default function ServicesPage() {
  return (
    <>
      <Nav/>
      <main style={{ background: 'var(--ghg-ink)' }}>
        <Services/>
      </main>
      <Footer/>
    </>
  );
}
