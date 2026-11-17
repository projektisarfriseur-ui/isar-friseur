import Nav from '../components/Nav';
import Team from '../components/Team';
import Footer from '../components/Footer';

export const metadata = { title: 'Team | Isar Friseur' };

export default function TeamPage() {
  return (
    <>
      <Nav/>
      <main style={{ background: 'var(--ghg-ink)' }}>
        <Team/>
      </main>
      <Footer/>
    </>
  );
}
