import Nav from '../components/Nav';
import Location from '../components/Location';
import Footer from '../components/Footer';

export const metadata = { title: 'Standort — Isar Friseur' };

export default function LocationPage() {
  return (
    <>
      <Nav/>
      <main style={{ background: 'var(--ghg-ink)' }}>
        <Location/>
      </main>
      <Footer/>
    </>
  );
}
