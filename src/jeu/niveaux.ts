// Le niveau du joueur (29/10) : on gagne de l'XP en jouant (casser des blocs, construire, poser
// des rails, automatiser, embaucher, améliorer...).
// (25/10) Les paliers : le niveau du joueur débloque les rails et les niveaux de la mine ; le
// niveau de la mine (le palier) débloque le même niveau de toutes les améliorations. Au palier 3,
// tout peut monter au niveau 3 : on améliore un niveau de chaque chose, puis on descend la mine.
// Chaque niveau du joueur gagné rapporte aussi des gemmes.
//
// Comment on compte l'XP : on regarde des « compteurs » de la partie (blocs cassés, bâtiments
// posés, cases de rails...) et on garde le plus haut chiffre déjà vu de chacun (etat.recordsXp).
// Quand un compteur dépasse son record, la différence rapporte de l'XP. Ainsi :
//   - il n'y a rien à ajouter dans chaque action : avancerTemps appelle mettreAJourXp ;
//   - retirer un rail puis le reposer, ou licencier puis réembaucher, ne redonne rien.

import {
  BATIMENTS,
  BLOCS,
  NIVEAUX_ASCENSEUR,
  NIVEAUX_CHARIOT,
  NIVEAUX_COFFRE,
  NIVEAUX_EMPLOYE,
  NIVEAUX_FORAGE,
  NIVEAUX_GENERATEUR,
  NIVEAUX_MANAGER,
  NIVEAUX_MINE,
  NIVEAUX_POUSSEUR,
  NIVEAUX_RECRUTEUR,
  NIVEAUX_CHARIOT_POUSSEUR,
  NIVEAU_JOUEUR_MAX,
  NIVEAU_JOUEUR_POUR,
  PALIER_CHEF,
  PIOCHES,
  PRIX_MANAGER,
  XP_PAR,
  VALEUR_PAR_XP,
  BLOCS_PAR_XP,
  xpPourPasser,
  type Cout,
  type IdBatiment,
  type IdBloc,
} from './donnees'
import { GEMMES_PAR_NIVEAU, gagnerGemmes } from './gemmes'
import type { EtatJeu } from './mineur'
import { t } from './langue'

// ---------------------------------------------------------------------------
// Le niveau à partir de l'XP
// ---------------------------------------------------------------------------

// L'XP totale qu'il faut pour être au niveau n (0 pour le niveau 1).
export function xpTotalePourNiveau(niveau: number): number {
  let total = 0
  for (let n = 1; n < niveau; n++) total += xpPourPasser(n)
  return total
}

export function niveauDeXp(xp: number): number {
  let niveau = 1
  while (niveau < NIVEAU_JOUEUR_MAX && xp >= xpTotalePourNiveau(niveau + 1)) niveau++
  return niveau
}

export function niveauJoueur(etat: EtatJeu): number {
  return niveauDeXp(etat.xp ?? 0)
}

// Pour la jauge du bandeau : l'XP gagnée dans ce niveau, et l'XP qu'il faut pour passer au suivant
// (null au niveau maximum).
export function progressionNiveau(etat: EtatJeu): { niveau: number; xp: number; pourSuivant: number | null } {
  const niveau = niveauJoueur(etat)
  const xp = Math.floor((etat.xp ?? 0) - xpTotalePourNiveau(niveau))
  return { niveau, xp, pourSuivant: niveau >= NIVEAU_JOUEUR_MAX ? null : xpPourPasser(niveau) }
}

// ---------------------------------------------------------------------------
// Ce qui est débloqué
// ---------------------------------------------------------------------------

// Les choses qui ont des niveaux. « mine » se débloque avec le niveau du joueur ; les chefs
// (recruteur, tempsManager) à un palier fixe (PALIER_CHEF) ; tout le reste avec le palier.
export type ChoseANiveaux = 'mine' | 'coffre' | 'pioches' | 'ascenseur' | 'equipement' | 'pousseur' | 'chariotPousseur' | 'tempsManager' | 'generateur' | 'forage' | 'chariot' | 'recruteur'

// Le niveau du joueur qu'il faut pour descendre la mine au niveau « index + 1 ».
export function niveauRequis(chose: 'mine', index: number): number {
  const liste = NIVEAU_JOUEUR_POUR[chose]
  return liste[Math.max(0, Math.min(index, liste.length - 1))]
}

export function niveauAtteint(etat: EtatJeu, requis: number): boolean {
  return niveauJoueur(etat) >= requis
}

// Le palier de la mine qu'il faut pour le niveau « index » d'une chose (index 0 : ce qu'on a au
// départ, ou l'embauche d'un chef). null pour la mine elle-même (elle demande un niveau du joueur).
export function palierRequis(chose: ChoseANiveaux, index: number): number | null {
  if (chose === 'mine') return null
  if (chose === 'recruteur') return PALIER_CHEF.recruteur[Math.max(0, Math.min(index, PALIER_CHEF.recruteur.length - 1))]
  if (chose === 'tempsManager') return PALIER_CHEF.manager[Math.max(0, Math.min(index, PALIER_CHEF.manager.length - 1))]
  return index + 1
}

// Peut-on acheter le niveau « index » de cette chose (sans compter le prix) ?
export function debloque(etat: EtatJeu, chose: ChoseANiveaux, index: number): boolean {
  if (chose === 'mine') return niveauAtteint(etat, niveauRequis('mine', index))
  return etat.niveauMine >= (palierRequis(chose, index) ?? 1)
}

// Le texte du cadenas (« ⭐ 7 » : le niveau du joueur qu'il faut, avec l'étoile de la barre du
// haut) ou null si c'est débloqué.
export function verrouNiveau(etat: EtatJeu, requis: number): string | null {
  return niveauAtteint(etat, requis) ? null : `⭐ ${requis}`
}

// Le cadenas d'un niveau d'amélioration : « 🕳️ Mine 3 » (le palier qu'il faut) ou « ⭐ 6 ».
export function verrou(etat: EtatJeu, chose: ChoseANiveaux, index: number): string | null {
  if (chose === 'mine') return verrouNiveau(etat, niveauRequis('mine', index))
  const palier = palierRequis(chose, index) ?? 1
  return etat.niveauMine >= palier ? null : t('🕳️ Mine {n}', { n: palier })
}

export function niveauPourBatiment(id: IdBatiment): number {
  return NIVEAU_JOUEUR_POUR.batiments[id] ?? 1
}

export function railsDebloques(etat: EtatJeu): boolean {
  return niveauAtteint(etat, NIVEAU_JOUEUR_POUR.rails)
}

// Tout ce qui se débloque à un niveau du joueur, en mots (pour la fête du passage de niveau, et
// pour dire au joueur ce qui l'attend). (25/10) Les améliorations suivent les paliers de la
// mine : un niveau du joueur débloque seulement des bâtiments, les rails ou un palier.
export function deblocagesDuNiveau(niveau: number): string[] {
  const liste: string[] = []
  for (const [id, requis] of Object.entries(NIVEAU_JOUEUR_POUR.batiments)) {
    if (requis === niveau && niveau > 1) liste.push(`${BATIMENTS[id as IdBatiment].emoji} ${t(BATIMENTS[id as IdBatiment].nom)}`)
  }
  if (NIVEAU_JOUEUR_POUR.rails === niveau) liste.push(t('🛤️ Les rails et les wagonnets'))
  NIVEAU_JOUEUR_POUR.mine.forEach((requis, i) => {
    if (requis === niveau && i > 0) liste.push(t('⛏️ Mine niveau {n} : {nom}', { n: NIVEAUX_MINE[i].niveau, nom: t(NIVEAUX_MINE[i].nom) }))
  })
  return liste
}

// Le prochain niveau qui débloque quelque chose (pour les missions) : son numéro et ce qu'il apporte.
export function prochainDeblocage(etat: EtatJeu): { niveau: number; choses: string[] } | null {
  for (let n = niveauJoueur(etat) + 1; n <= NIVEAU_JOUEUR_MAX; n++) {
    const choses = deblocagesDuNiveau(n)
    if (choses.length > 0) return { niveau: n, choses }
  }
  return null
}

// ---------------------------------------------------------------------------
// Gagner de l'XP
// ---------------------------------------------------------------------------

// (23/10) Ce que vaut un prix, en dollars : l'argent, plus les minerais à leur prix au marché.
function valeurCout(cout: Cout): number {
  return (cout.argent ?? 0) + Object.entries(cout.materiaux).reduce((total, [bloc, nombre]) => total + (nombre ?? 0) * BLOCS[bloc as IdBloc].prix, 0)
}

// La somme des prix des niveaux 1 à n d'une liste d'améliorations (le niveau 0, on l'a au départ).
function valeurNiveaux(liste: { cout: Cout }[], jusqua: number): number {
  let total = 0
  for (let i = 1; i <= Math.min(jusqua, liste.length - 1); i++) total += valeurCout(liste[i].cout)
  return total
}

// (23/10) Tout ce qu'on a acheté (bâtiments, niveaux de la mine, améliorations, pioches des
// employés, chefs), en dollars. Une amélioration rapporte de l'XP selon son prix : plus elle
// est chère (donc plus on avance), plus elle en rapporte. On n'est ainsi presque jamais bloqué
// faute d'XP : chaque niveau débloque des achats qui rapportent de quoi approcher le suivant.
export function valeurInvestie(etat: EtatJeu): number {
  let total = 0
  for (const b of etat.village.batiments) total += valeurCout(BATIMENTS[b.id].cout)
  total += valeurNiveaux(NIVEAUX_MINE, etat.niveauMine - 1)
  total += valeurNiveaux(NIVEAUX_COFFRE, etat.coffre.niveau)
  total += valeurNiveaux(PIOCHES, etat.meilleure)
  total += valeurNiveaux(NIVEAUX_ASCENSEUR, etat.ascenseur.niveau - 1)
  total += valeurNiveaux(NIVEAUX_FORAGE, etat.foreuse.niveauVitesse)
  total += valeurNiveaux(NIVEAUX_CHARIOT, etat.foreuse.niveauChariot)
  total += valeurNiveaux(NIVEAUX_GENERATEUR, etat.generateur.niveau)
  for (let i = 0; i < etat.recruteur; i++) total += valeurCout(NIVEAUX_RECRUTEUR[i].cout)
  if (etat.manager.embauche) total += PRIX_MANAGER + valeurNiveaux(NIVEAUX_MANAGER, etat.manager.niveau ?? 0)
  for (const e of etat.employes) {
    total += valeurNiveaux(e.role === 'pousseur' ? NIVEAUX_POUSSEUR : NIVEAUX_EMPLOYE, e.niveau)
    if (e.role === 'pousseur') total += valeurNiveaux(NIVEAUX_CHARIOT_POUSSEUR, e.chariot ?? 0)
  }
  return total
}

// Les compteurs de la partie qui rapportent de l'XP.
type Compteur = keyof typeof XP_PAR

function compteurs(etat: EtatJeu): Record<Compteur, number> {
  return {
    clics: Math.floor(etat.stats.blocsCasses / BLOCS_PAR_XP),
    batiment: etat.village.batiments.length,
    rail: etat.village.rails.length,
    trajet: etat.trajets.length,
    // (les embauches : on compte les mineurs qu'on a ; le record garde le plus grand nombre)
    embauche: etat.employes.length,
    amelioration:
      etat.coffre.niveau +
      etat.meilleure +
      etat.ascenseur.niveau +
      etat.foreuse.niveauVitesse +
      etat.foreuse.niveauChariot +
      etat.generateur.niveau +
      etat.recruteur +
      (etat.manager.embauche ? 1 : 0) +
      (etat.manager.niveau ?? 0) +
      etat.employes.reduce((total, e) => total + e.niveau + (e.chariot ?? 0), 0),
    niveauMine: etat.niveauMine,
    // (23/10) ce qu'on a acheté, selon le prix (plus c'est cher, plus ça rapporte). Plus d'XP pour
    // ce qui se fait tout seul (voyages des wagonnets, argent gagné) : rester AFK ne rapporte rien.
    investi: Math.floor(valeurInvestie(etat) / VALEUR_PAR_XP),
  }
}

// Les records de départ : ce qu'on a sans avoir rien fait (la mine est déjà posée, au niveau 1).
export function recordsDeDepart(etat: EtatJeu): Record<string, number> {
  return { ...compteurs(etat) }
}

// Compte l'XP gagnée depuis la dernière fois. Renvoie un message à chaque niveau gagné.
export function mettreAJourXp(etat: EtatJeu): string[] {
  if (etat.recordsXp === undefined) etat.recordsXp = recordsDeDepart(etat)
  const avant = niveauJoueur(etat)
  const actuels = compteurs(etat)
  for (const cle of Object.keys(actuels) as Compteur[]) {
    // (23/10) Une partie d'avant l'XP « selon le prix » reçoit l'XP de tout ce qu'elle a déjà
    // acheté (un joueur qui avait tout acheté était bloqué). Les autres nouveaux compteurs partent
    // de ce qu'elle a.
    const record = etat.recordsXp[cle] ?? (cle === 'investi' ? 0 : actuels[cle])
    if (actuels[cle] > record) {
      etat.xp = (etat.xp ?? 0) + (actuels[cle] - record) * XP_PAR[cle]
      etat.recordsXp[cle] = actuels[cle]
    } else if (etat.recordsXp[cle] === undefined) etat.recordsXp[cle] = actuels[cle]
  }
  const apres = niveauJoueur(etat)
  const messages: string[] = []
  for (let n = avant + 1; n <= apres; n++) {
    // (25/10) Chaque niveau gagné rapporte des gemmes.
    gagnerGemmes(etat, GEMMES_PAR_NIVEAU)
    const choses = deblocagesDuNiveau(n)
    // (25/10) Le message commence toujours par « 🎉 » : l'interface le reconnaît ainsi (usePartie.ts),
    // dans toutes les langues.
    messages.push(
      choses.length > 0
        ? t('🎉 Niveau {n} ! +{gemmes} 💎 Débloqué : {choses}.', { n, gemmes: GEMMES_PAR_NIVEAU, choses: choses.join(', ') })
        : t('🎉 Niveau {n} ! +{gemmes} 💎', { n, gemmes: GEMMES_PAR_NIVEAU }),
    )
  }
  return messages
}

// ---------------------------------------------------------------------------
// Les parties d'avant le niveau du joueur (version 23)
// ---------------------------------------------------------------------------

// Le niveau qu'il faut pour tout ce que la partie possède déjà : une vieille partie le reçoit,
// pour que rien de ce qu'elle a ne soit « trop en avance ».
export function niveauPourCeQuOnA(etat: EtatJeu): number {
  const niveaux = [1]
  for (const b of etat.village.batiments) niveaux.push(niveauPourBatiment(b.id))
  if (etat.village.rails.length > 0) niveaux.push(NIVEAU_JOUEUR_POUR.rails)
  if (etat.niveauMine > 1) niveaux.push(niveauRequis('mine', etat.niveauMine - 1))
  return Math.max(...niveaux)
}

// Donne à une vieille partie l'XP du niveau qu'il lui faut (le reste viendra en jouant).
export function donnerXpAVieillePartie(etat: EtatJeu): void {
  etat.xp = xpTotalePourNiveau(niveauPourCeQuOnA(etat))
  etat.recordsXp = recordsDeDepart(etat)
}
