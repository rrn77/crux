'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('CRUX Service Worker registrado con éxito:', registration.scope);
          })
          .catch((err) => {
            console.warn('Fallo al registrar Service Worker:', err);
          });
      });
    }
  }, []);

  return null;
}
