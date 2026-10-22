// Les missions (27/10), en haut à droite de l'écran : toujours une à trois choses à faire, pour
// guider le joueur pas à pas. Au début : poser le marché, casser des blocs, les vendre ; puis
// construire chaque bâtiment (« Récupère 25 pierre pour le Bazar : 12 / 25 ») ; puis
// automatiser (rails, wagonnet, pousseur, mineurs, générateur) ; enfin les améliorations les
// plus proches. Les urgences passent devant (salaires, coffre plein).

import { BATIMENTS, BLOCS, COUT_RAIL, LISTE_BATIMENTS, type Cout, type IdBatiment, type IdBloc } from './donnees'
import { batimentDebloque } from './batiments'
import { nbSansSalaire } from './employes'
import { generateurPose } from './generateur'
import { coffrePlein, disponible, nbDansCoffre, nbDansSac, peutPayer, type EtatJeu } from './mineur'
import { achatsPossibles } from './objectifs'
import { niveauJoueur, progressionNiveau, prochainDeblocage, railsDebloques } from './niveaux'
import { batimentPose } from './village'
import { ligneDe, railsAlimentes, trajetDe } from './wagonnet'

export type Mission = {
  id: string // pour la reconnaître d'une fois sur l'autre
  icone: string
  texte: string // « Récupère 25 pierre pour le Bazar »
  progression: { valeur: number; max: number; icone: string } | null // « 🪨 12 / 25 »
  stand: IdBatiment | null // où aller quand on la touche (null : rien de précis)
  construction: boolean // la toucher ouvre le menu Bâtiments
  pret: boolean // on peut la faire tout de suite
}

const NOMBRE_MAX = 3
// Au tout début : combien de blocs casser avant d'aller les vendre.
const BLOCS_DEBUT = 10

function mission(id: string, icone: string, texte: string, options: Partial<Mission> = {}): Mission {
  return { id, icone, texte, progression: null, stand: null, construction: false, pret: false, ...options }
}

// Ce qu'il manque pour payer un coût : d'abord l'argent, puis chaque minerai.
function ceQuiManque(etat: EtatJeu, cout: Cout): { icone: string; nom: string; valeur: number; max: number } | null {
  const prix = cout.argent ?? 0
  if (etat.argent < prix) return { icone: '💵', nom: '$', valeur: Math.floor(etat.argent), max: prix }
  for (const [id, nombre] of Object.entries(cout.materiaux)) {
    const bloc = id as IdBloc
    const besoin = nombre ?? 0
    const possede = disponible(etat, bloc)
    if (possede < besoin) return { icone: BLOCS[bloc].emoji, nom: BLOCS[bloc].nom.toLowerCase(), valeur: possede, max: besoin }
  }
  return null
}

// Une mission pour obtenir quelque chose qui coûte : « Gagne 60 $ pour X », « Récupère 25
// pierre pour X », ou, quand tout est là, la chose elle-même (prête).
function missionAchat(etat: EtatJeu, id: string, icone: string, nom: string, cout: Cout, options: Partial<Mission>): Mission {
  const manque = ceQuiManque(etat, cout)
  if (!manque) return mission(id, icone, nom, { ...options, pret: true })
  const texte = manque.nom === '$' ? `Gagne ${manque.max.toLocaleString('fr-FR')} $ : ${nom.toLowerCase()}` : `Récupère ${manque.max} ${manque.nom} : ${nom.toLowerCase()}`
  // Il manque des minerais : ils sortent de la mine.
  const ou = manque.nom === '$' ? (batimentPose(etat.village, 'marche') ? 'marche' : null) : 'puits'
  return mission(id, icone, texte, { ...options, construction: false, stand: ou, progression: { valeur: manque.valeur, max: manque.max, icone: manque.icone } })
}

// Les urgences : ce qui bloque la production.
function urgences(etat: EtatJeu): Mission[] {
  const liste: Mission[] = []
  const sansSalaire = nbSansSalaire(etat)
  if (sansSalaire > 0 && batimentPose(etat.village, 'employes')) {
    liste.push(mission('salaires', '😠', sansSalaire === 1 ? 'Paie ton mineur au Personnel' : `Paie tes ${sansSalaire} mineurs au Personnel`, { stand: 'employes', pret: true }))
  }
  if (coffrePlein(etat)) liste.push(mission('coffre-plein', '📦', 'Le coffre est plein : vide-le !', { stand: 'puits', pret: true }))
  return liste
}

// Les premiers pas : poser le marché, casser des blocs, les mettre dans le sac, les vendre.
function premiersPas(etat: EtatJeu): Mission | null {
  if (!batimentPose(etat.village, 'marche')) return mission('marche', '🏗️', 'Construis le marché (gratuit)', { construction: true, pret: true })
  if (etat.stats.argentGagne > 0) return null
  if (nbDansSac(etat) > 0) return mission('vendre', '💰', 'Vends ton sac au marché', { stand: 'marche', pret: true })
  if (etat.stats.blocsCasses < BLOCS_DEBUT && nbDansCoffre(etat) < BLOCS_DEBUT) {
    return mission('casser', '⛏️', `Casse ${BLOCS_DEBUT} blocs à la mine`, { stand: 'puits', progression: { valeur: etat.stats.blocsCasses, max: BLOCS_DEBUT, icone: '⛏️' } })
  }
  return mission('remplir-sac', '🎒', 'Mets les blocs du coffre dans ton sac', { stand: 'puits', pret: true })
}

// Le prochain bâtiment à construire (dans l'ordre du menu).
function prochainBatiment(etat: EtatJeu): Mission | null {
  const id = LISTE_BATIMENTS.find((b) => b !== 'marche' && batimentDebloque(etat, b) && !batimentPose(etat.village, b))
  if (!id) return null
  const info = BATIMENTS[id]
  return missionAchat(etat, `construire-${id}`, info.emoji, `Construis : ${info.nom}`, info.cout, { construction: true })
}

// L'automatisation, étape par étape.
function automatisation(etat: EtatJeu): Mission | null {
  if (!batimentPose(etat.village, 'marche') || etat.stats.argentGagne === 0) return null
  // (29/10) Les rails se débloquent au niveau 3 du joueur. On ne dit plus combien de fer
  // récupérer : ça dépend du chemin que le joueur choisira.
  if (!railsDebloques(etat)) return null
  if (!ligneDe(etat, 'mine-marche')) {
    const fer = COUT_RAIL.materiaux.fer ?? 3
    return mission('rails', '🛤️', `Pose des rails de la mine au marché (${fer} fer la case)`, { construction: true, pret: disponible(etat, 'fer') >= fer })
  }
  const trajet = trajetDe(etat, 'mine-marche')
  if (!trajet) return mission('trajet', '🚃', 'Touche la bulle 🛤️ sur les rails : automatise le trajet', { stand: 'puits', pret: true })
  const electrique = railsAlimentes(etat)
  const pousseur = etat.employes.some((e) => e.role === 'pousseur' && e.trajet === 'mine-marche')
  if (!pousseur && batimentPose(etat.village, 'employes')) return mission('pousseur', '👷', 'Embauche un pousseur pour le wagonnet', { stand: 'employes', pret: true })
  if (!etat.employes.some((e) => e.role === 'mineur') && batimentPose(etat.village, 'employes')) return mission('mineur', '⛏️', 'Embauche un mineur au Personnel', { stand: 'employes', pret: true })
  if (generateurPose(etat) && !electrique) {
    if (etat.generateur.carburant <= 0) return mission('allumer', '⚡', 'Mets de la redstone dans le générateur', { stand: 'generateur', pret: disponible(etat, 'redstone') > 0 })
    return mission('electrifier', '⚡', 'Mets tous les rails dans le rayon du générateur', { stand: 'generateur' })
  }
  if (batimentPose(etat.village, 'foreuse') && !trajetDe(etat, 'mine-foreuse')) {
    if (!ligneDe(etat, 'mine-foreuse')) return mission('rails-foreuse', '🛤️', 'Relie la foreuse à la mine (rails)', { construction: true })
    return mission('trajet-foreuse', '🚃', 'Touche la bulle 🛤️ sur les rails de la foreuse', { stand: 'puits', pret: true })
  }
  // (27/10) La foreuse vend toute seule son chariot : des rails jusqu'au marché.
  if (batimentPose(etat.village, 'foreuse') && !trajetDe(etat, 'foreuse-marche')) {
    if (!ligneDe(etat, 'foreuse-marche')) return mission('rails-foreuse-marche', '🛤️', 'Relie la foreuse au marché (rails) : elle vendra toute seule', { construction: true })
    return mission('trajet-foreuse-marche', '🚃', 'Touche la bulle 🛤️ sur les rails foreuse → marché', { stand: 'foreuse', pret: true })
  }
  return null
}

// Le prochain niveau du joueur, et ce qu'il débloque (29/10).
function prochainNiveau(etat: EtatJeu): Mission | null {
  const prochain = prochainDeblocage(etat)
  if (!prochain) return null
  const { xp, pourSuivant } = progressionNiveau(etat)
  const choses = prochain.choses.slice(0, 2).join(', ') + (prochain.choses.length > 2 ? '...' : '')
  // (si le niveau qui débloque est plus loin que le suivant, la jauge montre quand même le suivant)
  const texte = prochain.niveau === niveauJoueur(etat) + 1 ? `Niveau ${prochain.niveau} : ${choses}` : `Niveau ${prochain.niveau} (tu es ${niveauJoueur(etat)}) : ${choses}`
  return mission(`niveau-${prochain.niveau}`, '⭐', texte, { progression: pourSuivant ? { valeur: xp, max: pourSuivant, icone: '⭐' } : null })
}

// Les améliorations les plus proches (celles dont on a déjà la plus grande part de l'argent).
function ameliorations(etat: EtatJeu): Mission[] {
  const part = (cout: Cout) => (cout.argent ? Math.min(1, etat.argent / cout.argent) : 1)
  return achatsPossibles(etat)
    .filter((a) => !a.construction)
    .sort((a, b) => Number(peutPayer(etat, b.cout)) - Number(peutPayer(etat, a.cout)) || part(b.cout) - part(a.cout))
    .map((a) => missionAchat(etat, `ameliorer-${a.nom}`, '⬆️', a.nom, a.cout, { stand: a.stand }))
}

// « avant » : les missions affichées juste avant (leurs id). (30/10) Une mission affichée reste
// à sa place tant qu'elle n'est pas faite : la liste ne change plus d'un coup en pleine tâche
// (« économise pour le sac » qui devenait « récupère 40 fer »). Les nouvelles ne prennent que les
// places libres. Seules les urgences passent toujours devant.
export function missions(etat: EtatJeu, avant: string[] = []): Mission[] {
  const toutes = [...urgences(etat), premiersPas(etat), prochainBatiment(etat), automatisation(etat), ...ameliorations(etat).slice(0, 1), prochainNiveau(etat), ...ameliorations(etat).slice(1)].filter((m): m is Mission => m !== null)
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
