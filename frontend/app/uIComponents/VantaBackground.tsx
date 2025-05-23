'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    VANTA: any;
  }
}

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    if (!scriptsLoaded || !window.VANTA) return;

    const effect = window.VANTA.CLOUDS({
      el: vantaRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      backgroundColor: 0x0,
      speed: 1.00,
      texturePath: "https://www.vantajs.com/gallery/noise.png"
    });

    return () => {
      if (effect) effect.destroy();
    };
  }, [scriptsLoaded]);

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        onLoad={() => console.log('Three.js loaded')}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js"
        onLoad={() => {
          console.log('Vanta.js loaded');
          setScriptsLoaded(true);
        }}
      />
      <div 
        ref={vantaRef} 
        className="fixed inset-0 -z-10 w-full h-full"
        style={{ minHeight: '100vh' }}
      />
    </>
  );
} 