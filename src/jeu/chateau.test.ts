import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import { chateauRestaure, finDuJeuProche, peutRestaurerChateau, queteChateauVisible, restaurerChateau } from './chateau'
import { LISTE_BATIMENTS, NIVEAU_MINE_MAX, PRIX_CHATEAU } from './donnees'
import { partieDeTest } from './partieDeTest'
import { charger, sauvegarder, type Stockage } from './sauvegarde'
import { verifierSucces } from './succes'

// Une partie à la fin du jeu : la mine tout au fond et tous les bâtiments posés.
function finDePartie() {
  const etat = partieDeTest(aleatoireAvecGraine(1))
  etat.niveauMine = NIVEAU_MINE_MAX
  LISTE_BATIMENTS.forEach((id, i) => etat.village.batiments.push({ id, x: 1 + (i % 4) * 6, y: 28 + Math.floor(i / 4) * 6, miroir: false }))
  return etat
}

describe('le château de la quête finale (27/10)', () => {
  it('est en ruine au début de la partie, et sa quête est cachée', () => {
    const etat = partieDeTest(aleatoireAvecGraine(1))
    expect(chateauRestaure(etat)).toBe(false)
    expect(queteChateauVisible(etat)).toBe(false)
  })

  it('la quête apparaît à la fin du jeu : mine au niveau 7 et tous les bâtiments posés', () => {
    const etat = finDePartie()
    expect(finDuJeuProche(etat)).toBe(true)
    expect(queteChateauVisible(etat)).toBe(true)
    // Un bâtiment manquant, ou la mine pas tout au fond : pas encore.
    const sansJoaillerie = finDePartie()
    sansJoaillerie.village.batiments = sansJoaillerie.village.batiments.filter((b) => b.id !== 'joaillerie')
    expect(queteChateauVisible(sansJoaillerie)).toBe(false)
    const pasAuFond = finDePartie()
    pasAuFond.niveauMine = NIVEAU_MINE_MAX - 1
    expect(queteChateauVisible(pasAuFond)).toBe(false)
  })

  it('coûte 10 millions, payés en argent', () => {
    const etat = finDePartie()
    etat.argent = PRIX_CHATEAU - 1
    expect(peutRestaurerChateau(etat)).toBe(false)
    restaurerChateau(etat)
    expect(chateauRestaure(etat)).toBe(false)
    etat.argent = PRIX_CHATEAU + 500
    etat.stats.tempsDeJeu = 3600
    restaurerChateau(etat)
    expect(chateauRestaure(etat)).toBe(true)
    expect(etat.argent).toBe(500)
    expect(etat.chateau?.tempsDeJeu).toBe(3600)
    // Une seule fois, et la quête disparaît.
    expect(peutRestaurerChateau(etat)).toBe(false)
    expect(queteChateauVisible(etat)).toBe(false)
  })

  it('donne le succès « Châtelain » et reste restauré après une sauvegarde', () => {
    const etat = finDePartie()
    etat.argent = PRIX_CHATEAU
    restaurerChateau(etat)
    expect(verifierSucces(etat).map((s) => s.id)).toContain('chateau')
    const donnees = new Map<string, string>()
    const stockage: Stockage = { getItem: (k) => donnees.get(k) ?? null, setItem: (k, v) => void donnees.set(k, v), removeItem: (k) => void donnees.delete(k) }
    sauvegarder(stockage, 'a', etat)
    expect(charger(stockage, 'a')?.chateau?.restaure).toBe(true)
  })
})
