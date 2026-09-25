import React, { useEffect, useState } from 'react';
import pageLoadImg from '../../assets/page load.png';

export function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('visible'); // 'visible' | 'fading' | 'gone'

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('fading'), 1800);
    const doneTimer = setTimeout(() => {
      setPhase('gone');
      onDone?.();
    }, 2300);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  if (phase === 'gone') return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: phase === 'fading' ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      <img
        src={pageLoadImg}
        alt="RS200 Garage"
        style={{
          width: '72%',
          maxWidth: 320,
          objectFit: 'contain',
          animation: 'splash-zoom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      />
      <style>{`
        @keyframes splash-zoom {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
