import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { poserSol } from './batiments'
import { BLOCS, type IdBatiment } from './donnees'
import { creerPartie, type EtatJeu } from './mineur'
import { prochainObjectif, standsAchetables } from './objectifs'

const nomBloc = (bloc: keyof typeof BLOCS) => BLOCS[bloc].nom

// Les bâtiments posés « à la main » (sans les payer), à des places libres autour de la mine.
const PLACES: Record<Exclude<IdBatiment, 'puits'>, [number, number]> = {
  marche: [28, 40],
  forgeron: [36, 24],
  bazar: [19, 25],
  employes: [19, 31],
  foreuse: [36, 31],
  generateur: [35, 37],
}

function poser(etat: EtatJeu, ids: (keyof typeof PLACES)[]): void {
  for (const id of ids) etat.village.batiments.push({ id, x: PLACES[id][0], y: PLACES[id][1], miroir: false })
}

describe('prochain objectif', () => {
  it('tout au début : poser le marché (gratuit), puis construire le forgeron', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Construire : Marché', stand: 'marche', pret: true, construction: true })
    poser(etat, ['marche'])
    etat.argent = 10
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Construire : Forgeron', detail: '10 / 20 $', construction: true })
  })

  it('dès qu’on a du fer : relier la mine au marché avec des rails', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'bazar', 'employes'])
    etat.coffre.contenu = { fer: 2 }
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Relier la mine au marché', construction: true })
    etat.inventaire = { fer: 15 }
    for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
    expect(prochainObjectif(etat, nomBloc)?.texte).not.toBe('Relier la mine au marché')
  })

  it('montre ce qui est payable tout de suite, au bon bâtiment', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    poser(etat, ['marche', 'forgeron', 'bazar', 'employes'])
    etat.argent = 200
    etat.coffre.contenu = { fer: 25 }
    expect(prochainObjectif(etat, nomBloc)).toMatchObject({ texte: 'Pioche en Fer', stand: 'forgeron', pret: true })
    expect(standsAchetables(etat)).toEqual(expect.arrayContaining(['forgeron', 'employes']))
  })

  it('le générateur posé mais vide : il faut l’allumer avec de la redstone', () => {
    const etat = creerPartie(aleatoireAvecGraine(1))
    etat.niveauMine = 5
    poser(etat, ['marche', 'forgeron', 'bazar', 'employes', 'foreuse', 'generateur'])
    etat.inventaire = { fer: 15 }
    for (let y = 35; y <= 39; y++) poserSol(etat, 'rail', 30, y)
    expect(prochainObjectif(etat, nomBloc)?.stand).not.toBeNull()
  })
})
