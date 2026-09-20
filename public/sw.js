// CRUX requiere conexión a Supabase para leer y guardar datos: este Service Worker
// ya no cachea páginas ni datos para uso sin conexión, solo permite que la PWA sea instalable.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Al tocar la notificación del temporizador de entrenamiento, enfocar o abrir CRUX
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/workout/active');
      }
    })
  );
});
