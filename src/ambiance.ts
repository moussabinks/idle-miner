// La musique de fond et les ambiances, fabriquées par le navigateur (Web Audio),
// comme les bruitages : aucun fichier, donc rien à acheter ni à créditer.
//
// - La musique : des accords doux (la mineur, fa, do, sol) joués en nappe, une basse
//   et quelques notes de mélodie tirées au hasard dans une gamme pentatonique.
// - À la surface (et seulement là) : le vent (un souffle filtré qui ondule) et des oiseaux.
// - Dans la mine : une grotte qui résonne. Des gouttes d'eau (« plic », parfois « plic-ploc »)
//   avec un vrai écho qui se répète, des petits cailloux qui roulent au loin, un grondement
//   très grave et parfois une longue résonance. Plus on descend, plus la grotte s'entend.
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
  echoGrotte: GainNode // l'écho qui se répète (« plic... plic... plic ») des gouttes et des cailloux
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
  // Le vent et les oiseaux s'arrêtent vite en entrant dans la mine (ils ne descendent pas avec toi).
  surface.gain.setTargetAtTime(aLaSurface ? 1 : 0, t, aLaSurface ? 1.2 : 0.4)
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

  // L'écho de la grotte : le son revient plusieurs fois, de plus en plus faible et étouffé,
  // comme contre les parois d'une grande galerie (un retard qui se renvoie à lui-même).
  const echoGrotte = ctx.createGain()
  const retard = ctx.createDelay(1)
  retard.delayTime.value = 0.38
  const retour = ctx.createGain()
  retour.gain.value = 0.42
  const etouffe = ctx.createBiquadFilter()
  etouffe.type = 'lowpass'
  etouffe.frequency.value = 2200
  echoGrotte.connect(retard)
  retard.connect(etouffe).connect(retour).connect(retard)
  etouffe.connect(grotte)
  etouffe.connect(envoiEchoGrotte)

  noeuds = { ctx, general, echo, musique, surface, grotte, envoiEchoGrotte, echoGrotte }
  appliquerLieu()

  creerVent(ctx, surface)
  creerGrondement(ctx, grotte)

  prochaineMesure = ctx.currentTime + 0.5
  jouerMesures()
  planifier(chanterOiseaux, 1.5, 5)
  planifier(faireTomberGoutte, 0.6, 2.4)
  planifier(faireRoulerCailloux, 14, 35)
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
  // Un grondement très grave et très doux (la montagne autour de soi), sans souffle :
  // le vent, c'est seulement à la surface.
  const souffle = bruitEnBoucle(ctx, 5)
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 70
  filtre.Q.value = 0.5
  const volume = ctx.createGain()
  volume.gain.value = 0.08
  souffle.connect(filtre).connect(volume).connect(sortie)
  souffle.start()

  // Deux notes très basses, à peine audibles, qui « bourdonnent » ensemble.
  for (const frequence of [55, 55.7]) {
    const bourdon = ctx.createOscillator()
    bourdon.frequency.value = frequence
    const volumeBourdon = ctx.createGain()
    volumeBourdon.gain.value = 0.02
    bourdon.connect(volumeBourdon).connect(sortie)
    bourdon.start()
  }
}

// Une goutte d'eau qui tombe dans une flaque : « plic ». La note monte très vite (c'est la
// petite bulle d'air) et s'éteint aussitôt ; l'écho de la grotte la répète.
function goutte(debut: number, hauteur: number, force: number, pan: number) {
  if (!noeuds) return
  const { ctx, grotte, echoGrotte } = noeuds
  const panneau = ctx.createStereoPanner()
  panneau.pan.value = pan
  panneau.connect(grotte)
  panneau.connect(echoGrotte)
  const bulle = ctx.createOscillator()
  bulle.type = 'sine'
  bulle.frequency.setValueAtTime(hauteur, debut)
  bulle.frequency.exponentialRampToValueAtTime(hauteur * 2.6, debut + 0.04)
  const volume = ctx.createGain()
  volume.gain.setValueAtTime(0.0001, debut)
  volume.gain.exponentialRampToValueAtTime(force, debut + 0.004)
  volume.gain.exponentialRampToValueAtTime(0.0001, debut + 0.09)
  bulle.connect(volume).connect(panneau)
  bulle.start(debut)
  bulle.stop(debut + 0.12)
}

function faireTomberGoutte() {
  if (!noeuds || aLaSurface) return
  const t = noeuds.ctx.currentTime + 0.02
  const pan = Math.random() * 1.8 - 0.9
  const hauteur = 900 + Math.random() * 1100
  goutte(t, hauteur, 0.2, pan)
  // Parfois une deuxième goutte juste après, au même endroit : « plic-ploc ».
  if (Math.random() < 0.35) goutte(t + 0.18 + Math.random() * 0.25, hauteur * (0.7 + Math.random() * 0.2), 0.13, pan)
}

// De petits cailloux qui roulent et rebondissent quelque part dans la galerie, au loin.
function faireRoulerCailloux() {
  if (!noeuds || aLaSurface) return
  const { ctx, grotte, echoGrotte } = noeuds
  const panneau = ctx.createStereoPanner()
  panneau.pan.value = Math.random() * 1.6 - 0.8
  // Un peu étouffés : ils sont loin.
  const loin = ctx.createBiquadFilter()
  loin.type = 'lowpass'
  loin.frequency.value = 1800
  loin.connect(panneau)
  panneau.connect(grotte)
  panneau.connect(echoGrotte)
  const debut = ctx.currentTime + 0.05
  const nombre = 4 + Math.floor(Math.random() * 5)
  let t = debut
  for (let i = 0; i < nombre; i++) {
    // Chaque rebond est plus faible, et les rebonds se rapprochent (le caillou ralentit).
    const caillou = ctx.createOscillator()
    caillou.type = 'triangle'
    caillou.frequency.setValueAtTime(500 + Math.random() * 500, t)
    caillou.frequency.exponentialRampToValueAtTime(200, t + 0.04)
    const volume = ctx.createGain()
    volume.gain.setValueAtTime(0.0001, t)
    volume.gain.exponentialRampToValueAtTime(0.08 * Math.pow(0.75, i), t + 0.003)
    volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    caillou.connect(volume).connect(loin)
    caillou.start(t)
    caillou.stop(t + 0.06)
    t += 0.06 + Math.random() * 0.12 * Math.pow(0.85, i)
  }
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
