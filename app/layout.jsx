import './globals.css';
import { LangProvider } from './lib/i18n';

export const metadata = {
  title: 'Isar Friseur — Friseursalon im Herzen von München',
  description: 'Schneiden, Pflegen, Färben. Fraunhofer Straße 14, 80469 München. Warm, aufmerksam, freundlich. Termin online oder telefonisch.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
