// The contact page is a client component, so its metadata lives here.
export const metadata = {
  title: 'Contact',
  description: 'Book a free growth call with The Growth Machine. Tell us where your business is, and where you want to take it.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }) {
  return children;
}
