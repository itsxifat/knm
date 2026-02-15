import './globals.css';
import 'lenis/dist/lenis.css'; // ✅ Import Lenis CSS
import { CartProvider } from '@/lib/context/CartContext';
import SessionProvider from '@/components/SessionProvider';
import FooterWrapper from '@/components/FooterWrapper';
import SmoothScrolling from '@/components/SmoothScrolling'; // ✅ Import Wrapper
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

  return (
    <html lang="en" className={`${marcellus.variable} ${tenor.variable} ${manrope.variable}`}>
      <body className="antialiased bg-background text-foreground overflow-x-hidden">
        
        {/* Google Tag Manager */}
        {gtmId && gtmServerUrl && (
          <>
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
            <noscript>
              <iframe 
                src={`${gtmServerUrl}/ns.html?id=${gtmId}`}
                height="0" 
                width="0" 
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}

        <SessionProvider>
          <CartProvider>
            {/* ✅ Wrap App in SmoothScrolling */}
            <SmoothScrolling>
              <Toaster position="top-right" reverseOrder={false} />
              <main className="min-h-screen font-body selection:bg-accent selection:text-white">
                {children}
              </main>
              <FooterWrapper />
            </SmoothScrolling>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}