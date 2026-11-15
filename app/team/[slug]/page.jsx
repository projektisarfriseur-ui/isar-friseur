import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import StylistView from './StylistView';

const PEOPLE = {
  gulay: {
    name: 'Gülay', role: { de: 'Friseurmeisterin', en: 'Master Stylist' }, photo: '/team/gulay.webp',
    bio: {
      de: 'Über zwanzig Jahre am Stuhl, davon viele in den feinsten Salons der Stadt. Ihr Schwerpunkt sind präzise Schnitte für feines Haar und klare Pixie-Linien, die wirklich sitzen. Sie arbeitet mit ruhiger Hand und gibt eine klare, ehrliche Beratung. Sie sagt dir offen, was funktioniert und was du besser sein lässt.',
      en: 'Over twenty years at the chair, many in the finest salons in the city. Her focus is precise cuts for fine hair and clean pixie lines that genuinely hold their shape. She works with a calm hand and gives clear, grounded advice. She will tell you honestly what suits you and where it is wiser to hold back.',
    },
  },
  paula: {
    name: 'Paula', role: { de: 'Friseurmeisterin', en: 'Master Stylist' }, photo: '/team/paula.webp',
    bio: {
      de: 'Paula ist unsere Spezialistin für Balayage und Foliensträhnen. Sie liebt natürliche Übergänge, warme sonnengeküsste Töne und kühle, klare Blondnuancen. Aus jeder Haarlänge holt sie das Beste heraus, mit Geduld und feinem Auge für Proportion. Wer einmal bei ihr saß, kommt für die Pflege und die Beratung gerne wieder.',
      en: 'Paula is our balayage and foil highlights specialist. She loves natural transitions, warm sun-kissed tones and clean, cool blonde nuances. She gets the very best out of every hair length with patience and a fine eye for proportion. Once you have sat in her chair, you tend to come back for the care and the conversation just as much as the colour.',
    },
  },
  karam: {
    name: 'Karam', role: { de: 'Friseur', en: 'Stylist' }, photo: '/team/karam.webp',
    bio: {
      de: 'Karam ist unser Mann für Herrenschnitte, saubere Fades und exakte Bartkonturen. Er arbeitet schnell, sicher und mit feinem Auge für Proportion und Gesichtsform. Lockiges Haar ist seine zweite Leidenschaft. Er weiß genau, wie man Textur richtig herausarbeitet, ohne Volumen zu verlieren.',
      en: 'Karam is our man for men\'s cuts, clean fades and sharp beard contours. He works fast and confident, with a sharp eye for proportion and face shape. Curly hair is his second love. He knows exactly how to bring out texture without losing volume.',
    },
  },
  gjent: {
    name: 'Gjent', role: { de: 'Friseur', en: 'Stylist' }, photo: '/team/gjent.webp',
    bio: {
      de: 'Gjent ist ein Allrounder mit Vorliebe für klassische Linien und moderne Texturen. Long-Bob, Shag und weiche Layer gehören zu seinen Spezialitäten. Er hört genau zu und fragt nach Alltag und Pflege, bevor er die Schere ansetzt. Der Schnitt funktioniert dann auch zu Hause genauso gut.',
      en: 'Gjent is an all-round cutter with a soft spot for classic lines and modern texture. Long bob, shag and soft layers are his specialities. He listens carefully and asks about your daily routine and styling habits before he picks up the scissors. The cut works at home just as well as in the salon.',
    },
  },
  haji: {
    name: 'Haji', role: { de: 'Friseur', en: 'Stylist' }, photo: '/team/haji.webp',
    bio: {
      de: 'Haji spricht Deutsch, Englisch und Türkçe und macht es jedem leicht, sich verstanden zu fühlen. Er schneidet Herren und Damen gleichermaßen und passt seinen Stil an die Person an. Geduldig, ruhig, freundlich. Perfekt für den ersten Salon-Besuch oder einen ganz neuen Look.',
      en: 'Haji speaks German, English and Türkçe and makes everyone feel understood. He cuts men and women alike and adapts his style to the person in front of him, never the other way round. Patient, calm and warm. Ideal for a first salon visit or a brand-new look.',
    },
  },
  khalid: {
    name: 'Khalid', role: { de: 'Friseur', en: 'Stylist' }, photo: null,
    bio: {
      de: 'Khalid ist Spezialist für strukturierte Kurzhaarschnitte und detaillierte Bartkonturen. Er arbeitet konzentriert, präzise und mit Respekt vor jedem Millimeter. Klare Linien, scharfe Kanten und saubere Übergänge sind seine Handschrift. Genau richtig für einen Look mit Charakter.',
      en: 'Khalid is a specialist in structured short cuts and detailed beard contours. He works focused, precise and with deep respect for every millimetre. Clean lines, sharp edges and seamless transitions are his signature. Just right for a look with character.',
    },
  },
  sascha: {
    name: 'Sascha', role: { de: 'Team', en: 'Team' }, photo: null,
    bio: {
      de: 'Empfang, Termine, Kaffee. Wer anruft oder reinkommt, landet meist zuerst bei Sascha. Mit einem freundlichen Wort, einem guten Gedächtnis für Namen und Lieblingsschnitte und einem klaren Überblick über den Tag. Sascha hält den Salon in ruhigem Rhythmus, damit das Team sich ganz auf das Haar konzentrieren kann.',
      en: 'Reception, bookings, coffee. Most callers and walk-ins meet Sascha first. With a friendly word, a sharp memory for names and favourite cuts, and a clear overview of the whole day. Sascha keeps the salon in a calm rhythm so that the team can focus fully on the hair in front of them.',
    },
  },
};

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function readGallery(slug) {
  const dir = path.join(process.cwd(), 'public', 'team', 'galleries', slug);
  try {
    return fs.readdirSync(dir)
      .filter((f) => EXT.has(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => `/team/galleries/${slug}/${f}`);
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return Object.keys(PEOPLE).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = PEOPLE[slug];
  if (!p) return { title: 'Isar Friseur' };
  return { title: `${p.name} - Work - Isar Friseur` };
}

export default async function StylistGallery({ params }) {
  const { slug } = await params;
  const p = PEOPLE[slug];
  if (!p) notFound();
  const images = readGallery(slug);

  return (
    <>
      <Nav/>
      <StylistView person={p} images={images}/>
      <Footer/>
    </>
  );
}
