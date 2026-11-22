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
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
