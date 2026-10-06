/*
 * Service worker do Portal Perfin.
 * Regra de segurança: só arquivos estáticos e públicos vão para o cache do aparelho.
 * Páginas, /api, dados do usuário, do admin, do Google e do assistente NUNCA são guardados.
 */
const VERSAO = "portal-perfin-v1";
const CACHE_ESTATICO = `${VERSAO}-estatico`;
const PAGINA_OFFLINE = "/offline";
const PRE_CACHE = [PAGINA_OFFLINE, "/manifest.webmanifest", "/icons/icone-192.png", "/icons/icone-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE_ESTATICO).then((cache) => cache.addAll(PRE_CACHE)));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data === "atualizar") self.skipWaiting();
  if (evento.data === "limpar-cache") {
    evento.waitUntil(caches.keys().then((nomes) => Promise.all(nomes.map((n) => caches.delete(n)))));
  }
});

function ehEstaticoPublico(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest")
  );
}

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    // Navegação: sempre rede (sem cache). Sem conexão, mostra a página offline.
    evento.respondWith(fetch(request).catch(() => caches.match(PAGINA_OFFLINE)));
    return;
  }

  if (!ehEstaticoPublico(url)) return;

  evento.respondWith(
    caches.match(request).then(
      (emCache) =>
        emCache ||
        fetch(request).then((resposta) => {
          if (resposta.ok && !resposta.headers.has("Set-Cookie")) {
            const copia = resposta.clone();
            caches.open(CACHE_ESTATICO).then((cache) => cache.put(request, copia));
          }
          return resposta;
        }),
    ),
  );
});
