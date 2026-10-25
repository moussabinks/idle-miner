// Le « service worker » de Mega Digger : un petit programme que le navigateur garde à côté
// du jeu. Il range les fichiers du jeu dans un cache, pour que le jeu s'ouvre vite et
// marche même sans réseau (dans le métro, en avion...).
//
// - La page (index.html) : on demande d'abord au serveur (pour avoir la dernière version
//   après une mise à jour), et on prend celle du cache si le réseau ne répond pas.
// - Les fichiers de /assets/ : leur nom change à chaque version (index-AbC123.js), donc
//   une fois rangés ils ne changent plus : on les prend directement dans le cache.
// - Les autres fichiers du site (icônes, manifeste, images du village) : le cache d'abord, puis on le met à jour.
// - Supabase (comptes, classement) n'est jamais mis en cache : ce n'est pas notre site.

const CACHE = 'idle-miner-v73'
// (25/10) Les chemins sont relatifs au dossier du jeu (il peut être servi dans un sous-dossier).
// On ne range d'avance que le strict nécessaire ; les images (bâtiments, personnages, arbres,
// rails) sont rangées la première fois qu'elles sont chargées (cachePuisMiseAJour) : la liste ne
// casse plus quand une image change de nom.
const BASE = new URL('./', self.location.href).pathname
const FICHIERS_DE_BASE = ['', 'manifest.webmanifest', 'fonts/icones-mega.woff2', 'favicon.svg', 'sons/cash.mp3', 'icones/icone-192.png', 'icones/icone-512.png'].map((f) => BASE + f)

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FICHIERS_DE_BASE)))
  self.skipWaiting() // la nouvelle version prend la main tout de suite
})

// On efface les caches des anciennes versions de ce fichier.
self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== CACHE).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  )
})

// Une nouvelle version du jeu est arrivée : on retire du cache les fichiers de /assets/
// que la nouvelle page n'utilise plus (sinon chaque mise à jour en ajouterait).
async function nettoyerAnciensFichiers(cache, page) {
  const html = await page.text()
  for (const requete of await cache.keys()) {
    const chemin = new URL(requete.url).pathname
    if (chemin.startsWith(BASE + 'assets/') && !html.includes(chemin.slice(BASE.length))) await cache.delete(requete)
  }
}

async function reseauDAbord(requete) {
  const cache = await caches.open(CACHE)
  try {
    const reponse = await fetch(requete)
    if (reponse.ok) {
      await cache.put(BASE, reponse.clone()) // on garde la dernière page reçue
      nettoyerAnciensFichiers(cache, reponse.clone())
    }
    return reponse
  } catch {
    return (await cache.match(BASE)) ?? Response.error()
  }
}

async function cacheDAbord(requete) {
  const cache = await caches.open(CACHE)
  const enCache = await cache.match(requete)
  if (enCache) return enCache
  const reponse = await fetch(requete)
  if (reponse.ok) cache.put(requete, reponse.clone())
  return reponse
}

async function cachePuisMiseAJour(requete) {
  const cache = await caches.open(CACHE)
  const enCache = await cache.match(requete)
  const miseAJour = fetch(requete)
    .then((reponse) => {
      if (reponse.ok) cache.put(requete, reponse.clone())
      return reponse
    })
    .catch(() => enCache ?? Response.error())
  return enCache ?? miseAJour
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  const adresse = new URL(requete.url)
  // Seulement les lectures (GET) de notre propre site.
  if (requete.method !== 'GET' || adresse.origin !== self.location.origin) return

  if (requete.mode === 'navigate') evenement.respondWith(reseauDAbord(requete))
  else if (adresse.pathname.startsWith(BASE + 'assets/')) evenement.respondWith(cacheDAbord(requete))
  else evenement.respondWith(cachePuisMiseAJour(requete))
})
