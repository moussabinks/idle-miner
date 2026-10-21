// Les notifications au-dessus des bâtiments du village : de petites icônes qui sautent pour dire
// qu'il y a quelque chose à faire là-bas (coffre de la mine plein, chariot de la foreuse plein,
// plus de redstone, salaires à payer, amélioration achetable...).

import type { IdBatiment } from './donnees'
import { DECOUVERTES, decouvertesAMontrer } from './decouvertes'
import { alerteSalaires } from './employes'
import { chariotPlein } from './foreuse'
import { generateurPose } from './generateur'
import { coffrePlein, estCassee, nbDansCoffre, sacPlein, type EtatJeu } from './mineur'
import { standsAchetables } from './objectifs'
import { batimentPose } from './village'
import { ligneDuWagonnet } from './wagonnet'

// La sorte de notification décide de sa couleur et de sa priorité (la plus urgente d'abord).
export type SorteNotification = 'alerte' | 'pret' | 'nouveau' | 'achat'

export type Notification = { icone: string; texte: string; sorte: SorteNotification }

const PRIORITE: Record<SorteNotification, number> = { alerte: 0, pret: 1, nouveau: 2, achat: 3 }

export function notificationsBatiments(etat: EtatJeu): Partial<Record<IdBatiment, Notification[]>> {
  const liste: Partial<Record<IdBatiment, Notification[]>> = {}
  const ajouter = (id: IdBatiment, notification: Notification) => {
    if (!batimentPose(etat.village, id)) return
    liste[id] = [...(liste[id] ?? []), notification]
  }

  // Les urgences.
  const salaires = alerteSalaires(etat)
  if (salaires) ajouter('employes', { icone: '😠', texte: salaires, sorte: 'alerte' })
  if (batimentPose(etat.village, 'foreuse')) {
    if (chariotPlein(etat)) ajouter('foreuse', { icone: '🛒', texte: 'Le chariot est plein : viens le vider !', sorte: 'alerte' })
    else if (etat.foreuse.carburant <= 0) ajouter('foreuse', { icone: '🔥', texte: 'Plus de charbon !', sorte: 'alerte' })
  }
  if (generateurPose(etat) && etat.generateur.allume && etat.generateur.carburant <= 0) {
    ajouter('generateur', { icone: '🔴', texte: 'Plus de redstone !', sorte: 'alerte' })
  }
  if (estCassee(etat)) ajouter('forgeron', { icone: '🔧', texte: 'Ta pioche est cassée : fais-la réparer !', sorte: 'alerte' })
  if (sacPlein(etat)) ajouter('marche', { icone: '🎒', texte: 'Ton sac est plein : viens vendre !', sorte: 'alerte' })
  if (coffrePlein(etat)) ajouter('puits', { icone: '📦', texte: 'Le coffre de la mine est plein : viens le vider !', sorte: 'alerte' })
  else if (nbDansCoffre(etat) >= 20 && !ligneDuWagonnet(etat)) {
    ajouter('puits', { icone: '📦', texte: `${nbDansCoffre(etat)} objets dans le coffre : porte-les au marché`, sorte: 'pret' })
  }

  // Ce qui vient de se débloquer (recruteur, manager) et ce qui est achetable.
  for (const id of decouvertesAMontrer(etat)) ajouter(DECOUVERTES[id].stand, { icone: '✨', texte: `Nouveau : ${DECOUVERTES[id].nom} !`, sorte: 'nouveau' })
  for (const id of standsAchetables(etat)) ajouter(id, { icone: '💰', texte: 'Une amélioration est achetable !', sorte: 'achat' })

  for (const id of Object.keys(liste) as IdBatiment[]) liste[id] = (liste[id] ?? []).sort((a, b) => PRIORITE[a.sorte] - PRIORITE[b.sorte])
  return liste
}
