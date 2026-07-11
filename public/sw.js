// Service worker mínimo: no cachea nada (la app necesita datos frescos),
// solo existe para que el navegador considere la app instalable.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
