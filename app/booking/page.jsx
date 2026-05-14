import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Wizard from './Wizard';

export const metadata = { title: 'Termin buchen — Isar Friseur' };

export default function BookingPage() {
  return (
    <>
      <Nav/>
      <main style={{ minHeight: '70vh', padding: '80px 0 120px', background: 'var(--ghg-ink)' }}>
        <Wizard/>
      </main>
      <Footer/>
    </>
  );
}
