import './globals.css';
import Navbar from '@/components/Navbar';
import { CartProvider } from '@/lib/context/CartContext';
import SessionProvider from '@/components/SessionProvider';
import FooterWrapper from '@/components/FooterWrapper';
import { Toaster } from 'react-hot-toast';
// Marcellus is "refined and charming," perfect for heritage headings.
// Tenor Sans is designed for body text and headlines in fashion.
import { Marcellus, Tenor_Sans, Manrope } from 'next/font/google';

const marcellus = Marcellus({
  weight: '400', // Marcellus only comes in 400, which is perfect for that clean look
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
});

const tenor = Tenor_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-tenor',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata = {
  title: 'KNM | Heritage Panjabi',
  description: 'Refined elegance for the modern gentleman.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${marcellus.variable} ${tenor.variable} ${manrope.variable}`}>
      <body className="antialiased bg-background text-foreground overflow-x-hidden">
        <SessionProvider>
          <CartProvider>
            <Toaster position="top-right" reverseOrder={false} />
            <main className="min-h-screen font-body selection:bg-accent selection:text-white">
              {children}
            </main>
            <FooterWrapper />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}