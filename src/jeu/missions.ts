// Les missions (27/10), en haut à droite de l'écran : toujours une à trois choses à faire, pour
// guider le joueur pas à pas. Au début : casser des blocs, les vendre, embaucher un mineur ; puis
// construire chaque bâtiment (« Récupère 25 pierre pour la foreuse : 12 / 25 ») ; puis
// automatiser (rails, wagonnet, pousseur, mineurs, générateur) ; enfin les améliorations les
// plus proches. Les urgences passent devant (salaires, coffre plein).

import { BATIMENTS, BLOCS, COUT_RAIL, LISTE_BATIMENTS, type Cout, type IdBatiment, type IdBloc } from './donnees'
import { batimentDebloque } from './batiments'
import { nbSansSalaire } from './employes'
import { generateurPose } from './generateur'
import { disponible, nbDansCoffre, peutPayer, type EtatJeu } from './mineur'
import { achatsPossibles, type AchatPossible } from './objectifs'
import { analyseWagonnet, chariotTropPetit } from './production'
import { railsDebloques } from './niveaux'
import { batimentPose } from './village'
import { ligneDe, railsAlimentes, trajetDe } from './wagonnet'
import { t } from './langue'

export type Mission = {
  id: string // pour la reconnaître d'une fois sur l'autre
  icone: string
  texte: string // « Récupère 25 pierre pour le Bazar »
  progression: { valeur: number; max: number; icone: string } | null // « 🪨 12 / 25 »
  // (23/10) Tout ce qu'il faut pour un achat (l'argent et chaque minerai), dès le début, chacun
  // avec sa jauge : la mission ne change plus de texte quand on a l'argent puis le fer.
  elements: Element[] | null
  stand: IdBatiment | null // où aller quand on la touche (null : rien de précis)
  construction: boolean // la toucher ouvre le menu Bâtiments
  pret: boolean // on peut la faire tout de suite
}

const NOMBRE_MAX = 3
// Au tout début : combien de blocs casser avant d'aller les vendre.
const BLOCS_DEBUT = 10

export type Element = { icone: string; nom: string; valeur: number; max: number }

function mission(id: string, icone: string, texte: string, options: Partial<Mission> = {}): Mission {
  return { id, icone, texte, progression: null, elements: null, stand: null, construction: false, pret: false, ...options }
}

// Tout ce que demande un coût : l'argent d'abord, puis chaque minerai, avec ce qu'on a déjà.
function elementsDuCout(etat: EtatJeu, cout: Cout): Element[] {
  const liste: Element[] = []
  const prix = cout.argent ?? 0
  if (prix > 0) liste.push({ icone: '💵', nom: '$', valeur: Math.floor(Math.min(etat.argent, prix)), max: prix })
  for (const [id, nombre] of Object.entries(cout.materiaux)) {
    const bloc = id as IdBloc
    const besoin = nombre ?? 0
    if (besoin > 0) liste.push({ icone: BLOCS[bloc].emoji, nom: t(BLOCS[bloc].nom).toLowerCase(), valeur: Math.min(disponible(etat, bloc), besoin), max: besoin })
  }
  return liste
}

// Ce qu'il manque pour payer un coût : d'abord l'argent, puis chaque minerai.
function ceQuiManque(etat: EtatJeu, cout: Cout): { icone: string; nom: string; valeur: number; max: number } | null {
  const prix = cout.argent ?? 0
  if (etat.argent < prix) return { icone: '💵', nom: '$', valeur: Math.floor(etat.argent), max: prix }
  for (const [id, nombre] of Object.entries(cout.materiaux)) {
    const bloc = id as IdBloc
    const besoin = nombre ?? 0
    const possede = disponible(etat, bloc)
    if (possede < besoin) return { icone: BLOCS[bloc].emoji, nom: t(BLOCS[bloc].nom).toLowerCase(), valeur: possede, max: besoin }
  }
  return null
}

// Une mission pour obtenir quelque chose qui coûte : « Gagne 60 $ pour X », « Récupère 25
// pierre pour X », ou, quand tout est là, la chose elle-même (prête).
// (23/10) Le texte ne change plus en chemin (avant : « Gagne 150 $ », puis « Récupère 30
// pierre ») : la liste de tout ce qu'il faut est là dès le début, chaque élément avec sa jauge.
function missionAchat(etat: EtatJeu, id: string, icone: string, nom: string, cout: Cout, options: Partial<Mission>): Mission {
  const elements = elementsDuCout(etat, cout)
  const manque = ceQuiManque(etat, cout)
  if (!manque) return mission(id, icone, nom, { ...options, elements, pret: true })
  // (25/10) Un bâtiment à construire : « Voir » ouvre le menu Bâtiments, pour le montrer avec
  // son prix. Une amélioration : « Voir » ouvre son bâtiment.
  if (options.construction) return mission(id, icone, nom, { ...options, elements })
  // Sans bâtiment précis : la mine (on y vend le coffre pour l'argent, et on y trouve les minerais).
  return mission(id, icone, nom, { stand: 'puits', ...options, construction: false, elements })
}

// Les urgences : ce qui bloque la production.
function urgences(etat: EtatJeu): Mission[] {
  const liste: Mission[] = []
  const sansSalaire = nbSansSalaire(etat)
  if (sansSalaire > 0 && batimentPose(etat.village, 'employes')) {
    liste.push(mission('salaires', '😠', sansSalaire === 1 ? t('Paie ton mineur au Personnel') : t('Paie tes {n} mineurs au Personnel', { n: sansSalaire }), { stand: 'employes', pret: true }))
  }
  // (25/10) Plus de tâche « coffre plein » : la bulle sur la mine et le bandeau le disent déjà.
  return liste
}

// Les premiers pas (25/10) : casser des blocs, les vendre depuis la mine, embaucher un mineur.
function premiersPas(etat: EtatJeu): Mission | null {
  if (etat.stats.argentGagne === 0) {
    if (etat.stats.blocsCasses < BLOCS_DEBUT && nbDansCoffre(etat) < BLOCS_DEBUT) {
      return mission('casser', '⛏️', t('Casse {n} blocs à la mine', { n: BLOCS_DEBUT }), { stand: 'puits', progression: { valeur: etat.stats.blocsCasses, max: BLOCS_DEBUT, icone: '⛏️' } })
    }
    return mission('vendre', '💰', t('Vends le coffre de la mine'), { stand: 'puits', pret: true })
  }
  if (!batimentPose(etat.village, 'employes')) return mission('personnel', '🏗️', t('Construis le Personnel'), { construction: true, pret: peutPayer(etat, BATIMENTS.employes.cout) })
  if (!etat.employes.some((e) => e.role === 'mineur')) return mission('mineur', '👷', t('Embauche ton premier mineur'), { stand: 'employes', pret: true })
  return null
}

// Le prochain bâtiment à construire (dans l'ordre du menu).
function prochainBatiment(etat: EtatJeu): Mission | null {
  const id = LISTE_BATIMENTS.find((b) => b !== 'marche' && b !== 'employes' && batimentDebloque(etat, b) && !batimentPose(etat.village, b))
  if (!id) return null
  const info = BATIMENTS[id]
  return missionAchat(etat, `construire-${id}`, info.emoji, t('Construis : {nom}', { nom: t(info.nom) }), info.cout, { construction: true })
}

// L'automatisation, étape par étape.
function automatisation(etat: EtatJeu): Mission | null {
  if (etat.stats.argentGagne === 0 || !etat.employes.some((e) => e.role === 'mineur')) return null
  // (29/10) Les rails se débloquent au niveau 2 du joueur (25/10). On ne dit plus combien de fer
  // récupérer : ça dépend du chemin que le joueur choisira.
  if (!railsDebloques(etat)) return null
  // (25/10) Le marché ne sert plus qu'au wagonnet : on le construit au moment des rails.
  if (!batimentPose(etat.village, 'marche')) return mission('marche', '🏗️', t('Construis le marché (gratuit) : le wagonnet y vendra tout seul'), { construction: true, pret: true })
  if (!ligneDe(etat, 'mine-marche')) {
    const fer = COUT_RAIL.materiaux.fer ?? 3
    return mission('rails', '🛤️', t('Pose des rails de la mine au marché ({fer} fer la case)', { fer }), { construction: true, pret: disponible(etat, 'fer') >= fer })
  }
  const trajet = trajetDe(etat, 'mine-marche')
  if (!trajet) return mission('trajet', '🚃', t('Touche la bulle 🛤️ sur les rails : automatise le trajet'), { stand: 'puits', pret: true })
  const electrique = railsAlimentes(etat)
  const pousseur = etat.employes.some((e) => e.role === 'pousseur' && e.trajet === 'mine-marche')
  if (!pousseur && batimentPose(etat.village, 'employes')) return mission('pousseur', '👷', t('Embauche un pousseur pour le wagonnet'), { stand: 'employes', pret: true })
  if (generateurPose(etat) && !electrique) {
    if (etat.generateur.carburant <= 0) return mission('allumer', '⚡', t('Mets de la redstone dans le générateur'), { stand: 'generateur', pret: disponible(etat, 'redstone') > 0 })
    return mission('electrifier', '⚡', t('Mets tous les rails dans le rayon du générateur'), { stand: 'generateur' })
  }
  if (batimentPose(etat.village, 'foreuse') && !trajetDe(etat, 'mine-foreuse')) {
    if (!ligneDe(etat, 'mine-foreuse')) return mission('rails-foreuse', '🛤️', t('Relie la foreuse à la mine (rails)'), { construction: true })
    return mission('trajet-foreuse', '🚃', t('Touche la bulle 🛤️ sur les rails de la foreuse'), { stand: 'puits', pret: true })
  }
  // (27/10) La foreuse vend toute seule son chariot : des rails jusqu'au marché.
  if (batimentPose(etat.village, 'foreuse') && !trajetDe(etat, 'foreuse-marche')) {
    if (!ligneDe(etat, 'foreuse-marche')) return mission('rails-foreuse-marche', '🛤️', t('Relie la foreuse au marché (rails) : elle vendra toute seule'), { construction: true })
    return mission('trajet-foreuse-marche', '🚃', t('Touche la bulle 🛤️ sur les rails foreuse → marché'), { stand: 'foreuse', pret: true })
  }
  return null
}

// Le chariot de ce pousseur est trop petit : son wagonnet ne suit pas, la production s'entasse.
function chariotBloque(etat: EtatJeu, nom: string): boolean {
  const pousseur = etat.employes.find((e) => e.nom === nom && e.role === 'pousseur')
  if (!pousseur?.trajet) return false
  const analyse = analyseWagonnet(etat, pousseur.trajet)
  return analyse?.pousseur?.nom === nom && chariotTropPetit(analyse)
}

// Les améliorations les plus proches (celles dont on a déjà la plus grande part de l'argent).
// (25/10, demandé par le propriétaire) D'abord les grosses : la mine, le coffre, l'ascenseur, la
// foreuse, le générateur, les pioches, embaucher... Les améliorations d'UN employé (« Chariot de
// Noah », « Vitesse de Noah ») seulement quand il n'y a plus rien d'autre, sauf le chariot d'un
// pousseur qui bloque la production : celui-là passe devant.
function ameliorations(etat: EtatJeu): Mission[] {
  const part = (cout: Cout) => (cout.argent ? Math.min(1, etat.argent / cout.argent) : 1)
  const parProximite = (a: AchatPossible, b: AchatPossible) => Number(peutPayer(etat, b.cout)) - Number(peutPayer(etat, a.cout)) || part(b.cout) - part(a.cout)
  const achats = achatsPossibles(etat).filter((a) => !a.construction)
  const urgents = achats.filter((a) => a.chariotPousseur && a.employe && chariotBloque(etat, a.employe))
  const grosses = achats.filter((a) => !a.employe).sort(parProximite)
  const petites = grosses.length > 0 ? [] : achats.filter((a) => a.employe && !urgents.includes(a)).sort(parProximite)
  return [...urgents, ...grosses, ...petites].map((a) => missionAchat(etat, `ameliorer-${a.nom}`, '⬆️', a.nom, a.cout, { stand: a.stand }))
}

// (25/10) Plus de tâche « Niveau X : ce qu'il débloque » : la liste ne montre que des choses
// qu'on peut faire maintenant (la jauge du niveau est dans le bandeau du haut).
// « avant » : les missions affichées juste avant (leurs id). (30/10) Une mission affichée reste
// à sa place tant qu'elle n'est pas faite : la liste ne change plus d'un coup en pleine tâche
// (« économise pour le sac » qui devenait « récupère 40 fer »). Les nouvelles ne prennent que les
// places libres. Seules les urgences passent toujours devant.
export function missions(etat: EtatJeu, avant: string[] = []): Mission[] {
  const toutes = [...urgences(etat), premiersPas(etat), prochainBatiment(etat), automatisation(etat), ...ameliorations(etat)].filter((m): m is Mission => m !== null)
  // Pas deux fois la même.
  const vues = new Set<string>()
  const candidates = toutes.filter((m) => !vues.has(m.id) && vues.add(m.id))
  const urgentes = candidates.filter((m) => ID_URGENCES.includes(m.id))
  const gardees = avant.map((id) => candidates.find((m) => m.id === id && !ID_URGENCES.includes(m.id))).filter((m): m is Mission => m !== undefined)
  const nouvelles = candidates.filter((m) => !ID_URGENCES.includes(m.id) && !avant.includes(m.id))
  return [...urgentes, ...gardees, ...nouvelles].slice(0, NOMBRE_MAX)
}

// Les urgences (elles passent toujours devant).
export const ID_URGENCES = ['salaires', 'coffre-plein']
