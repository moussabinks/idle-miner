import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { BLOCS } from './donnees'
import { creerPartie, prestige, type EtatJeu } from './mineur'
import type { IdBatiment } from './donnees'
import { marquerStandVu, prochainObjectif, standsAchetables, standsAvecNouveauxNiveaux } from './objectifs'

const nomBloc = (bloc: keyof typeof BLOCS) => BLOCS[bloc].nom

// Les bâtiments posés « à la main » (sans les payer), à des places libres autour de la mine.
const PLACES: Record<Exclude<IdBatiment, 'puits'>, [number, number]> = {
  marche: [18, 26],
  forgeron: [26, 18],
  bazar: [12, 26],
  enchanteur: [26, 12],
  prestige: [9, 9],
  foreuse: [3, 3],
  employes: [30, 30],
}

function poser(etat: EtatJeu, ids: (keyof typeof PLACES)[]): void {
  for (const id of ids) etat.village.batiments.push({ id, x: PLACES[id][0], y: PLACES[id][1], miroir: false })
}

// Une partie où tous les bâtiments débloqués sont déjà posés.
function partie(niveauPrestige: number, argent = 0): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1), niveauPrestige)
  etat.argent = argent
  poser(etat, ['marche', 'forgeron', 'bazar', 'enchanteur', 'prestige', 'foreuse', 'employes'])
  return etat
}

describe('prochain objectif', () => {
  it('tout au début : poser le marché (gratuit), puis construire le forgeron', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Construire : Marché', stand: 'marche', pret: true, construction: true })
    poser(etat, ['marche'])
    etat.argent = 10
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Construire : Forgeron', detail: '10 / 20 $', construction: true })
  })

  it('au tout début : la pioche en pierre, avec l’argent qu’il reste à gagner', () => {
    const etat = partie(0, 25)
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Pioche en Pierre', detail: '25 / 40 $', stand: 'forgeron', pret: false })
  })

  it('dès qu’on peut l’acheter, il le dit et brille', () => {
    const etat = partie(0, 40)
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Pioche en Pierre', stand: 'forgeron', pret: true })
  })

  it('dit quel minerai manque', () => {
    const etat = partie(0, 1_000_000)
    etat.meilleure = 2
    etat.pioches = { 0: 0, 1: 0, 2: 0 }
    etat.ascenseur.niveau = 2
    etat.niveauSac = 2
    etat.enchantements = { efficacite: 1, fortune: 1, solidite: 1 }
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Pioche en Diamant', detail: 'il manque 3 Diamant' })
  })

  it('quand tout est fait : la bedrock, puis le prestige', () => {
    const etat = partie(0)
    etat.meilleure = 4
    etat.ascenseur.niveau = 2
    etat.niveauSac = 2
    etat.enchantements = { efficacite: 1, fortune: 1, solidite: 1 }
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Atteindre la bedrock', stand: null })
    etat.victoire = true
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Prestige 1', stand: 'prestige', pret: true })
  })
})

describe('stands', () => {
  it('« Achetable ! » sur les bâtiments posés où une amélioration est payable', () => {
    expect(standsAchetables(partie(0, 0))).toEqual([])
    expect(standsAchetables(partie(0, 100))).toEqual(['forgeron', 'bazar'])
    // Sans bâtiment posé, rien n'est « achetable » sur la carte (ça passe par le menu Bâtiments).
    const vide = creerPartie(aleatoireAvecGraine(1))
    vide.argent = 100
    expect(standsAchetables(vide)).toEqual([])
  })

  it('« Nouveaux niveaux ! » après un prestige, jusqu’à ce qu’on passe devant', () => {
    const p0 = partie(0)
    expect(standsAvecNouveauxNiveaux(p0)).toEqual([])
    p0.victoire = true
    const p1 = prestige(p0, aleatoireAvecGraine(2))
    // Au prestige 1 : seulement l'ascenseur (la foreuse vient d'ouvrir : c'est une nouveauté, pas un nouveau niveau).
    expect(standsAvecNouveauxNiveaux(p1)).toEqual(['puits'])
    marquerStandVu(p1, 'puits')
    expect(standsAvecNouveauxNiveaux(p1)).toEqual([])
    // Au prestige 2, tout revient : ascenseur, sac, enchantements (II) et foreuse (niveau 2).
    const p2 = prestige(p1, aleatoireAvecGraine(3))
    expect(standsAvecNouveauxNiveaux(p2)).toEqual(['puits', 'bazar', 'enchanteur', 'foreuse'])
  })
})
