import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Location from './components/Location';
import Services from './components/Services';
import Team from './components/Team';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function Page() {
  return (
    <>
      <Nav/>
      <Hero/>
      <About/>
      <Location/>
      <Services/>
      <Team/>
      <Contact/>
      <Footer/>
    </>
  );
}
