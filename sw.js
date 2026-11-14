// La plataforma se separó en un sitio por asignatura (fundamentos-musicales, auditivo-basico, auditivo-medio, auditivo-avanzado, armonia-basica, composicion-musical).
// Este service worker reemplaza al anterior: borra su caché, se da de baja y recarga las pestañas para que lleguen a la redirección.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("tspm-teoria-")) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
