import './globals.css';
import localFont from 'next/font/local';
import { LAUNCHED } from './site';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Labels: light, widely spaced geometric caps, matching the lettering in the machine artwork.
const jost = localFont({
  src: [
    { path: '../node_modules/@fontsource/jost/files/jost-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../node_modules/@fontsource/jost/files/jost-latin-500-normal.woff2', weight: '500', style: 'normal' }
  ],
  variable: '--font-label',
  display: 'swap'
});

export const metadata = {
  metadataBase: new URL('https://thegrowthmachine.co'),
  title: { default: 'The Growth Machine | Fractional Growth Leadership', template: '%s | The Growth Machine' },
  description: 'Fractional growth leadership for ambitious ecommerce, B2B, SaaS and B2B2C businesses. Diagnose what is holding growth back, design the right roadmap, execute with your team, and embed systems that last.',
  openGraph: {
    title: 'The Growth Machine',
    description: 'The growth leadership you need before you know which title to hire.',
    url: 'https://thegrowthmachine.co',
    siteName: 'The Growth Machine',
    type: 'website'
  },
  robots: LAUNCHED ? { index: true, follow: true } : { index: false, follow: false }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jost.variable}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
