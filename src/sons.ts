import { stockage } from './stockage'
import { cheminPublic } from './chemins'
// Les bruitages du jeu, fabriqués directement par le navigateur (Web Audio) :
// presque pas de fichier son à charger (23/10 : seul le « cha-ching » du marché est un vrai
// enregistrement, `public/sons/cash.mp3`). Chaque son est un petit mélange de « notes »
// (un oscillateur dont le volume retombe) et de « bruit » (un souffle filtré,
// pour les coups de pioche et les éboulements).
//
// Les bruitages peuvent être coupés : le réglage est gardé dans le localStorage.
// La musique et les ambiances sont dans ambiance.ts (avec leur propre réglage).

const CLE_SON = 'idle-miner-son'

let contexte: AudioContext | null = null
let sortie: GainNode | null = null
let actif = lireReglage(CLE_SON)

// Lit un réglage « actif / coupé » (actif par défaut).
export function lireReglage(cle: string): boolean {
  try {
    return stockage.getItem(cle) !== 'coupe'
  } catch {
    return true
  }
}

export function ecrireReglage(cle: string, valeur: boolean): void {
  try {
    stockage.setItem(cle, valeur ? 'actif' : 'coupe')
  } catch {
    // Tant pis, le réglage ne sera pas gardé.
  }
}

export function sonActif(): boolean {
  return actif
}

export function basculerSon(): boolean {
  actif = !actif
  ecrireReglage(CLE_SON, actif)
  return actif
}

// Le contexte audio du navigateur, partagé avec la musique (ambiance.ts).
// Le navigateur n'autorise le son qu'après un clic ou une touche du joueur :
// on le crée (ou on le réveille) à ce moment-là.
export function contexteAudio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (contexte === null) contexte = new AudioContext()
  if (contexte.state === 'suspended' && !enPause) void contexte.resume()
  return contexte
}

// (25/10) Pendant une publicité, tout le son du jeu (bruitages et musique) se tait.
let enPause = false
export function couperPourPub(muet: boolean): void {
  enPause = muet
  if (!contexte) return
  if (muet) void contexte.suspend()
  else void contexte.resume()
}

// Le contexte, seulement si les bruitages sont actifs.
function audio(): AudioContext | null {
  if (!actif) return null
  const ctx = contexteAudio()
  if (ctx && sortie === null) {
    sortie = ctx.createGain()
    sortie.gain.value = 0.5 // volume des bruitages
    sortie.connect(ctx.destination)
  }
  return ctx
}

// Fonctions appelées au premier clic ou à la première touche (la musique s'y branche).
const auReveil: (() => void)[] = []
export function quandLeSonEstPermis(action: () => void): void {
  auReveil.push(action)
}

if (typeof window !== 'undefined') {
  const reveiller = () => {
    if (!contexteAudio()) return
    for (const action of auReveil) action()
  }
  window.addEventListener('pointerdown', reveiller)
  window.addEventListener('keydown', reveiller)
}

type OptionsNote = {
  type?: OscillatorType
  volume?: number
  vers?: number // fréquence d'arrivée (pour un son qui glisse)
}

// Une note qui commence dans `debut` secondes et s'éteint en `duree` secondes.
function note(frequence: number, debut: number, duree: number, options: OptionsNote = {}) {
  const ctx = audio()
  if (!ctx || !sortie) return
  const t = ctx.currentTime + debut
  const oscillateur = ctx.createOscillator()
  const volume = ctx.createGain()
  oscillateur.type = options.type ?? 'sine'
  oscillateur.frequency.setValueAtTime(frequence, t)
  if (options.vers) oscillateur.frequency.exponentialRampToValueAtTime(options.vers, t + duree)
  volume.gain.setValueAtTime(0.0001, t)
  volume.gain.exponentialRampToValueAtTime(options.volume ?? 0.3, t + 0.008)
  volume.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  oscillateur.connect(volume).connect(sortie)
  oscillateur.start(t)
  oscillateur.stop(t + duree + 0.02)
}

type OptionsBruit = {
  volume?: number
  filtre?: BiquadFilterType
  frequence?: number
  vers?: number // (23/10) fréquence d'arrivée du filtre (un souffle qui glisse : tiroir, élan)
  q?: number // (23/10) la finesse du filtre (plus grand : un son plus « sifflé »)
}

// Un souffle (bruit blanc filtré) : coups, éboulements, lave qui siffle...
function bruit(debut: number, duree: number, options: OptionsBruit = {}) {
  const ctx = audio()
  if (!ctx || !sortie) return
  const t = ctx.currentTime + debut
  const echantillons = Math.ceil(ctx.sampleRate * duree)
  const tampon = ctx.createBuffer(1, echantillons, ctx.sampleRate)
  const donnees = tampon.getChannelData(0)
  for (let i = 0; i < echantillons; i++) donnees[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = tampon
  const filtre = ctx.createBiquadFilter()
  filtre.type = options.filtre ?? 'lowpass'
  filtre.frequency.setValueAtTime(options.frequence ?? 1200, t)
  if (options.vers) filtre.frequency.exponentialRampToValueAtTime(options.vers, t + duree)
  if (options.q) filtre.Q.value = options.q
  const volume = ctx.createGain()
  volume.gain.setValueAtTime(options.volume ?? 0.3, t)
  volume.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  source.connect(filtre).connect(volume).connect(sortie)
  source.start(t)
  source.stop(t + duree + 0.02)
}

// (23/10) Le « cha-ching » du marché : un vrai enregistrement (`public/sons/cash.mp3`, coupé
// autour du bruit de la caisse). Il est chargé une seule fois, au premier son du jeu ; en
// attendant (ou sans réseau), c'est la caisse fabriquée (sons.vente) qui sonne.
const FICHIER_CASH = cheminPublic('/sons/cash.mp3')
let tamponCash: AudioBuffer | null = null
let chargementCash: Promise<void> | null = null
let dernierCash = 0 // l'heure du dernier « cha-ching » (pour ne pas en empiler dix d'un coup)

function chargerCash(ctx: AudioContext): void {
  if (chargementCash) return
  chargementCash = fetch(FICHIER_CASH)
    .then((reponse) => reponse.arrayBuffer())
    .then((octets) => ctx.decodeAudioData(octets))
    .then((tampon) => {
      tamponCash = tampon
    })
    .catch(() => {
      chargementCash = null // on réessaiera la prochaine fois
    })
}

// On le charge dès le premier clic du joueur, pour qu'il soit prêt à la première vente.
quandLeSonEstPermis(() => {
  const ctx = contexteAudio()
  if (ctx) chargerCash(ctx)
})

// Joue le « cha-ching ». Renvoie faux s'il n'est pas encore chargé.
function jouerCash(volume: number): boolean {
  const ctx = audio()
  if (!ctx || !sortie) return true // son coupé : rien à jouer
  chargerCash(ctx)
  if (!tamponCash) return false
  // Plusieurs wagonnets qui vendent en même temps : un seul « cha-ching ».
  if (ctx.currentTime - dernierCash < 0.4) return true
  dernierCash = ctx.currentTime
  const source = ctx.createBufferSource()
  source.buffer = tamponCash
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.connect(gain).connect(sortie)
  source.start()
  return true
}

// La série de minerais (pour la note qui monte) : une gamme pentatonique, toujours jolie.
const GAMME_SERIE = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637]
let serieMinerais = 0
let dernierMinerai = 0

// Un petit écart au hasard, pour que deux coups de pioche ne sonnent pas pareil.
function varier(valeur: number, ecart = 0.08): number {
  return valeur * (1 - ecart + Math.random() * 2 * ecart)
}

// ---------------------------------------------------------------------------
// Les sons du jeu
// ---------------------------------------------------------------------------

// (27/10) Le dernier crépitement des feux d'artifice (voir sons.crepitement).
let dernierCrepitement = 0

export const sons = {
  // Un coup de pioche sur le bloc (avec une pioche cassée, le premier des deux clics). (23/10)
  // Trois couches : le « tchk » sec du fer qui frappe, le petit tintement du métal, et le « toc »
  // sourd de la roche. Un peu différent à chaque coup.
  coup() {
    bruit(0, 0.035, { filtre: 'highpass', frequence: varier(3800, 0.15), volume: 0.28 })
    note(varier(1350, 0.12), 0, 0.07, { type: 'triangle', volume: 0.07, vers: 900 })
    note(varier(140, 0.1), 0, 0.09, { type: 'sine', volume: 0.3, vers: 60 })
  },

  // Le bloc qui se casse (23/10) : un « crac » net, puis des cailloux qui roulent (quelques petits
  // éclats l'un après l'autre) et un « boum » grave, plus lourd pour la roche dure.
  casse(dur: boolean) {
    bruit(0, 0.06, { filtre: 'bandpass', frequence: varier(dur ? 1500 : 2200), volume: 0.42, q: 0.8 })
    note(varier(dur ? 85 : 115), 0, 0.16, { type: 'sine', volume: 0.32, vers: 40 })
    const cailloux = 3 + Math.floor(Math.random() * 3)
    for (let i = 0; i < cailloux; i++) {
      bruit(0.04 + i * 0.035 + Math.random() * 0.02, 0.04, { filtre: 'bandpass', frequence: varier(dur ? 1800 : 2600, 0.3), volume: 0.12, q: 2 })
    }
    bruit(0.02, 0.22, { filtre: 'lowpass', frequence: varier(dur ? 500 : 800), vers: 150, volume: 0.18 })
  },

  // Un minerai ordinaire qui tombe dans le sac : « plink ». Quand on en trouve plusieurs
  // à la suite (moins de 4 s entre deux), la note monte d'un cran à chaque fois, comme
  // une gamme : on a envie de continuer la série !
  minerai() {
    const maintenant = performance.now()
    serieMinerais = maintenant - dernierMinerai < 4000 ? serieMinerais + 1 : 0
    dernierMinerai = maintenant
    const frequence = GAMME_SERIE[Math.min(serieMinerais, GAMME_SERIE.length - 1)]
    note(frequence, 0.02, 0.12, { type: 'triangle', volume: 0.12 })
    // Au sommet de la gamme : un petit écho brillant en plus.
    if (serieMinerais >= GAMME_SERIE.length - 1) note(frequence * 2, 0.06, 0.15, { type: 'sine', volume: 0.05 })
  },

  // Une amélioration achetée : trois notes qui montent, « niveau supérieur ! ».
  amelioration() {
    ;[523, 659, 784].forEach((f, i) => note(f, i * 0.06, 0.16, { type: 'square', volume: 0.06 }))
    note(1047, 0.18, 0.45, { type: 'triangle', volume: 0.14 })
    note(2093, 0.2, 0.3, { type: 'sine', volume: 0.05 })
    sons.pieces(2, 0.02)
  },

  // Un minerai rare (diamant, émeraude...) : une petite pluie d'étincelles qui monte.
  rare() {
    const notes = [1047, 1319, 1568, 2093, 2637]
    notes.forEach((f, i) => note(f, 0.05 + i * 0.06, 0.35, { type: 'sine', volume: 0.16 }))
    notes.forEach((f, i) => note(f * 2, 0.08 + i * 0.06, 0.2, { type: 'triangle', volume: 0.05 }))
  },


  // Des pièces qui tintent l'une après l'autre (23/10 : un « tic » métallique et deux harmoniques
  // aiguës qui ne tombent pas juste, comme des vraies pièces).
  pieces(nombre: number, debut = 0) {
    for (let i = 0; i < nombre; i++) {
      const t = debut + i * 0.05 + Math.random() * 0.03
      const f = varier(3200, 0.12)
      bruit(t, 0.015, { filtre: 'highpass', frequence: 6000, volume: 0.1 })
      note(f, t, 0.14, { type: 'sine', volume: 0.07 })
      note(f * 1.47, t, 0.1, { type: 'sine', volume: 0.04 })
      note(f * 2.31, t, 0.06, { type: 'square', volume: 0.012 })
    }
  },

  // La caisse enregistreuse du marché (23/10) : les touches (« clac clac »), le tiroir qui
  // s'ouvre (un souffle qui glisse et un « tchonk »), la sonnette « ding ! » (une cloche, avec ses
  // harmoniques qui résonnent), puis les pièces qui tombent dans le tiroir : d'autant plus que la
  // vente est grosse.
  vente(montant: number) {
    bruit(0, 0.025, { filtre: 'bandpass', frequence: 2500, volume: 0.2, q: 3 })
    bruit(0.06, 0.025, { filtre: 'bandpass', frequence: 2200, volume: 0.18, q: 3 })
    bruit(0.12, 0.12, { filtre: 'bandpass', frequence: 900, vers: 2500, volume: 0.16, q: 1.5 })
    note(160, 0.22, 0.12, { type: 'sine', volume: 0.32, vers: 70 })
    bruit(0.22, 0.04, { filtre: 'lowpass', frequence: 1200, volume: 0.25 })
    // « Ding ! » : une cloche (des harmoniques qui ne tombent pas juste, comme une vraie cloche).
    note(2637, 0.2, 1.1, { type: 'sine', volume: 0.16 })
    note(2637 * 2.76, 0.2, 0.5, { type: 'sine', volume: 0.05 })
    note(2637 * 5.4, 0.2, 0.25, { type: 'sine', volume: 0.025 })
    note(3951, 0.2, 0.7, { type: 'sine', volume: 0.06 })
    const nombre = Math.min(14, 3 + Math.floor(Math.log10(Math.max(1, montant)) * 2.5))
    sons.pieces(nombre, 0.3)
  },

  // Un bonus de combo qui démarre (Fortune, Double coup, Frénésie... ; 23/10) : un élan qui monte
  // (un souffle qui glisse vers l'aigu et une note qui grimpe), puis un accord magique qui scintille,
  // plus long et plus brillant pour les gros bonus (rang 0 à 5).
  bonus(rang: number) {
    const r = Math.max(0, Math.min(5, rang))
    bruit(0, 0.3, { filtre: 'bandpass', frequence: 500, vers: 6000, volume: 0.12, q: 2 })
    note(392, 0, 0.3, { type: 'triangle', volume: 0.1, vers: 1568 })
    const accord = [1047, 1319, 1568, 2093, 2637, 3136].slice(0, 3 + Math.ceil(r / 2))
    accord.forEach((f, i) => {
      note(f, 0.28 + i * 0.045, 0.6 + r * 0.08, { type: 'sine', volume: 0.09 })
      note(f * 2, 0.3 + i * 0.045, 0.25, { type: 'triangle', volume: 0.025 })
    })
    // Des étincelles qui scintillent.
    for (let i = 0; i < 4 + r * 2; i++) note(varier(4200, 0.25), 0.35 + i * 0.05 + Math.random() * 0.03, 0.08, { type: 'sine', volume: 0.035 })
    if (r >= 3) note(130.8, 0.28, 0.5, { type: 'sine', volume: 0.2 })
  },

  // La fortune : le clic a doublé un minerai (23/10) : un « ding-ding » joyeux qui monte, avec deux
  // pièces et un scintillement : la chance !
  fortune() {
    note(1568, 0.03, 0.16, { type: 'triangle', volume: 0.1 })
    note(2349, 0.09, 0.28, { type: 'triangle', volume: 0.12 })
    note(4698, 0.09, 0.2, { type: 'sine', volume: 0.03 })
    bruit(0.08, 0.2, { filtre: 'highpass', frequence: 7000, volume: 0.05 })
    sons.pieces(2, 0.14)
  },

  // Un wagonnet vend son chargement au marché (27/10) : le « cha-ching » enregistré (23/10, il
  // remplace la cloche et la cascade de pièces), un peu plus fort pour les grosses ventes.
  venteMarche(montant: number) {
    if (jouerCash(montant >= 1000 ? 1 : 0.8)) return
    // Pas encore chargé : la caisse fabriquée, comme avant.
    sons.vente(montant)
  },

  // Un achat : « pop » puis deux notes qui montent.
  achat() {
    note(523, 0, 0.1, { type: 'triangle', volume: 0.15 })
    note(784, 0.08, 0.18, { type: 'triangle', volume: 0.15 })
    sons.pieces(2, 0.02)
  },

  // Un succès débloqué : petite fanfare.
  succes() {
    ;[784, 988, 1175, 1568].forEach((f, i) => note(f, i * 0.09, i === 3 ? 0.5 : 0.15, { type: 'triangle', volume: 0.14 }))
  },

  // (23/10) La fête du niveau : un « tic » qui monte à chaque niveau du compteur...
  ticNiveau(rang: number) {
    note(660 + rang * 90, 0, 0.09, { type: 'square', volume: 0.06 })
  },

  // ... puis la grande fanfare : un arpège qui monte, un accord brillant et des pièces.
  niveauGagne() {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.07, 0.22, { type: 'triangle', volume: 0.14 }))
    ;[1047, 1319, 1568, 2093].forEach((f) => note(f, 0.38, 1.1, { type: 'triangle', volume: 0.07 }))
    for (let i = 0; i < 6; i++) note(varier(2400 + i * 220, 0.05), 0.45 + i * 0.07, 0.2, { type: 'sine', volume: 0.05 })
    sons.pieces(4, 0.4)
  },

  // Chaque déblocage qui arrive dans la liste : un petit « ding », un peu plus haut à chaque fois.
  ligneDeblocage(rang: number) {
    const gamme = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637]
    note(gamme[(rang - 1) % gamme.length], 0, 0.18, { type: 'triangle', volume: 0.1 })
  },

  // Le recruteur cherche un mineur : un roulement de tambour qui accélère et monte (1,6 s).
  suspenseRecrue() {
    let t = 0
    for (let i = 0; i < 18; i++) {
      bruit(t, 0.06, { filtre: 'bandpass', frequence: 260 + i * 25, volume: 0.12 + i * 0.012 })
      note(110 + i * 9, t, 0.07, { type: 'triangle', volume: 0.06 + i * 0.004 })
      t += 0.13 - i * 0.0055 // de plus en plus vite
    }
  },

  // La rareté dévoilée : plus le mineur est rare, plus la fanfare est grande
  // (rang 0 = commun, 4 = mythique).
  revelationRecrue(rang: number) {
    const gamme = [523, 659, 784, 1047, 1319, 1568, 2093]
    const nbNotes = 2 + rang
    gamme.slice(0, nbNotes).forEach((f, i) => note(f, i * 0.07, 0.35, { type: 'triangle', volume: 0.12 }))
    if (rang >= 1) sons.pieces(2 + rang * 2, 0.1)
    if (rang >= 2) [1047, 1319, 1568].forEach((f) => note(f, nbNotes * 0.07, 0.9, { type: 'sine', volume: 0.08 }))
    if (rang >= 3) {
      // Légendaire et mythique : un accord éclatant et une pluie d'étincelles.
      ;[784, 988, 1175, 1568].forEach((f) => note(f, nbNotes * 0.07 + 0.15, 1.3, { type: 'triangle', volume: 0.08 }))
      for (let i = 0; i < 8; i++) note(varier(2600 + i * 180, 0.05), 0.5 + i * 0.06, 0.25, { type: 'sine', volume: 0.05 })
    }
    if (rang >= 4) {
      bruit(0, 0.5, { filtre: 'highpass', frequence: 4000, volume: 0.12 })
      ;[523, 659, 784, 1047].forEach((f) => note(f / 2, 0.9, 1.6, { type: 'sawtooth', volume: 0.025 }))
    }
  },

  // La pioche qui casse : un « clang » triste.
  piocheCassee() {
    note(330, 0, 0.3, { type: 'sawtooth', volume: 0.08, vers: 160 })
    bruit(0, 0.12, { filtre: 'bandpass', frequence: 3000, volume: 0.15 })
  },

  // --- Le village (23/10) ---

  // Un pas dans l'herbe : un petit froissement doux (gauche, droite : un peu différents).
  pas() {
    bruit(0, 0.07, { filtre: 'bandpass', frequence: varier(900, 0.25), volume: 0.05 })
    note(varier(140, 0.15), 0, 0.05, { type: 'sine', volume: 0.03, vers: 90 })
  },

  // On construit un bâtiment : trois coups de marteau sur du bois, puis une petite fanfare.
  construction() {
    for (let i = 0; i < 3; i++) {
      bruit(i * 0.16, 0.06, { filtre: 'bandpass', frequence: varier(1400, 0.1), volume: 0.28 })
      note(varier(220, 0.05), i * 0.16, 0.08, { type: 'triangle', volume: 0.18, vers: 120 })
    }
    ;[523, 659, 784].forEach((f, i) => note(f, 0.55 + i * 0.07, 0.25, { type: 'triangle', volume: 0.1 }))
  },

  // On pose un rail : un « clang » de métal, et la traverse en bois.
  rail() {
    note(varier(880, 0.06), 0, 0.18, { type: 'square', volume: 0.04, vers: 620 })
    note(varier(1320, 0.06), 0, 0.12, { type: 'sine', volume: 0.06 })
    bruit(0, 0.05, { filtre: 'lowpass', frequence: 700, volume: 0.15 })
  },

  // Le wagonnet passe sur un joint de rail : « ta-tac », plus doux s'il est loin.
  wagonnet(volume = 1) {
    bruit(0, 0.035, { filtre: 'bandpass', frequence: varier(2200, 0.1), volume: 0.06 * volume })
    bruit(0.07, 0.035, { filtre: 'bandpass', frequence: varier(1900, 0.1), volume: 0.05 * volume })
    note(varier(180, 0.1), 0, 0.05, { type: 'triangle', volume: 0.03 * volume, vers: 110 })
  },

  // Le wagonnet arrive au marché : une petite cloche.
  cloche() {
    note(1568, 0, 0.6, { type: 'sine', volume: 0.12 })
    note(3136, 0, 0.3, { type: 'sine', volume: 0.03 })
    note(1318, 0.18, 0.7, { type: 'sine', volume: 0.1 })
  },

  // Le générateur reçoit de la redstone : un grésillement électrique qui monte.
  electricite() {
    note(120, 0, 0.35, { type: 'sawtooth', volume: 0.05, vers: 480 })
    bruit(0.05, 0.25, { filtre: 'highpass', frequence: 3500, volume: 0.08 })
  },

  // (27/10) La restauration du château : la ruine gronde et tremble (1,6 s), puis un « whoosh » qui
  // monte, un grand coup de cymbale et une fanfare royale.
  restaurationChateau() {
    bruit(0, 1.6, { filtre: 'lowpass', frequence: 160, vers: 420, volume: 0.35 })
    for (let i = 0; i < 8; i++) bruit(i * 0.18, 0.12, { filtre: 'bandpass', frequence: varier(600, 0.3), volume: 0.12 })
    bruit(1.1, 0.5, { filtre: 'bandpass', frequence: 400, vers: 5000, q: 2, volume: 0.18 })
    bruit(1.6, 1.4, { filtre: 'highpass', frequence: 4000, volume: 0.16 })
    // La fanfare : do mi sol do, puis un grand accord tenu.
    ;[523, 659, 784, 1047].forEach((f, i) => note(f, 1.65 + i * 0.13, 0.28, { type: 'square', volume: 0.07 }))
    ;[523, 659, 784, 1047, 1319].forEach((f) => note(f, 2.2, 1.6, { type: 'triangle', volume: 0.08 }))
    for (let i = 0; i < 8; i++) note(varier(2600 + i * 180, 0.05), 2.3 + i * 0.06, 0.25, { type: 'sine', volume: 0.04 })
  },

  // (27/10) Une fusée de feu d'artifice qui part : un sifflement qui monte, et un souffle.
  fusee() {
    note(varier(700, 0.15), 0, 0.9, { type: 'sine', volume: 0.018, vers: 2400 })
    bruit(0, 0.5, { filtre: 'bandpass', frequence: 1800, vers: 4000, q: 1.5, volume: 0.05 })
  },

  // (27/10) La gerbe qui éclate : un « boum » sourd et profond, plus ou moins fort, avec son écho.
  explosion(force = 1) {
    const volume = varier(0.4, 0.2) * force
    note(varier(70, 0.15), 0, 0.6, { type: 'sine', volume: volume * 0.6, vers: 35 })
    bruit(0, 0.9, { filtre: 'lowpass', frequence: 1400, vers: 90, volume })
    bruit(0.25, 0.8, { filtre: 'lowpass', frequence: 500, vers: 80, volume: volume * 0.25 })
  },

  // (27/10) Les étincelles qui pétillent (une gerbe « crépitement ») : au plus une fois tous les
  // dixièmes de seconde, même si beaucoup d'étincelles pétillent en même temps.
  crepitement() {
    const maintenant = performance.now()
    if (maintenant - dernierCrepitement < 100) return
    dernierCrepitement = maintenant
    for (let i = 0; i < 10; i++) bruit(i * 0.035 + Math.random() * 0.03, 0.03, { filtre: 'highpass', frequence: 4500, volume: 0.06 + Math.random() * 0.05 })
  },
}