import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Location from './components/Location';
import Services from './components/Services';
import Team from './components/Team';
import Products from './components/Products';
import Instagram from './components/Instagram';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Reveal from './components/Reveal';

export default function Page() {
  return (
    <>
      <Nav/>
      <Hero/>
      <Reveal><About/></Reveal>
      <Reveal><Location/></Reveal>
      <Reveal><Services/></Reveal>
      <Reveal><Team/></Reveal>
      <Reveal><Products/></Reveal>
      <Instagram/>
      <Reveal><Contact/></Reveal>
      <Footer/>
    </>
  );
}
