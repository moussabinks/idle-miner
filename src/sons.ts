// Les bruitages du jeu, fabriqués directement par le navigateur (Web Audio) :
// pas de fichier son à charger. Chaque son est un petit mélange de « notes »
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
    return window.localStorage.getItem(cle) !== 'coupe'
  } catch {
    return true
  }
}

export function ecrireReglage(cle: string, valeur: boolean): void {
  try {
    window.localStorage.setItem(cle, valeur ? 'actif' : 'coupe')
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
  if (contexte.state === 'suspended') void contexte.resume()
  return contexte
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
  filtre.frequency.value = options.frequence ?? 1200
  const volume = ctx.createGain()
  volume.gain.setValueAtTime(options.volume ?? 0.3, t)
  volume.gain.exponentialRampToValueAtTime(0.0001, t + duree)
  source.connect(filtre).connect(volume).connect(sortie)
  source.start(t)
  source.stop(t + duree + 0.02)
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

export const sons = {
  // Un coup de pioche sur le bloc (avec une pioche cassée, le premier des deux clics) : « tac ».
  coup() {
    bruit(0, 0.05, { filtre: 'bandpass', frequence: varier(1800, 0.15), volume: 0.25 })
    note(varier(180), 0, 0.06, { type: 'triangle', volume: 0.18, vers: 90 })
  },

  // Le bloc qui se casse : un « crac » de cailloux, plus grave pour la roche dure.
  casse(dur: boolean) {
    bruit(0, 0.14, { filtre: 'lowpass', frequence: varier(dur ? 700 : 1100), volume: 0.4 })
    bruit(0.03, 0.09, { filtre: 'bandpass', frequence: varier(2600), volume: 0.12 })
    note(varier(dur ? 110 : 150), 0, 0.12, { type: 'triangle', volume: 0.22, vers: 55 })
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


  // Des pièces qui tintent l'une après l'autre.
  pieces(nombre: number, debut = 0) {
    for (let i = 0; i < nombre; i++) {
      const t = debut + i * 0.055 + Math.random() * 0.02
      note(varier(2400, 0.1), t, 0.09, { type: 'square', volume: 0.05 })
      note(varier(3600, 0.1), t + 0.01, 0.12, { type: 'sine', volume: 0.07 })
    }
  },

  // La caisse du marché : « ka-ching ! », avec plus de pièces pour une grosse vente.
  vente(montant: number) {
    bruit(0, 0.05, { filtre: 'highpass', frequence: 3000, volume: 0.15 })
    note(1568, 0.04, 0.25, { type: 'square', volume: 0.07 })
    note(2093, 0.12, 0.6, { type: 'square', volume: 0.08 })
    note(4186, 0.12, 0.5, { type: 'sine', volume: 0.06 })
    const nombre = Math.min(12, 3 + Math.floor(Math.log10(Math.max(1, montant)) * 2.5))
    sons.pieces(nombre, 0.18)
  },


  // Un palier de combo au bloc de la mine (27/10) : un arpège qui monte, plus haut à chaque palier.
  combo(palier: number) {
    const base = 784 * Math.pow(2, Math.min(palier, 5) / 6)
    ;[1, 1.25, 1.5, 2].forEach((k, i) => note(base * k, i * 0.05, 0.18, { type: 'square', volume: 0.05 }))
    note(base * 4, 0.2, 0.3, { type: 'sine', volume: 0.06 })
  },

  // Un wagonnet vend son chargement au marché (27/10) : la cloche du marché, « ka-ching ! » et
  // une cascade de pièces, d'autant plus longue que la vente est grosse.
  venteMarche(montant: number) {
    note(1568, 0, 0.5, { type: 'sine', volume: 0.1 })
    note(2093, 0.08, 0.5, { type: 'sine', volume: 0.08 })
    sons.vente(montant)
    // Une petite fanfare qui monte pour les grosses ventes.
    if (montant >= 1000) [1047, 1319, 1568, 2093].forEach((f, i) => note(f, 0.3 + i * 0.07, 0.25, { type: 'triangle', volume: 0.07 }))
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
}