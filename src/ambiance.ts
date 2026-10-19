// La musique de fond et les ambiances, fabriquées par le navigateur (Web Audio),
// comme les bruitages : aucun fichier, donc rien à acheter ni à créditer.
//
// - La musique : des accords doux (la mineur, fa, do, sol) joués en nappe, une basse
//   et quelques notes de mélodie tirées au hasard dans une gamme pentatonique.
// - À la surface : le vent (un souffle filtré qui ondule) et des oiseaux.
// - Dans la mine : un grondement sourd, de l'écho, des gouttes d'eau et parfois une
//   résonance grave. Plus on descend, plus la grotte se fait entendre.
//
// Le bouton 🎵 du bandeau coupe musique et ambiances (réglage gardé dans le localStorage).

import { contexteAudio, ecrireReglage, lireReglage, quandLeSonEstPermis } from './sons'

const CLE_MUSIQUE = 'idle-miner-musique'

const VOLUME_GENERAL = 0.7
const VOLUME_MUSIQUE = 0.13
const DUREE_MESURE = 4 * (60 / 62) // 4 temps à 62 battements par minute (environ 3,9 s)

// Les accords (fréquences en hertz) : la mineur, fa majeur, do majeur, sol majeur.
const ACCORDS = [
  { basse: 110.0, notes: [220.0, 261.63, 329.63] },
  { basse: 87.31, notes: [174.61, 220.0, 261.63] },
  { basse: 130.81, notes: [196.0, 261.63, 329.63] },
  { basse: 98.0, notes: [196.0, 246.94, 293.66] },
]
// La gamme pentatonique de la mineur (la, do, ré, mi, sol), à l'octave de la mélodie.
const GAMME_MELODIE = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0]

type Noeuds = {
  ctx: AudioContext
  general: GainNode // tout passe par lui (coupé par le bouton 🎵)
  echo: ConvolverNode // la réverbération (l'écho de la grotte, le halo de la musique)
  musique: GainNode
  surface: GainNode
  grotte: GainNode
  envoiEchoGrotte: GainNode
}

let active = lireReglage(CLE_MUSIQUE)
let noeuds: Noeuds | null = null
let numeroMesure = 0
let prochaineMesure = 0

// Où est le joueur : à la surface, ou à quelle profondeur dans la mine.
let aLaSurface = true
let profondeur = 0

export function musiqueActive(): boolean {
  return active
}

export function basculerMusique(): boolean {
  active = !active
  ecrireReglage(CLE_MUSIQUE, active)
  if (noeuds) noeuds.general.gain.setTargetAtTime(active ? VOLUME_GENERAL : 0, noeuds.ctx.currentTime, 0.3)
  if (active) demarrer()
  return active
}

// Appelée par l'interface quand le joueur change d'endroit : on fond les ambiances.
export function reglerLieu(surface: boolean, metres: number): void {
  aLaSurface = surface
  profondeur = metres
  appliquerLieu()
}

function appliquerLieu() {
  if (!noeuds) return
  const { ctx, surface, grotte, envoiEchoGrotte, musique } = noeuds
  const t = ctx.currentTime
  // Plus on est profond, plus la grotte s'entend (et plus elle résonne).
  const fond = Math.min(1, profondeur / 128)
  surface.gain.setTargetAtTime(aLaSurface ? 1 : 0, t, 1.2)
  grotte.gain.setTargetAtTime(aLaSurface ? 0 : 0.55 + 0.45 * fond, t, 1.2)
  envoiEchoGrotte.gain.setTargetAtTime(aLaSurface ? 0 : 0.5 + 0.5 * fond, t, 1.2)
  musique.gain.setTargetAtTime(aLaSurface ? VOLUME_MUSIQUE : VOLUME_MUSIQUE * 0.8, t, 1.2)
}

// ---------------------------------------------------------------------------
// Construction des sons (une seule fois, au premier clic du joueur)
// ---------------------------------------------------------------------------

quandLeSonEstPermis(() => {
  if (active) demarrer()
})

if (typeof document !== 'undefined') {
  // Onglet caché : on met tout en pause (ça économise la batterie).
  document.addEventListener('visibilitychange', () => {
    if (!noeuds) return
    if (document.hidden) void noeuds.ctx.suspend()
    else void noeuds.ctx.resume()
  })
}

function demarrer() {
  if (noeuds) return
  const ctx = contexteAudio()
  if (!ctx) return

  const general = ctx.createGain()
  general.gain.value = 0
  general.gain.setTargetAtTime(active ? VOLUME_GENERAL : 0, ctx.currentTime, 1.5) // le son arrive en douceur
  general.connect(ctx.destination)

  const echo = ctx.createConvolver()
  echo.buffer = reponseEcho(ctx, 3.5)
  echo.connect(general)

  const musique = ctx.createGain()
  musique.gain.value = VOLUME_MUSIQUE
  musique.connect(general)
  const envoiEchoMusique = ctx.createGain()
  envoiEchoMusique.gain.value = 0.6
  musique.connect(envoiEchoMusique).connect(echo)

  const surface = ctx.createGain()
  surface.gain.value = 0
  surface.connect(general)

  const grotte = ctx.createGain()
  grotte.gain.value = 0
  grotte.connect(general)
  const envoiEchoGrotte = ctx.createGain()
  envoiEchoGrotte.gain.value = 0
  grotte.connect(envoiEchoGrotte).connect(echo)

  noeuds = { ctx, general, echo, musique, surface, grotte, envoiEchoGrotte }
  appliquerLieu()

  creerVent(ctx, surface)
  creerGrondement(ctx, grotte)

  prochaineMesure = ctx.currentTime + 0.5
  jouerMesures()
  planifier(chanterOiseaux, 1.5, 5)
  planifier(faireTomberGoutte, 1, 3.5)
  planifier(resonner, 12, 30)
}

// Relance une action après un délai au hasard (entre min et max secondes), pour toujours.
function planifier(action: () => void, min: number, max: number) {
  window.setTimeout(
    () => {
      if (active && noeuds && noeuds.ctx.state === 'running') action()
      planifier(action, min, max)
    },
    (min + Math.random() * (max - min)) * 1000,
  )
}

// Un bruit blanc (souffle) de quelques secondes, qu'on fait tourner en boucle.
function bruitEnBoucle(ctx: AudioContext, secondes: number): AudioBufferSourceNode {
  const tampon = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * secondes), ctx.sampleRate)
  const donnees = tampon.getChannelData(0)
  for (let i = 0; i < donnees.length; i++) donnees[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = tampon
  source.loop = true
  return source
}

// La « réponse » d'une grande salle : un souffle qui s'éteint lentement. Passé dans
// un ConvolverNode, n'importe quel son prend cet écho.
function reponseEcho(ctx: AudioContext, secondes: number): AudioBuffer {
  const longueur = Math.ceil(ctx.sampleRate * secondes)
  const tampon = ctx.createBuffer(2, longueur, ctx.sampleRate)
  for (let canal = 0; canal < 2; canal++) {
    const donnees = tampon.getChannelData(canal)
    for (let i = 0; i < longueur; i++) donnees[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / longueur, 3)
  }
  return tampon
}

// Une oscillation très lente, branchée sur un réglage (fréquence d'un filtre, volume...).
function onduler(ctx: AudioContext, cible: AudioParam, vitesse: number, ampleur: number) {
  const lfo = ctx.createOscillator()
  lfo.frequency.value = vitesse
  const force = ctx.createGain()
  force.gain.value = ampleur
  lfo.connect(force).connect(cible)
  lfo.start()
}

// ---------------------------------------------------------------------------
// La surface : le vent et les oiseaux
// ---------------------------------------------------------------------------

function creerVent(ctx: AudioContext, sortie: GainNode) {
  const souffle = bruitEnBoucle(ctx, 4)
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 450
  filtre.Q.value = 0.7
  const volume = ctx.createGain()
  volume.gain.value = 0.07
  souffle.connect(filtre).connect(volume).connect(sortie)
  // Le vent forcit et faiblit doucement.
  onduler(ctx, filtre.frequency, 0.07, 250)
  onduler(ctx, volume.gain, 0.11, 0.04)
  souffle.start()
}

function chanterOiseaux() {
  if (!noeuds || !aLaSurface) return
  const { ctx, surface } = noeuds
  const panneau = ctx.createStereoPanner()
  panneau.pan.value = Math.random() * 1.6 - 0.8
  panneau.connect(surface)
  const debut = ctx.currentTime + 0.05
  const hauteur = 2600 + Math.random() * 1800
  const nombre = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < nombre; i++) {
    const t = debut + i * (0.11 + Math.random() * 0.08)
    const duree = 0.06 + Math.random() * 0.06
    const oiseau = ctx.createOscillator()
    oiseau.type = 'sine'
    oiseau.frequency.setValueAtTime(hauteur * (0.9 + Math.random() * 0.2), t)
    oiseau.frequency.exponentialRampToValueAtTime(hauteur * (Math.random() < 0.5 ? 1.35 : 0.75), t + duree)
    const volume = ctx.createGain()
    volume.gain.setValueAtTime(0.0001, t)
    volume.gain.exponentialRampToValueAtTime(0.035, t + 0.012)
    volume.gain.exponentialRampToValueAtTime(0.0001, t + duree)
    oiseau.connect(volume).connect(panneau)
    oiseau.start(t)
    oiseau.stop(t + duree + 0.02)
  }
}

// ---------------------------------------------------------------------------
// La mine : grondement, gouttes d'eau et résonances
// ---------------------------------------------------------------------------

function creerGrondement(ctx: AudioContext, sortie: GainNode) {
  // Un souffle très grave, comme l'air qui circule dans les galeries.
  const souffle = bruitEnBoucle(ctx, 5)
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 140
  const volume = ctx.createGain()
  volume.gain.value = 0.22
  souffle.connect(filtre).connect(volume).connect(sortie)
  onduler(ctx, volume.gain, 0.05, 0.08)
  souffle.start()

  // Deux notes très basses, à peine audibles, qui « bourdonnent » ensemble.
  for (const frequence of [55, 55.7]) {
    const bourdon = ctx.createOscillator()
    bourdon.frequency.value = frequence
    const volumeBourdon = ctx.createGain()
    volumeBourdon.gain.value = 0.025
    bourdon.connect(volumeBourdon).connect(sortie)
    bourdon.start()
  }
}

function faireTomberGoutte() {
  if (!noeuds || aLaSurface) return
  const { ctx, grotte } = noeuds
  const t = ctx.currentTime + 0.02
  const panneau = ctx.createStereoPanner()
  panneau.pan.value = Math.random() * 1.8 - 0.9
  panneau.connect(grotte)
  // « plic » : une note qui monte très vite et s'éteint aussitôt.
  const hauteur = 700 + Math.random() * 900
  const goutte = ctx.createOscillator()
  goutte.type = 'sine'
  goutte.frequency.setValueAtTime(hauteur, t)
  goutte.frequency.exponentialRampToValueAtTime(hauteur * 2.2, t + 0.05)
  const volume = ctx.createGain()
  volume.gain.setValueAtTime(0.0001, t)
  volume.gain.exponentialRampToValueAtTime(0.09, t + 0.005)
  volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  goutte.connect(volume).connect(panneau)
  goutte.start(t)
  goutte.stop(t + 0.15)
}

function resonner() {
  if (!noeuds || aLaSurface) return
  const { ctx, grotte } = noeuds
  const t = ctx.currentTime + 0.05
  // Une longue note grave qui enfle et retombe, comme la montagne qui travaille.
  const note = ctx.createOscillator()
  note.type = 'triangle'
  note.frequency.setValueAtTime(70 + Math.random() * 30, t)
  note.frequency.exponentialRampToValueAtTime(45, t + 5)
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 300
  const volume = ctx.createGain()
  volume.gain.setValueAtTime(0.0001, t)
  volume.gain.exponentialRampToValueAtTime(0.12, t + 1.8)
  volume.gain.exponentialRampToValueAtTime(0.0001, t + 5)
  note.connect(filtre).connect(volume).connect(grotte)
  note.start(t)
  note.stop(t + 5.1)
}

// ---------------------------------------------------------------------------
// La musique
// ---------------------------------------------------------------------------

// Une note douce : elle monte lentement (attaque) puis s'éteint (relâche).
function noteDouce(frequence: number, debut: number, duree: number, volumeMax: number, type: OscillatorType, attaque: number) {
  if (!noeuds) return
  const { ctx, musique } = noeuds
  const oscillateur = ctx.createOscillator()
  oscillateur.type = type
  oscillateur.frequency.value = frequence
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 1400
  const volume = ctx.createGain()
  volume.gain.setValueAtTime(0.0001, debut)
  volume.gain.exponentialRampToValueAtTime(volumeMax, debut + attaque)
  volume.gain.exponentialRampToValueAtTime(0.0001, debut + duree)
  oscillateur.connect(filtre).connect(volume).connect(musique)
  oscillateur.start(debut)
  oscillateur.stop(debut + duree + 0.05)
}

// Prépare les mesures à venir, un peu en avance, puis se rappelle avant la fin.
function jouerMesures() {
  if (!noeuds) return
  const { ctx } = noeuds
  // Si l'onglet a été mis en pause, on repart de maintenant (sans rattraper le retard).
  if (prochaineMesure < ctx.currentTime) prochaineMesure = ctx.currentTime + 0.1

  while (prochaineMesure < ctx.currentTime + 2 * DUREE_MESURE) {
    if (active) jouerUneMesure(prochaineMesure)
    prochaineMesure += DUREE_MESURE
    numeroMesure += 1
  }
  window.setTimeout(jouerMesures, 1000)
}

function jouerUneMesure(debut: number) {
  // Chaque accord dure deux mesures : la, la, fa, fa, do, do, sol, sol...
  const accord = ACCORDS[Math.floor(numeroMesure / 2) % ACCORDS.length]
  const temps = DUREE_MESURE / 4

  // La nappe : les notes de l'accord, longues et lentes.
  for (const frequence of accord.notes) noteDouce(frequence, debut, DUREE_MESURE + 1.2, 0.05, 'triangle', 1.2)
  // La basse, sur le premier temps.
  noteDouce(accord.basse, debut, DUREE_MESURE, 0.09, 'sine', 0.3)

  // Quelques notes de mélodie, au hasard (une mesure sur quatre reste calme).
  if (numeroMesure % 4 === 3) return
  const nombre = 1 + Math.floor(Math.random() * 3)
  for (let i = 0; i < nombre; i++) {
    const surLeTemps = Math.floor(Math.random() * 8) / 2 // un temps ou un demi-temps
    const note = GAMME_MELODIE[Math.floor(Math.random() * GAMME_MELODIE.length)]
    noteDouce(note, debut + surLeTemps * temps, 2.2, 0.035, 'sine', 0.02)
  }
}
