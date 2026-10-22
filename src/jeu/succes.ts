// Les succès du jeu. Ils sont vérifiés après chaque action et chaque moment qui passe.

import type { EtatJeu } from './mineur'
import { railsAlimentes } from './wagonnet'

export type Succes = {
  id: string
  emoji: string
  titre: string
  description: string
  condition: (etat: EtatJeu) => boolean
}

export const SUCCES: Succes[] = [
  { id: 'premier_bloc', emoji: '⛏️', titre: 'Premier coup de pioche', description: 'Casser ton premier bloc', condition: (e) => e.stats.blocsCasses >= 1 },
  { id: 'cent_blocs', emoji: '🧱', titre: 'Terrassier', description: 'Casser 100 blocs en cliquant', condition: (e) => e.stats.blocsCasses >= 100 },
  { id: 'mille_blocs', emoji: '🏗️', titre: 'Tunnelier', description: 'Casser 1 000 blocs en cliquant', condition: (e) => e.stats.blocsCasses >= 1000 },
  { id: 'pioche_fer', emoji: '⚙️', titre: 'Âge du fer', description: 'Débloquer la pioche en fer', condition: (e) => e.meilleure >= 1 },
  { id: 'pioche_or', emoji: '🥇', titre: 'Pioche dorée', description: 'Débloquer la pioche en or', condition: (e) => e.meilleure >= 2 },
  { id: 'pioche_diamant', emoji: '💎', titre: 'Diamants !', description: 'Débloquer la pioche en diamant', condition: (e) => e.meilleure >= 3 },
  { id: 'mine_2', emoji: '🔴', titre: 'Veine de redstone', description: 'Descendre la mine au niveau 2', condition: (e) => e.niveauMine >= 2 },
  { id: 'mine_3', emoji: '🟡', titre: 'Chercheur d’or', description: 'Descendre la mine au niveau 3', condition: (e) => e.niveauMine >= 3 },
  { id: 'mine_4', emoji: '🟢', titre: 'Grotte aux émeraudes', description: 'Descendre la mine au niveau 4', condition: (e) => e.niveauMine >= 4 },
  { id: 'mine_5', emoji: '🏆', titre: 'Cœur de diamant', description: 'Descendre la mine au niveau 5, tout au fond', condition: (e) => e.niveauMine >= 5 },
  { id: 'premier_diamant', emoji: '💠', titre: 'Ça brille !', description: 'Trouver un diamant', condition: (e) => e.stats.diamantsTrouves >= 1 },
  { id: 'patron', emoji: '👷', titre: 'Patron', description: 'Embaucher ton premier mineur', condition: (e) => e.employes.length >= 1 },
  { id: 'equipe', emoji: '👥', titre: 'Chef d’équipe', description: 'Avoir 6 mineurs', condition: (e) => e.employes.length >= 6 },
  { id: 'cheminot', emoji: '🛤️', titre: 'Cheminot', description: 'Créer un trajet de wagonnet', condition: (e) => e.trajets.length > 0 },
  { id: 'electricien', emoji: '⚡', titre: 'Électricien', description: 'Électrifier les rails avec le générateur', condition: (e) => railsAlimentes(e) },
  { id: 'tous_trajets', emoji: '🗺️', titre: 'Réseau complet', description: 'Faire rouler un wagonnet sur les 4 trajets', condition: (e) => e.trajets.length >= 4 },
  { id: 'cent_voyages', emoji: '🚃', titre: 'Ligne régulière', description: 'Faire 100 voyages de wagonnet', condition: (e) => e.stats.voyagesWagonnet >= 100 },
  { id: 'riche', emoji: '💰', titre: 'Riche', description: 'Gagner 5 000 $', condition: (e) => e.stats.argentGagne >= 5000 },
  { id: 'millionnaire', emoji: '🤑', titre: 'Magnat', description: 'Gagner 100 000 $', condition: (e) => e.stats.argentGagne >= 100000 },
  { id: 'architecte', emoji: '🏗️', titre: 'Architecte', description: 'Poser 5 bâtiments au village', condition: (e) => e.village.batiments.length >= 6 },
]

// Débloque les nouveaux succès et renvoie la liste de ceux qui viennent d'être obtenus.
export function verifierSucces(etat: EtatJeu): Succes[] {
  const nouveaux = SUCCES.filter((s) => !etat.succes.includes(s.id) && s.condition(etat))
  for (const s of nouveaux) etat.succes.push(s.id)
  return nouveaux
}
