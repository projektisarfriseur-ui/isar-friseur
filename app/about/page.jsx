import Nav from '../components/Nav';
import About from '../components/About';
import Footer from '../components/Footer';

export const metadata = { title: 'Über uns | Isar Friseur' };

export default function AboutPage() {
  return (
    <>
      <Nav/>
      <main style={{ background: 'var(--ghg-ink)' }}>
        <About/>
      </main>
      <Footer/>
    </>
  );
}
