export const PEOPLE = [
  {
    slug: 'gulay',
    name: 'Gülay',
    role: { de: 'Friseurmeisterin', en: 'Master Stylist' },
    photo: '/team/gulay.jpg',
    bio: {
      de: 'Über zwanzig Jahre am Stuhl, davon viele in den feinsten Salons der Stadt. Ihr Schwerpunkt sind präzise Schnitte für feines Haar und klare Pixie-Linien, die wirklich sitzen. Sie arbeitet mit ruhiger Hand und gibt eine klare, ehrliche Beratung. Sie sagt dir offen, was funktioniert, was deinem Haartyp guttut und was du besser sein lässt.',
      en: 'Over twenty years at the chair, many of them in the finest salons in the city. Her focus is precise cuts for fine hair and clean pixie lines that genuinely hold their shape. She works with a calm hand and gives clear, grounded advice. She will tell you honestly what suits you, what your hair can handle, and where it is wiser to hold back.',
    },
  },
  {
    slug: 'paula',
    name: 'Paula',
    role: { de: 'Friseurmeisterin', en: 'Master Stylist' },
    photo: '/team/paula.jpg',
    bio: {
      de: 'Paula ist unsere Spezialistin für Balayage und Foliensträhnen. Sie liebt natürliche Übergänge, warme sonnengeküsste Töne und kühle, klare Blondnuancen. Aus jeder Haarlänge holt sie das Beste heraus, mit Geduld und einem feinen Auge für Proportion. Wer einmal bei ihr saß, kommt für die Pflege und die Beratung immer wieder zurück.',
      en: 'Paula is our balayage and foil highlights specialist. She loves natural transitions, warm sun-kissed tones and clean, cool blonde nuances. She gets the very best out of every hair length, with patience and a fine eye for proportion. Once you have sat in her chair, you tend to come back for the care and the conversation just as much as the colour.',
    },
  },
  {
    slug: 'karam',
    name: 'Karam',
    role: { de: 'Friseur', en: 'Stylist' },
    photo: '/team/karam.jpg',
    bio: {
      de: 'Karam ist unser Mann für Herrenschnitte, saubere Fades und exakte Bartkonturen. Er arbeitet schnell, sicher und mit einem feinen Auge für Proportion und Gesichtsform. Lockiges Haar ist seine zweite Leidenschaft. Er weiß genau, wie man Textur richtig herausarbeitet, ohne Volumen zu verlieren. Wer einen ehrlichen, modernen Look will, ist bei ihm richtig.',
      en: 'Karam is our man for men\'s cuts, clean fades and sharp beard contours. He works fast and confident, with a sharp eye for proportion and face shape. Curly hair is his second love. He knows exactly how to bring out texture without losing volume. If you want an honest, modern look, you are in the right chair.',
    },
  },
  {
    slug: 'gjent',
    name: 'Gjent',
    role: { de: 'Friseur', en: 'Stylist' },
    photo: '/team/gjent.jpg',
    bio: {
      de: 'Gjent ist ein Allrounder mit Vorliebe für klassische Linien und moderne Texturen. Long-Bob, Shag und weiche Layer gehören zu seinen Spezialitäten. Er hört genau zu, fragt nach Alltag, Routine und Pflege, bevor er die Schere ansetzt. Das Ergebnis ist ein Schnitt, der zu Hause genauso gut funktioniert wie direkt nach dem Termin.',
      en: 'Gjent is an all-round cutter with a soft spot for classic lines and modern texture. Long bob, shag and soft layers are his specialities. He listens carefully and asks about your daily routine and styling habits before he touches the scissors. The result is a cut that works at home just as well as it does the moment you leave the salon.',
    },
  },
  {
    slug: 'haji',
    name: 'Haji',
    role: { de: 'Friseur', en: 'Stylist' },
    photo: '/team/haji.jpg',
    bio: {
      de: 'Haji spricht Deutsch, Englisch und Türkçe und macht es jedem leicht, sich verstanden zu fühlen. Er schneidet Herren und Damen gleichermaßen und passt seinen Stil an die Person an, nicht umgekehrt. Geduldig, ruhig und freundlich, perfekt für den ersten Salon-Besuch. Auch sensible Haarstrukturen und neue Stile sind bei ihm in besten Händen.',
      en: 'Haji speaks German, English and Türkçe, and makes it easy for everyone to feel understood. He cuts men and women alike and adapts his style to the person in front of him, never the other way round. Patient, calm and warm, ideal for a first salon visit. Sensitive hair textures and brand-new looks are equally safe in his hands.',
    },
  },
  {
    slug: 'khalid',
    name: 'Khalid',
    role: { de: 'Friseur', en: 'Stylist' },
    photo: null,
    bio: {
      de: 'Khalid ist Spezialist für strukturierte Kurzhaarschnitte und detaillierte Bartkonturen. Er arbeitet konzentriert, präzise und mit großem Respekt vor jedem Millimeter. Was bei ihm besonders gut gelingt, sind klare Linien, scharfe Kanten und saubere Übergänge. Wer einen Look mit klarer Handschrift will, sitzt bei ihm richtig.',
      en: 'Khalid is a specialist in structured short cuts and detailed beard contours. He works focused, precise and with deep respect for every millimetre. What he does especially well are clean lines, sharp edges and seamless transitions. If you want a look with a clear signature, his chair is the place to sit.',
    },
  },
  {
    slug: 'sascha',
    name: 'Sascha',
    role: { de: 'Team', en: 'Team' },
    photo: null,
    bio: {
      de: 'Empfang, Termine, Kaffee. Wer anruft oder reinkommt, landet meist zuerst bei Sascha. Mit einem freundlichen Wort, einem guten Gedächtnis für Namen und Lieblingsschnitte und einem klaren Überblick über den Tag. Sascha hält den Salon in ruhigem Rhythmus, damit das Team sich ganz auf das Haar konzentrieren kann.',
      en: 'Reception, bookings, coffee. Most callers and walk-ins meet Sascha first. With a friendly word, a sharp memory for names and favourite cuts, and a clear overview of the whole day. Sascha keeps the salon in a calm rhythm so that the team can focus fully on the hair in front of them.',
    },
  },
];

export function findPerson(name) {
  if (!name) return null;
  const n = String(name).toLowerCase().trim();
  return PEOPLE.find(p => p.name.toLowerCase() === n || p.slug === n) || null;
}
