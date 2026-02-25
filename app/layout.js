import './globals.css';
import { CartProvider } from '@/lib/context/CartContext';
import SessionProvider from '@/components/SessionProvider';
import FooterWrapper from '@/components/FooterWrapper';
import { Toaster } from 'react-hot-toast';
import { Marcellus, Tenor_Sans, Manrope } from 'next/font/google';
import Script from 'next/script';

const marcellus = Marcellus({
  weight: '400',
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
  title: 'K&M Lifestyle',
  description: 'Refined elegance for the modern gentleman.',
};

export default function RootLayout({ children }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gtmServerUrl = process.env.NEXT_PUBLIC_GTM_SERVER_URL;
  const hasGtm = gtmId && gtmServerUrl;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${marcellus.variable} ${tenor.variable} ${manrope.variable}`}
    >
      <body className="antialiased bg-background text-foreground">

        {/* FIX: GTM noscript must be the very first child of body per Google's spec */}
        {hasGtm && (
          <noscript>
            <iframe
              src={`${gtmServerUrl}/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        {/* FIX: Toaster moved OUTSIDE providers — cart/session state changes 
            no longer cause Toaster to be included in provider re-renders */}
        <Toaster position="top-right" reverseOrder={false} />

        <SessionProvider>
          <CartProvider>
            {/* FIX: Removed <main> wrapper here — each page component provides
                its own <main>. Nesting <main> inside <main> is invalid HTML
                and causes accessibility/SEO issues. */}
            <div className="min-h-screen font-body selection:bg-accent selection:text-white">
              {children}
            </div>
            <FooterWrapper />
          </CartProvider>
        </SessionProvider>

        {/* GTM script loads after page is interactive — correct placement */}
        {hasGtm && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                '${gtmServerUrl}/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
        )}

      </body>
    </html>
  );
}