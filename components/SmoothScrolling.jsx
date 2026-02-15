// components/SmoothScrolling.jsx
'use client';
import { ReactLenis } from 'lenis/react';

function SmoothScrolling({ children }) {
  const lenisOptions = {
    lerp: 1.2,        
    duration: 0.5,    
    smoothTouch: false,
    smoothWheel: true,
    // ✅ FIX: Allow the browser to paint properly during scroll
    syncTouch: true, 
  };

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}

export default SmoothScrolling;