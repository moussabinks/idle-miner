// Les bruitages du jeu, fabriqués directement par le navigateur (Web Audio) :
// pas de fichier son à charger. Chaque son est un petit mélange de « notes »
// (un oscillateur dont le volume retombe) et de « bruit » (un souffle filtré,
// pour les coups de pioche et les éboulements).
//
// Le son peut être coupé : le réglage est gardé dans le localStorage.

const CLE_SON = 'idle-miner-son'

let contexte: AudioContext | null = null
let sortie: GainNode | null = null
let actif = lireReglage()

function lireReglage(): boolean {
  try {
    return window.localStorage.getItem(CLE_SON) !== 'coupe'
  } catch {
    return true
  }
}

export function sonActif(): boolean {
  return actif
}

export function basculerSon(): boolean {
  actif = !actif
  try {
    window.localStorage.setItem(CLE_SON, actif ? 'actif' : 'coupe')
  } catch {
    // Tant pis, le réglage ne sera pas gardé.
  }
  return actif
}

// Le navigateur n'autorise le son qu'après un clic ou une touche du joueur :
// on crée (ou réveille) le contexte audio à ce moment-là.
function audio(): AudioContext | null {
  if (!actif || typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (contexte === null) {
    contexte = new AudioContext()
    sortie = contexte.createGain()
    sortie.gain.value = 0.5 // volume général
    sortie.connect(contexte.destination)
  }
  if (contexte.state === 'suspended') void contexte.resume()
  return contexte
}

if (typeof window !== 'undefined') {
  const reveiller = () => audio()
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

// Un petit écart au hasard, pour que deux coups de pioche ne sonnent pas pareil.
function varier(valeur: number, ecart = 0.08): number {
  return valeur * (1 - ecart + Math.random() * 2 * ecart)
}

// ---------------------------------------------------------------------------
// Les sons du jeu
// ---------------------------------------------------------------------------

export const sons = {
  // Un coup de pioche pendant qu'on casse un bloc : « tac ».
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

  // Un minerai ordinaire qui tombe dans le sac : « plink ».
  minerai() {
    note(varier(1320, 0.03), 0.02, 0.12, { type: 'triangle', volume: 0.12 })
  },

  // Un minerai rare (diamant, émeraude...) : une petite pluie d'étincelles qui monte.
  rare() {
    const notes = [1047, 1319, 1568, 2093, 2637]
    notes.forEach((f, i) => note(f, 0.05 + i * 0.06, 0.35, { type: 'sine', volume: 0.16 }))
    notes.forEach((f, i) => note(f * 2, 0.08 + i * 0.06, 0.2, { type: 'triangle', volume: 0.05 }))
  },

  // Un coffre : le couvercle, puis quelques pièces.
  coffre() {
    note(220, 0, 0.12, { type: 'square', volume: 0.08, vers: 330 })
    sons.pieces(4, 0.1)
  },

  // Une géode : du cristal qui tinte.
  geode() {
    ;[1760, 2217, 2637, 2217].forEach((f, i) => note(f, i * 0.07, 0.4, { type: 'sine', volume: 0.12 }))
  },

  // La lave qui siffle (éteinte avec le seau... ou pas !).
  lave() {
    bruit(0, 0.6, { filtre: 'highpass', frequence: 2500, volume: 0.25 })
    note(90, 0, 0.3, { type: 'sawtooth', volume: 0.06, vers: 50 })
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

  // L'arrivée de l'ascenseur : « ding-dong ».
  ding() {
    note(1319, 0, 0.9, { type: 'sine', volume: 0.22 })
    note(2638, 0, 0.4, { type: 'sine', volume: 0.05 })
    note(1047, 0.32, 1.1, { type: 'sine', volume: 0.2 })
    note(2094, 0.32, 0.5, { type: 'sine', volume: 0.04 })
  },

  // Un barreau d'échelle : un petit « toc » de bois.
  pas() {
    note(varier(420, 0.12), 0, 0.05, { type: 'triangle', volume: 0.06, vers: 260 })
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

  // Un talent de l'arbre de prestige.
  talent() {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.07, 0.5, { type: 'sine', volume: 0.13 }))
    note(2093, 0.4, 0.8, { type: 'sine', volume: 0.06 })
  },

  // Le prestige : grande fanfare.
  prestige() {
    const accords = [
      [523, 659, 784],
      [587, 740, 880],
      [659, 831, 988],
      [784, 988, 1175, 1568],
    ]
    accords.forEach((accord, i) => accord.forEach((f) => note(f, i * 0.18, i === 3 ? 1.2 : 0.22, { type: 'triangle', volume: 0.09 })))
  },

  // La pioche qui casse : un « clang » triste.
  piocheCassee() {
    note(330, 0, 0.3, { type: 'sawtooth', volume: 0.08, vers: 160 })
    bruit(0, 0.12, { filtre: 'bandpass', frequence: 3000, volume: 0.15 })
  },
}
