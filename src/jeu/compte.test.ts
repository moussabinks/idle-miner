import { describe, expect, it } from 'vitest'
import { aleatoireAvecGraine } from './aleatoire'
import {
  DOMAINE_COMPTES,
  choisirSynchro,
  ecrireDerniereSynchro,
  emailDuPseudo,
  erreurMotDePasse,
  erreurPseudo,
  lireDerniereSynchro,
  type SauvegardeEnLigne,
} from './compte'
import { creerPartie } from './mineur'
import { creerMonde, exporterTout, type SauvegardeComplete, type Stockage } from './sauvegarde'

// Un faux localStorage, en mémoire.
function fauxStockage(): Stockage {
  const donnees = new Map<string, string>()
  return {
    getItem: (cle) => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => void donnees.set(cle, valeur),
    removeItem: (cle) => void donnees.delete(cle),
  }
}

// Une copie de mondes, avec autant de mondes que demandé.
function copieAvec(nbMondes: number): SauvegardeComplete {
  const stockage = fauxStockage()
  for (let i = 0; i < nbMondes; i++) creerMonde(stockage, `Monde ${i + 1}`, creerPartie(aleatoireAvecGraine(i)))
  return exporterTout(stockage)
}

describe('pseudo et mot de passe', () => {
  it('accepte un pseudo simple', () => {
    expect(erreurPseudo('Noah_2004')).toBeNull()
    expect(erreurPseudo('  moussa-b  ')).toBeNull() // les espaces autour sont ignorés
  })

  it('refuse un pseudo trop court, trop long, ou avec des caractères spéciaux', () => {
    expect(erreurPseudo('ab')).not.toBeNull()
    expect(erreurPseudo('a'.repeat(17))).not.toBeNull()
    expect(erreurPseudo('Noé')).not.toBeNull()
    expect(erreurPseudo('mon pseudo')).not.toBeNull()
    expect(erreurPseudo('a@b')).not.toBeNull()
  })

  it('demande un mot de passe de 6 caractères au moins', () => {
    expect(erreurMotDePasse('12345')).not.toBeNull()
    expect(erreurMotDePasse('123456')).toBeNull()
  })

  it("fabrique la même adresse quelle que soit la casse du pseudo", () => {
    expect(emailDuPseudo(' Noah ')).toBe(`noah@${DOMAINE_COMPTES}`)
    expect(emailDuPseudo('NOAH')).toBe(emailDuPseudo('noah'))
  })
})

describe('synchronisation à la connexion', () => {
  const enLigne = (nbMondes: number, envoyeeLe = 1000): SauvegardeEnLigne => ({ parties: copieAvec(nbMondes), envoyeeLe })

  it("n'a rien à faire sans aucun monde", () => {
    expect(choisirSynchro({}, null, 'joueur', null)).toBe('rien')
    expect(choisirSynchro(copieAvec(0), enLigne(0), 'joueur', null)).toBe('rien')
  })

  it('envoie les mondes du navigateur sur un compte encore vide', () => {
    expect(choisirSynchro(copieAvec(2), null, 'joueur', null)).toBe('envoyer')
  })

  it('récupère les mondes du compte sur un navigateur vide', () => {
    expect(choisirSynchro(copieAvec(0), enLigne(3), 'joueur', null)).toBe('recuperer')
  })

  it('envoie sans demander si ce navigateur a fait le dernier échange avec ce compte', () => {
    expect(choisirSynchro(copieAvec(2), enLigne(2, 5000), 'joueur', { joueur: 'joueur', envoyeeLe: 5000 })).toBe('envoyer')
  })

  it("demande au joueur si quelqu'un a envoyé d'autres mondes depuis", () => {
    // Un autre appareil a envoyé ses mondes après le dernier échange de ce navigateur.
    expect(choisirSynchro(copieAvec(2), enLigne(2, 9000), 'joueur', { joueur: 'joueur', envoyeeLe: 5000 })).toBe('demander')
    // Ce navigateur a fait son dernier échange avec un autre compte.
    expect(choisirSynchro(copieAvec(2), enLigne(2, 5000), 'joueur', { joueur: 'autre', envoyeeLe: 5000 })).toBe('demander')
    // Jamais d'échange depuis ce navigateur.
    expect(choisirSynchro(copieAvec(1), enLigne(1), 'joueur', null)).toBe('demander')
  })

  it('retient le dernier échange dans le stockage', () => {
    const stockage = fauxStockage()
    expect(lireDerniereSynchro(stockage)).toBeNull()
    ecrireDerniereSynchro(stockage, { joueur: 'joueur', envoyeeLe: 1234 })
    expect(lireDerniereSynchro(stockage)).toEqual({ joueur: 'joueur', envoyeeLe: 1234 })
  })
})
