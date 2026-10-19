// Les 16 succès du jeu. Ils sont vérifiés après chaque bloc et chaque action,
// et restent débloqués après un prestige.

import { peutEncoreEnchanter, type EtatJeu } from './mineur'

export type Succes = {
  id: string
  emoji: string
  titre: string
  description: string
  condition: (etat: EtatJeu) => boolean
}

export const SUCCES: Succes[] = [
  { id: 'premier_bloc', emoji: '⛏️', titre: 'Premier coup de pioche', description: 'Casser ton premier bloc', condition: (e) => e.stats.blocsCasses >= 1 },
  { id: 'cent_blocs', emoji: '🧱', titre: 'Terrassier', description: 'Casser 100 blocs', condition: (e) => e.stats.blocsCasses >= 100 },
  { id: 'mille_blocs', emoji: '🏗️', titre: 'Tunnelier', description: 'Casser 1 000 blocs', condition: (e) => e.stats.blocsCasses >= 1000 },
  { id: 'pioche_pierre', emoji: '🪨', titre: "L'âge de pierre", description: 'Débloquer la pioche en pierre', condition: (e) => e.meilleure >= 1 },
  { id: 'pioche_fer', emoji: '⚙️', titre: 'Âge du fer', description: 'Débloquer la pioche en fer', condition: (e) => e.meilleure >= 2 },
  { id: 'pioche_diamant', emoji: '💎', titre: 'Diamants !', description: 'Débloquer la pioche en diamant', condition: (e) => e.meilleure >= 3 },
  { id: 'pioche_netherite', emoji: '🔥', titre: 'Increvable', description: 'Débloquer la pioche en netherite', condition: (e) => e.meilleure >= 4 },
  { id: 'profondeurs', emoji: '🕳️', titre: 'Spéléologue', description: 'Descendre à -60 m', condition: (e) => e.profondeur >= 60 },
  { id: 'abimes', emoji: '🌑', titre: 'Dans les abîmes', description: 'Descendre à -105 m', condition: (e) => e.profondeur >= 105 },
  { id: 'premier_diamant', emoji: '💠', titre: "Ça brille !", description: 'Trouver un diamant', condition: (e) => e.stats.diamantsTrouves >= 1 },
  { id: 'coffre', emoji: '🧰', titre: 'Chasseur de trésors', description: 'Ouvrir un coffre', condition: (e) => e.stats.coffresOuverts >= 1 },
  { id: 'geode', emoji: '🔮', titre: 'Géologue', description: 'Casser une géode', condition: (e) => e.stats.geodesCassees >= 1 },
  { id: 'pompier', emoji: '🪣', titre: 'Pompier', description: 'Éteindre de la lave avec un seau', condition: (e) => e.stats.lavesEteintes >= 1 },
  { id: 'riche', emoji: '💰', titre: 'Riche', description: 'Gagner 5 000 $ dans une partie', condition: (e) => e.stats.argentGagne >= 5000 },
  {
    id: 'enchanteur',
    emoji: '✨',
    titre: 'Enchanteur',
    description: 'Mettre tous les enchantements au max',
    condition: (e) => !peutEncoreEnchanter(e),
  },
  { id: 'bedrock', emoji: '🏆', titre: 'Bedrock !', description: 'Atteindre la bedrock à -128 m', condition: (e) => e.victoire },
]

// Débloque les nouveaux succès et renvoie la liste de ceux qui viennent d'être obtenus.
export function verifierSucces(etat: EtatJeu): Succes[] {
  const nouveaux = SUCCES.filter((s) => !etat.succes.includes(s.id) && s.condition(etat))
  for (const s of nouveaux) etat.succes.push(s.id)
  return nouveaux
}
