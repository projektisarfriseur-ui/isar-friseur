import { Cormorant_Garamond, Mulish } from 'next/font/google';
import './globals.css';
import { LangProvider } from './lib/i18n';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const mulish = Mulish({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mulish',
  display: 'swap',
});

export const metadata = {
  title: 'Isar Friseur - Friseursalon im Herzen von München',
  description: 'Schneiden, Pflegen, Färben. Fraunhofer Straße 14, 80469 München. Warm, aufmerksam, freundlich. Termin online oder telefonisch.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={`${cormorant.variable} ${mulish.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link
          href="https://fonts.googleapis.com/css2?family=Sansation:wght@300;400;700&family=Merriweather:wght@300;400;700&family=Mozilla+Text:wght@300;400;500&family=Noto+Serif+Ottoman+Siyaq&family=Electrolize&family=Anta&family=Playfair+Display:wght@400;500;700&family=DM+Serif+Display&family=Fraunces:wght@300;400;500;700&family=Cormorant+Garamond:wght@300;400;500;700&family=Marcellus&family=Bodoni+Moda:wght@400;500;700&family=Crimson+Pro:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
