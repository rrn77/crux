'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('CRUX Service Worker registrado con éxito:', registration.scope);
        })
        .catch((err) => {
          console.warn('Fallo al registrar Service Worker:', err);
        });
    };

    // El evento "load" puede haber disparado ya antes de que React monte este efecto
    // (sobre todo si la página se sirve rápido o desde caché), así que registramos de
    // inmediato en ese caso en vez de esperar a un evento que nunca volverá a llegar.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
