// Les succès du jeu. Ils sont vérifiés après chaque action et chaque moment qui passe.

import type { EtatJeu } from './mineur'
import { railsAlimentes } from './wagonnet'
import { t } from './langue'

export type Succes = {
  id: string
  emoji: string
  titre: string
  description: string
  condition: (etat: EtatJeu) => boolean
}

// (25/10) Le titre et la description sont des « get » : ils passent par t() à chaque lecture,
// pour être dans la langue choisie par le joueur (même s'il en change en cours de partie).
export const SUCCES: Succes[] = [
  { id: 'premier_bloc', emoji: '⛏️', get titre() { return t('Premier coup de pioche') }, get description() { return t('Casser ton premier bloc') }, condition: (e) => e.stats.blocsCasses >= 1 },
  { id: 'cent_blocs', emoji: '🧱', get titre() { return t('Terrassier') }, get description() { return t('Casser 100 blocs en cliquant') }, condition: (e) => e.stats.blocsCasses >= 100 },
  { id: 'mille_blocs', emoji: '🏗️', get titre() { return t('Tunnelier') }, get description() { return t('Casser 1 000 blocs en cliquant') }, condition: (e) => e.stats.blocsCasses >= 1000 },
  { id: 'pioche_fer', emoji: '⚙️', get titre() { return t('Âge du fer') }, get description() { return t('Débloquer la pioche en fer') }, condition: (e) => e.meilleure >= 1 },
  { id: 'pioche_or', emoji: '🥇', get titre() { return t('Pioche dorée') }, get description() { return t('Débloquer la pioche en or') }, condition: (e) => e.meilleure >= 2 },
  { id: 'pioche_emeraude', emoji: '💚', get titre() { return t('Vert brillant') }, get description() { return t('Débloquer la pioche en émeraude') }, condition: (e) => e.meilleure >= 3 },
  { id: 'pioche_diamant', emoji: '💎', get titre() { return t('Diamants !') }, get description() { return t('Débloquer la pioche en diamant') }, condition: (e) => e.meilleure >= 4 },
  { id: 'mine_2', emoji: '🔴', get titre() { return t('Veine de redstone') }, get description() { return t('Descendre la mine au niveau 2') }, condition: (e) => e.niveauMine >= 2 },
  { id: 'mine_3', emoji: '🟡', get titre() { return t('Chercheur d’or') }, get description() { return t('Descendre la mine au niveau 3') }, condition: (e) => e.niveauMine >= 3 },
  { id: 'mine_4', emoji: '🟢', get titre() { return t('Grotte aux émeraudes') }, get description() { return t('Descendre la mine au niveau 4') }, condition: (e) => e.niveauMine >= 4 },
  { id: 'mine_5', emoji: '🏆', get titre() { return t('Cœur de diamant') }, get description() { return t('Descendre la mine au niveau 5, tout au fond') }, condition: (e) => e.niveauMine >= 5 },
  { id: 'premier_diamant', emoji: '💠', get titre() { return t('Ça brille !') }, get description() { return t('Trouver un diamant') }, condition: (e) => e.stats.diamantsTrouves >= 1 },
  { id: 'patron', emoji: '👷', get titre() { return t('Patron') }, get description() { return t('Embaucher ton premier mineur') }, condition: (e) => e.employes.length >= 1 },
  { id: 'equipe', emoji: '👥', get titre() { return t('Chef d’équipe') }, get description() { return t('Avoir 6 mineurs') }, condition: (e) => e.employes.length >= 6 },
  { id: 'cheminot', emoji: '🛤️', get titre() { return t('Cheminot') }, get description() { return t('Créer un trajet de wagonnet') }, condition: (e) => e.trajets.length > 0 },
  { id: 'electricien', emoji: '⚡', get titre() { return t('Électricien') }, get description() { return t('Électrifier les rails avec le générateur') }, condition: (e) => railsAlimentes(e) },
  { id: 'tous_trajets', emoji: '🗺️', get titre() { return t('Réseau complet') }, get description() { return t('Faire rouler un wagonnet sur les 4 trajets') }, condition: (e) => e.trajets.length >= 4 },
  { id: 'cent_voyages', emoji: '🚃', get titre() { return t('Ligne régulière') }, get description() { return t('Faire 100 voyages de wagonnet') }, condition: (e) => e.stats.voyagesWagonnet >= 100 },
  { id: 'riche', emoji: '💰', get titre() { return t('Riche') }, get description() { return t('Gagner 5 000 $') }, condition: (e) => e.stats.argentGagne >= 5000 },
  { id: 'millionnaire', emoji: '🤑', get titre() { return t('Magnat') }, get description() { return t('Gagner 100 000 $') }, condition: (e) => e.stats.argentGagne >= 100000 },
  { id: 'architecte', emoji: '🏗️', get titre() { return t('Architecte') }, get description() { return t('Poser 5 bâtiments au village') }, condition: (e) => e.village.batiments.length >= 6 },
]

// Débloque les nouveaux succès et renvoie la liste de ceux qui viennent d'être obtenus.
export function verifierSucces(etat: EtatJeu): Succes[] {
  const nouveaux = SUCCES.filter((s) => !etat.succes.includes(s.id) && s.condition(etat))
  for (const s of nouveaux) etat.succes.push(s.id)
  return nouveaux
}
