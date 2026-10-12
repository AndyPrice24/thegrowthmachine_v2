import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
