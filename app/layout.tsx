import type { Metadata } from 'next';
import { Allura, Poppins } from 'next/font/google';
import './globals.css';

const sans = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-sans', display: 'swap' });
const script = Allura({ subsets: ['latin'], weight: ['400'], variable: '--font-script', display: 'swap' });

export const metadata: Metadata = {
  title: 'Secret Garden — Floricultura',
  description: 'Buquês, flores e plantas para cada momento. Igaraçu do Tietê - SP.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
