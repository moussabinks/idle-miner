// Le niveau du joueur (29/10) : on gagne de l'XP en jouant (casser des blocs, construire, poser
// des rails, automatiser, embaucher, améliorer...), et chaque niveau débloque de nouveaux
// bâtiments et de nouveaux niveaux d'amélioration (qu'il faut ensuite payer).
//
// Comment on compte l'XP : on regarde des « compteurs » de la partie (blocs cassés, bâtiments
// posés, cases de rails...) et on garde le plus haut chiffre déjà vu de chacun (etat.recordsXp).
// Quand un compteur dépasse son record, la différence rapporte de l'XP. Ainsi :
//   - il n'y a rien à ajouter dans chaque action : avancerTemps appelle mettreAJourXp ;
//   - retirer un rail puis le reposer, ou licencier puis réembaucher, ne redonne rien.

import {
  BATIMENTS,
  NIVEAUX_ASCENSEUR,
  NIVEAUX_CHARIOT,
  NIVEAUX_COFFRE,
  NIVEAUX_EMPLOYE,
  NIVEAUX_FORAGE,
  NIVEAUX_GENERATEUR,
  NIVEAUX_MINE,
  NIVEAUX_WAGONNET,
  NIVEAU_JOUEUR_MAX,
  NIVEAU_JOUEUR_POUR,
  PIOCHES,
  SACS,
  XP_PAR,
  xpPourPasser,
  type IdBatiment,
} from './donnees'
import type { EtatJeu } from './mineur'

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

// Les choses qui se débloquent par niveau, avec un tableau (case i : le niveau qu'il faut pour
// en acheter le niveau i).
export type ChoseANiveaux = 'mine' | 'coffre' | 'pioches' | 'sacs' | 'ascenseur' | 'equipement' | 'wagonnet' | 'generateur' | 'forage' | 'chariot' | 'recruteur'

// Le niveau du joueur qu'il faut pour acheter le niveau « index » de cette chose.
export function niveauRequis(chose: ChoseANiveaux, index: number): number {
  const liste = NIVEAU_JOUEUR_POUR[chose]
  return liste[Math.max(0, Math.min(index, liste.length - 1))]
}

export function niveauAtteint(etat: EtatJeu, requis: number): boolean {
  return niveauJoueur(etat) >= requis
}

// Peut-on acheter le niveau « index » de cette chose (sans compter le prix) ?
export function debloque(etat: EtatJeu, chose: ChoseANiveaux, index: number): boolean {
  return niveauAtteint(etat, niveauRequis(chose, index))
}

// Le texte du cadenas (« au niveau 7 ») ou null si c'est débloqué.
export function verrouNiveau(etat: EtatJeu, requis: number): string | null {
  return niveauAtteint(etat, requis) ? null : `au niveau ${requis}`
}

export function verrou(etat: EtatJeu, chose: ChoseANiveaux, index: number): string | null {
  return verrouNiveau(etat, niveauRequis(chose, index))
}

export function niveauPourBatiment(id: IdBatiment): number {
  return NIVEAU_JOUEUR_POUR.batiments[id] ?? 1
}

export function railsDebloques(etat: EtatJeu): boolean {
  return niveauAtteint(etat, NIVEAU_JOUEUR_POUR.rails)
}

// Tout ce qui se débloque à un niveau donné, en mots (pour la fête du passage de niveau, et
// pour dire au joueur ce qui l'attend).
export function deblocagesDuNiveau(niveau: number): string[] {
  const liste: string[] = []
  for (const [id, requis] of Object.entries(NIVEAU_JOUEUR_POUR.batiments)) {
    if (requis === niveau && niveau > 1) liste.push(`${BATIMENTS[id as IdBatiment].emoji} ${BATIMENTS[id as IdBatiment].nom}`)
  }
  if (NIVEAU_JOUEUR_POUR.rails === niveau) liste.push('🛤️ Les rails et les wagonnets')
  if (NIVEAU_JOUEUR_POUR.manager === niveau) liste.push('💼 Le manager')
  const parNiveau: [ChoseANiveaux, (i: number) => string][] = [
    ['mine', (i) => `⛏️ Mine niveau ${NIVEAUX_MINE[i].niveau} : ${NIVEAUX_MINE[i].nom}`],
    ['pioches', (i) => `⛏️ Pioche en ${PIOCHES[i].nom}`],
    ['coffre', (i) => `📦 Coffre de ${NIVEAUX_COFFRE[i].capacite.toLocaleString('fr-FR')} places`],
    ['sacs', (i) => `🎒 Sac de ${SACS[i].taille.toLocaleString('fr-FR')} places`],
    ['ascenseur', (i) => (i === 0 ? '🛗 L’ascenseur' : `🛗 Ascenseur niveau ${NIVEAUX_ASCENSEUR[i].niveau}`)],
    ['equipement', (i) => `👷 Pioche en ${NIVEAUX_EMPLOYE[i].nom} pour les mineurs`],
    ['wagonnet', (i) => `🚃 Wagonnets de ${NIVEAUX_WAGONNET[i].capacite} places`],
    ['generateur', (i) => `⚡ Générateur : rayon ${NIVEAUX_GENERATEUR[i].rayon} cases`],
    ['forage', (i) => `⚙️ Forage ${NIVEAUX_FORAGE[i].vitesse} blocs/s`],
    ['chariot', (i) => `🛒 Chariot de ${NIVEAUX_CHARIOT[i].capacite.toLocaleString('fr-FR')} places`],
    ['recruteur', (i) => (i === 0 ? '🎩 Le recruteur' : `🎩 Recruteur niveau ${i + 1}`)],
  ]
  for (const [chose, nom] of parNiveau) {
    NIVEAU_JOUEUR_POUR[chose].forEach((requis, i) => {
      // (la case 0 est ce qu'on a au départ, sauf pour l'ascenseur et le recruteur, qui s'achètent)
      const achete = i > 0 || chose === 'ascenseur' || chose === 'recruteur'
      if (requis === niveau && achete && niveau > 1) liste.push(nom(i))
    })
  }
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

// Les compteurs de la partie qui rapportent de l'XP.
type Compteur = keyof typeof XP_PAR

function compteurs(etat: EtatJeu): Record<Compteur, number> {
  return {
    bloc: etat.stats.blocsCasses,
    batiment: etat.village.batiments.length,
    rail: etat.village.rails.length,
    trajet: etat.trajets.length,
    // (les embauches : on compte les mineurs qu'on a ; le record garde le plus grand nombre)
    embauche: etat.employes.length,
    amelioration:
      etat.coffre.niveau +
      etat.meilleure +
      etat.niveauSac +
      etat.ascenseur.niveau +
      etat.niveauWagonnets +
      etat.foreuse.niveauVitesse +
      etat.foreuse.niveauChariot +
      etat.generateur.niveau +
      etat.recruteur +
      (etat.manager.embauche ? 1 : 0) +
      etat.employes.reduce((total, e) => total + e.niveau, 0),
    niveauMine: etat.niveauMine,
    voyage: etat.stats.voyagesWagonnet,
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
    const record = etat.recordsXp[cle] ?? actuels[cle]
    if (actuels[cle] > record) {
      etat.xp = (etat.xp ?? 0) + (actuels[cle] - record) * XP_PAR[cle]
      etat.recordsXp[cle] = actuels[cle]
    } else if (etat.recordsXp[cle] === undefined) etat.recordsXp[cle] = actuels[cle]
  }
  const apres = niveauJoueur(etat)
  const messages: string[] = []
  for (let n = avant + 1; n <= apres; n++) {
    const choses = deblocagesDuNiveau(n)
    messages.push(`🎉 Niveau ${n} !${choses.length > 0 ? ` Débloqué : ${choses.join(', ')}.` : ''}`)
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
  const pour = (chose: ChoseANiveaux, index: number) => {
    if (index > 0) niveaux.push(niveauRequis(chose, index))
  }
  for (const b of etat.village.batiments) niveaux.push(niveauPourBatiment(b.id))
  if (etat.village.rails.length > 0) niveaux.push(NIVEAU_JOUEUR_POUR.rails)
  pour('mine', etat.niveauMine - 1)
  pour('coffre', etat.coffre.niveau)
  pour('pioches', etat.meilleure)
  pour('sacs', etat.niveauSac)
  if (etat.ascenseur.niveau > 0) niveaux.push(niveauRequis('ascenseur', etat.ascenseur.niveau - 1))
  for (const e of etat.employes) pour('equipement', e.niveau)
  pour('wagonnet', etat.niveauWagonnets)
  pour('generateur', etat.generateur.niveau)
  pour('forage', etat.foreuse.niveauVitesse)
  pour('chariot', etat.foreuse.niveauChariot)
  if (etat.recruteur > 0) niveaux.push(niveauRequis('recruteur', etat.recruteur - 1))
  if (etat.manager.embauche) niveaux.push(NIVEAU_JOUEUR_POUR.manager)
  return Math.max(...niveaux)
}

// Donne à une vieille partie l'XP du niveau qu'il lui faut (le reste viendra en jouant).
export function donnerXpAVieillePartie(etat: EtatJeu): void {
  etat.xp = xpTotalePourNiveau(niveauPourCeQuOnA(etat))
  etat.recordsXp = recordsDeDepart(etat)
}
