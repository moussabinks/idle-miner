// Archivé le 22/10 : les enchantements (données et règles), retirés du jeu pour l'instant.
// Ils pourront revenir pour améliorer les mineurs (Fortune, Efficacité...).

// ---------------------------------------------------------------------------
// Enchantements (formules de Minecraft)
// ---------------------------------------------------------------------------

export type IdEnchantement = 'efficacite' | 'fortune' | 'solidite'

export type Enchantement = {
  id: IdEnchantement
  nom: string
  description: string
  niveauMax: number
  // Coût du niveau n : (argent × n × n) + (lapis × n) + (émeraudes × n).
  // L'argent grandit vite (n²) : les derniers niveaux, gardés de prestige en prestige, se méritent.
  argentParNiveau: number
  lapisParNiveau: number
  emeraudesParNiveau: number
}

export const ENCHANTEMENTS: Record<IdEnchantement, Enchantement> = {
  efficacite: {
    id: 'efficacite',
    nom: 'Efficacité',
    description: '+25 % de vitesse par niveau',
    niveauMax: 5,
    argentParNiveau: 400,
    lapisParNiveau: 3,
    emeraudesParNiveau: 1,
  },
  fortune: {
    id: 'fortune',
    nom: 'Fortune',
    description: '20 % de chance par niveau de doubler un minerai',
    niveauMax: 3,
    argentParNiveau: 600,
    lapisParNiveau: 4,
    emeraudesParNiveau: 1,
  },
  solidite: {
    id: 'solidite',
    nom: 'Solidité',
    description: "La pioche s'use moins vite",
    niveauMax: 3,
    argentParNiveau: 300,
    lapisParNiveau: 3,
    emeraudesParNiveau: 1,
  },
}

export const LISTE_ENCHANTEMENTS: IdEnchantement[] = ['efficacite', 'fortune', 'solidite']


// Coût du prochain niveau d'un enchantement (null s'il est déjà au max).
export function coutEnchantement(etat: EtatJeu, id: IdEnchantement): Cout | null {
  const e = ENCHANTEMENTS[id]
  const prochain = etat.enchantements[id] + 1
  if (prochain > e.niveauMax) return null
  return {
    argent: e.argentParNiveau * prochain * prochain,
    materiaux: { lapis: e.lapisParNiveau * prochain, emeraude: e.emeraudesParNiveau * prochain },
  }
}

// Le prochain niveau est-il bloqué par le prestige ? Renvoie le prestige qu'il faut (null = pas bloqué).
export function enchantementBloqueAuPrestige(etat: EtatJeu, id: IdEnchantement): number | null {
  const prochain = etat.enchantements[id] + 1
  if (coutEnchantement(etat, id) === null || prochain <= niveauMaxAuPrestige(id, etat.prestige)) return null
  return prestigePourNiveau(id, prochain)
}

export function peutEnchanter(etat: EtatJeu, id: IdEnchantement): boolean {
  const cout = coutEnchantement(etat, id)
  return cout !== null && enchantementBloqueAuPrestige(etat, id) === null && peutPayer(etat, cout)
}

// Reste-t-il un enchantement à prendre à ce prestige ?
export function peutEncoreEnchanter(etat: EtatJeu): boolean {
  return LISTE_ENCHANTEMENTS.some((id) => coutEnchantement(etat, id) !== null && enchantementBloqueAuPrestige(etat, id) === null)
}

export function enchanter(etat: EtatJeu, id: IdEnchantement): string[] {
  const cout = coutEnchantement(etat, id)
  if (!aLaSurface(etat) || cout === null || !peutEnchanter(etat, id)) return []
  payer(etat, cout)
  etat.enchantements[id] += 1
  return [`✨ ${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])} !`]
}

