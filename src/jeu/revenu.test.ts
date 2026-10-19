import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { embaucher, profondeurMaxEmploye } from './employes'
import { activerForeuse } from './foreuse'
import { creerPartie, positionFront, type EtatJeu } from './mineur'
import { revenuParSeconde, valeurMoyenneBloc } from './revenu'
import { avancerTemps } from './temps'

function partie(prestige: number): EtatJeu {
  const etat = creerPartie(aleatoireAvecGraine(1), prestige)
  etat.argent = 1_000_000
  return etat
}

describe('argent généré par seconde', () => {
  it('vaut 0 au début, quand rien ne travaille', () => {
    expect(revenuParSeconde(partie(0), false).total).toBe(0)
  })

  it('compte ce que tu creuses, au fond de la mine', () => {
    const etat = partie(0)
    expect(revenuParSeconde(etat, true).joueur).toBe(0) // au village : tu ne creuses pas
    etat.position = positionFront(etat)
    etat.cible = etat.position
    expect(revenuParSeconde(etat, true).joueur).toBeGreaterThan(0)
    expect(revenuParSeconde(etat, false).joueur).toBe(0)
  })

  it('les blocs valent plus en profondeur, et encore plus avec Fortune', () => {
    expect(valeurMoyenneBloc(60, 1)).toBeGreaterThan(valeurMoyenneBloc(5, 1))
    expect(valeurMoyenneBloc(60, 1, 3)).toBeGreaterThan(valeurMoyenneBloc(60, 1))
  })

  it('compte la foreuse seulement quand elle tourne', () => {
    const etat = partie(1)
    etat.inventaire = { fer: 10, redstone: 5 }
    activerForeuse(etat)
    expect(revenuParSeconde(etat, false).foreuse).toBe(0) // pas de charbon
    etat.foreuse.carburant = 100
    expect(revenuParSeconde(etat, false).foreuse).toBeGreaterThan(0)
  })

  it('compte les mineurs, plus vite avec l’ascenseur', () => {
    const etat = partie(4)
    embaucher(etat)
    etat.employes[0].niveau = 3
    etat.employes[0].profondeur = 110
    const sansAscenseur = revenuParSeconde(etat, false).mineurs
    etat.ascenseur.niveau = 6
    expect(sansAscenseur).toBeGreaterThan(0)
    expect(revenuParSeconde(etat, false).mineurs).toBeGreaterThan(sansAscenseur)
  })

  it('ressemble à ce que les mineurs rapportent vraiment', () => {
    const etat = partie(3)
    embaucher(etat)
    etat.employes[0].niveau = 2
    // Au fond de ce que permet sa pioche : il reste à cette profondeur pendant tout le test.
    etat.employes[0].profondeur = profondeurMaxEmploye(etat, etat.employes[0])
    etat.employes[0].etape = 'creuse'
    const estimation = revenuParSeconde(etat, false).mineurs
    const avant = etat.argent
    avancerTemps(etat, 3600, aleatoireAvecGraine(7))
    const reel = (etat.argent - avant) / 3600
    expect(reel).toBeGreaterThan(estimation * 0.75)
    expect(reel).toBeLessThan(estimation * 1.25)
  })
})
