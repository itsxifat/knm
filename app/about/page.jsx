import React from 'react';
import AboutContent from './AboutContent';

export const metadata = {
  title: 'About Us | KNM Heritage',
  description: 'The story of K&M, the High-End Retailer.',
};

export default function AboutPage() {
  return (
    <>
      {/* Note: Navbar is typically loaded in app/layout.js. 
        If you need it specifically here, you would import it here.
        For now, we render the page content.
      */}
      <AboutContent />
    </>
  );
}