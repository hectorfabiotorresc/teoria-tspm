// Service worker: la plataforma funciona sin conexión después de la primera visita (decisión D6).
// HTML: red primero con respaldo en caché. Recursos con hash (JS, CSS, fuentes): caché primero.
const CACHE = "tspm-teoria-v13";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icono.svg", "./icono-192.png", "./icono-512.png", "./apple-touch-icon.png", "./manual.html", "./mapa_plataforma.html"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const esHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (esHTML) {
    // la app (index) se guarda con una sola clave; otras páginas (manual, mapa) con la suya
    const otra = /\/[^/]+\.html$/.test(url.pathname) && !url.pathname.endsWith("/index.html");
    e.respondWith(fetch(req).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(otra ? req : "./index.html", copia)); return r; }).catch(() => (otra ? caches.match(req, { ignoreSearch: true }) : Promise.resolve(undefined)).then((hit) => hit || caches.match("./index.html"))));
    return;
  }
  // narración: el audio se pide por rangos de bytes; se deja pasar a la red sin guardarlo
  if (url.pathname.includes("/narracion/") && !url.pathname.endsWith(".json")) return;
  // manifiestos (narración, subtítulos): red primero, para que las voces nuevas aparezcan sin cambiar de versión
  if (url.origin === location.origin && url.pathname.endsWith(".json")) {
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); } return r; }).catch(() => caches.match(req)));
    return;
  }
  if (url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === "opaque") { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); } return r; })));
  }
});
