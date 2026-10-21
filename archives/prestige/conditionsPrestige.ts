// Ce qu'il faut avoir fait pour passer prestige (décidé le 20/10) : atteindre la bedrock, et
// avoir amélioré au maximum tout ce que le prestige actuel permet (ascenseur, enchantements,
// foreuse, équipement des mineurs, recruteur). Sinon, on pourrait enchaîner les prestiges
// sans jamais rien améliorer.
// Le sac à dos compte aussi (plafonné par le prestige depuis le 20/10). Les pioches ne comptent
// pas : elles ne sont pas limitées par le prestige (et il faut de toute façon la pioche en
// netherite pour atteindre la bedrock).
// L'arbre de prestige du village (le bâtiment tout à gauche) montre cette liste, avec une jauge.

import { ENCHANTEMENTS, LISTE_ENCHANTEMENTS, NIVEAUX_EMPLOYE, SACS, niveauMaxAuPrestige, profondeurBedrock } from './donnees'
import { recruteurDebloque } from './employes'
import { foreuseDebloquee } from './foreuse'
import { chiffreRomain, type EtatJeu } from './mineur'

export type ConditionPrestige = {
  id: string
  texte: string // ce qu'il faut faire (« Ascenseur au niveau 3 »)
  avance: string // où on en est (« 2/3 »)
  faite: boolean
}

function condition(id: string, texte: string, actuel: number, objectif: number): ConditionPrestige {
  return { id, texte, avance: `${Math.min(actuel, objectif)}/${objectif}`, faite: actuel >= objectif }
}

export function conditionsPrestige(etat: EtatJeu): ConditionPrestige[] {
  const p = etat.prestige
  const liste: ConditionPrestige[] = [
    {
      id: 'bedrock',
      texte: `Atteindre la bedrock (-${profondeurBedrock(p)} m)`,
      avance: etat.victoire ? '✔' : `-${etat.profondeur} m`,
      faite: etat.victoire,
    },
  ]

  const ascenseur = niveauMaxAuPrestige('ascenseur', p)
  liste.push(condition('ascenseur', `🛗 Ascenseur au niveau ${ascenseur}`, etat.ascenseur.niveau, ascenseur))

  // Le sac à dos (plafonné par le prestige depuis le 20/10).
  const sac = niveauMaxAuPrestige('sac', p)
  liste.push(condition('sac', `🎒 Sac de ${SACS[sac].taille} places`, etat.niveauSac + 1, sac + 1))

  for (const id of LISTE_ENCHANTEMENTS) {
    const max = niveauMaxAuPrestige(id, p)
    liste.push(condition(`enchantement-${id}`, `✨ ${ENCHANTEMENTS[id].nom} ${chiffreRomain(max)}`, etat.enchantements[id], max))
  }

  if (foreuseDebloquee(etat)) {
    // Les niveaux de la foreuse sont comptés à partir de 0 dans le code : on affiche à partir de 1.
    liste.push(condition('foreuse', '⚙️ Foreuse activée', etat.foreuse.active ? 1 : 0, 1))
    // Le niveau de base (au prestige 1) n'est pas une condition : l'activer suffit.
    const forage = niveauMaxAuPrestige('forage', p) + 1
    if (forage > 1) liste.push(condition('forage', `⚙️ Forage au niveau ${forage}`, etat.foreuse.niveauVitesse + 1, forage))
    const chariot = niveauMaxAuPrestige('chariot', p) + 1
    if (chariot > 1) liste.push(condition('chariot', `🛒 Chariot au niveau ${chariot}`, etat.foreuse.niveauChariot + 1, chariot))
  }

  // L'équipement de chaque mineur embauché (on n'oblige pas à embaucher toute l'équipe).
  const equipement = niveauMaxAuPrestige('mineur', p)
  if (equipement > 0) {
    etat.employes.forEach((employe, index) => {
      liste.push(condition(`mineur-${index}`, `👷 ${employe.nom} : pioche en ${NIVEAUX_EMPLOYE[equipement].nom}`, employe.niveau + 1, equipement + 1))
    })
  }

  if (recruteurDebloque(etat)) {
    const recruteur = niveauMaxAuPrestige('recruteur', p)
    liste.push(condition('recruteur', `🎩 Recruteur au niveau ${recruteur}`, etat.recruteur, recruteur))
  }
  return liste
}

export function peutPasserPrestige(etat: EtatJeu): boolean {
  return conditionsPrestige(etat).every((c) => c.faite)
}
