// Les icônes du jeu (stands du village, arbre de prestige...) : des émojis bien ronds,
// dans un style cartoon (choix du 19/10 : plus de pixel art, pour ne pas ressembler à Minecraft).

export type NomIcone = 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'foreuse' | 'cadenas' | 'etoile' | 'employes'

const EMOJIS: Record<NomIcone, string> = {
  marche: '💰',
  forgeron: '⚒️',
  bazar: '🎒',
  enchanteur: '🔮',
  foreuse: '⚙️',
  cadenas: '🔒',
  etoile: '⭐',
  employes: '👷',
}

export function Icone({ nom, taille = 32 }: { nom: NomIcone; taille?: number }) {
  return (
    <span className="icone" style={{ fontSize: Math.round(taille * 0.82), width: taille, height: taille }} aria-hidden="true">
      {EMOJIS[nom]}
    </span>
  )
}
