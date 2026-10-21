// Les chargements en route vers le marché (20/10) : ce que l'ascenseur remonte, et la récolte
// des mineurs quand des rails relient la mine au marché. Ils roulent en wagonnet sur les rails
// (3 fois plus vite qu'à pied), sinon dans une brouette. Ils sont vendus en arrivant au marché.
// Avec des rails, tu peux aussi charger le wagonnet toi-même depuis la mine (sans aller au marché).

import { aLaSurface, retirer, quantite, valeurDe, type EtatJeu, type Inventaire } from './mineur'
import { railsMineMarche, trajetChargement, envoyerAuMarche } from './village'
import type { IdBloc } from './donnees'

// Le temps passe pour les chargements : ceux qui arrivent au marché sont vendus.
export function avancerConvois(etat: EtatJeu, secondes: number): string[] {
  if (etat.convois.length === 0) return []
  const messages: string[] = []
  const restants = []
  for (const convoi of etat.convois) {
    // Pas encore de marché : il attend à la mine (on recalcule son trajet quand le marché est posé).
    if (convoi.duree < 0) {
      const trajet = trajetChargement(etat.village)
      if (trajet === null) {
        restants.push(convoi)
        continue
      }
      convoi.duree = trajet.duree
      convoi.parRails = trajet.parRails
    }
    convoi.temps += secondes
    if (convoi.temps < convoi.duree) {
      restants.push(convoi)
      continue
    }
    const gain = valeurDe(etat, convoi.chargement)
    etat.argent += gain
    etat.stats.argentGagne += gain
    const mineur = convoi.mineur === null ? null : etat.employes.find((e) => e.nom === convoi.mineur)
    if (convoi.mineur !== null) {
      etat.stats.argentMineurs += gain
      if (mineur) mineur.gagne += gain
    } else {
      messages.push(`${convoi.parRails ? '🛤️ Le wagonnet' : '🛒 La brouette'} a vendu ton chargement au marché : +${gain} $`)
    }
  }
  etat.convois = restants
  return messages
}

// Les rails relient-ils la mine au marché ? (Alors on peut charger le wagonnet depuis la mine.)
export function wagonnetDisponible(etat: EtatJeu): boolean {
  return railsMineMarche(etat.village) !== null
}

// Tu charges le wagonnet à la mine : les objets choisis partent au marché sur les rails.
export function chargerWagonnet(etat: EtatJeu, lot: Inventaire): string[] {
  if (!aLaSurface(etat) || !wagonnetDisponible(etat)) return []
  const charge: Inventaire = {}
  for (const [id, nombre] of Object.entries(lot)) {
    const bloc = id as IdBloc
    const pris = Math.max(0, Math.min(Math.floor(nombre ?? 0), quantite(etat, bloc)))
    if (pris > 0) charge[bloc] = pris
  }
  if (Object.keys(charge).length === 0) return []
  for (const [bloc, nombre] of Object.entries(charge)) retirer(etat, bloc as IdBloc, nombre ?? 0)
  envoyerAuMarche(etat, charge, null)
  return ['🛤️ Le wagonnet part au marché avec ton chargement.']
}

// Le nombre d'objets en route vers le marché (les tiens seulement).
export function nbEnRoute(etat: EtatJeu): number {
  let total = 0
  for (const convoi of etat.convois) {
    if (convoi.mineur !== null) continue
    for (const nombre of Object.values(convoi.chargement)) total += nombre ?? 0
  }
  return total
}
