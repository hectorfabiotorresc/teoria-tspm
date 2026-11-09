// Service worker: la plataforma funciona sin conexión después de la primera visita (decisión D6).
// HTML: red primero con respaldo en caché. Recursos con hash (JS, CSS, fuentes): caché primero.
const CACHE = "tspm-teoria-v36";
// las muestras del piano no cambian entre versiones: caché propia que sobrevive a las actualizaciones (se bajan una sola vez)
const PIANO = "tspm-piano-v1";
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./icono.svg", "./icono-192.png", "./icono-512.png", "./apple-touch-icon.png", "./manual.html", "./mapa_plataforma.html"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== PIANO).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const esHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (esHTML) {
    // cada app (la completa y las de cada curso, una por carpeta) se guarda con la clave de su carpeta; otras páginas con la suya
    const otra = /\/[^/]+\.html$/.test(url.pathname) && !url.pathname.endsWith("/index.html");
    const clave = otra ? req : new URL(url.pathname.replace(/index\.html$/, "") + "index.html", url.origin).href;
    e.respondWith(fetch(req).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(clave, copia)); return r; }).catch(() => caches.match(clave, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html"))));
    return;
  }
  if (url.origin === location.origin && url.pathname.includes("/piano/")) {
    e.respondWith(caches.open(PIANO).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
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
