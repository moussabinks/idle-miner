// Les icônes du jeu (stands du village...) : des émojis bien ronds,
// dans un style cartoon (choix du 19/10 : plus de pixel art, pour ne pas ressembler à Minecraft).
// Le stand Personnel a son propre dessin (20/10) : deux mineurs avec leur casque.

export type NomIcone = 'marche' | 'forgeron' | 'bazar' | 'enchanteur' | 'foreuse' | 'cadenas' | 'etoile' | 'employes' | 'recrutement'

const EMOJIS: Record<Exclude<NomIcone, 'employes'>, string> = {
  marche: '💰',
  forgeron: '⚒️',
  bazar: '🎒',
  enchanteur: '🔮',
  foreuse: '⚙️',
  cadenas: '🔒',
  etoile: '⭐',
  recrutement: '🎩',
}

// Le dessin du stand Personnel : deux mineurs souriants, casque de chantier et lampe frontale.
function DessinPersonnel({ taille }: { taille: number }) {
  return (
    <svg className="icone icone-dessin" width={taille} height={taille} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="casque-jaune" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="1" stopColor="#f2a91c" />
        </linearGradient>
        <linearGradient id="casque-orange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa25c" />
          <stop offset="1" stopColor="#d9601f" />
        </linearGradient>
        <radialGradient id="lampe" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#fff3b0" />
          <stop offset="1" stopColor="#f2c230" />
        </radialGradient>
      </defs>
      {/* Le mineur du fond (casque orange) */}
      <path d="M4 62 Q6 48 20 46 Q32 48 34 62 Z" fill="#3a6fb5" />
      <circle cx="19" cy="35" r="10" fill="#e9b184" />
      <circle cx="15.5" cy="35" r="1.4" fill="#3b2a20" />
      <circle cx="22.5" cy="35" r="1.4" fill="#3b2a20" />
      <path d="M15 39 Q19 42 23 39" stroke="#3b2a20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M8 31 Q9 19 19 19 Q29 19 30 31 Z" fill="url(#casque-orange)" stroke="#9a3f12" strokeWidth="1.2" />
      <rect x="6" y="29.5" width="26" height="4" rx="2" fill="#c24f17" />
      {/* Le mineur de devant (casque jaune et lampe frontale) */}
      <path d="M22 64 Q24 47 40 45 Q56 47 60 64 Z" fill="#2f5d9e" />
      <rect x="35" y="47" width="10" height="9" rx="2" fill="#244a80" />
      <circle cx="41" cy="34" r="12" fill="#f2c193" />
      <circle cx="36.5" cy="34.5" r="1.6" fill="#3b2a20" />
      <circle cx="45.5" cy="34.5" r="1.6" fill="#3b2a20" />
      <circle cx="34.5" cy="38.5" r="2" fill="#f29a8a" opacity="0.7" />
      <circle cx="47.5" cy="38.5" r="2" fill="#f29a8a" opacity="0.7" />
      <path d="M36 39.5 Q41 44 46 39.5" stroke="#3b2a20" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M27 29 Q28 13 41 13 Q54 13 55 29 Z" fill="url(#casque-jaune)" stroke="#a86a0c" strokeWidth="1.3" />
      <path d="M41 13.5 L41 28" stroke="#d98e12" strokeWidth="2" />
      <rect x="24.5" y="27" width="33" height="4.5" rx="2.2" fill="#e0920f" stroke="#a86a0c" strokeWidth="1" />
      <circle cx="41" cy="21" r="4.2" fill="url(#lampe)" stroke="#8a5a0a" strokeWidth="1.2" />
      {/* Un petit reflet sur le casque */}
      <path d="M31 22 Q33 16 38 15" stroke="#fff6c2" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

export function Icone({ nom, taille = 32 }: { nom: NomIcone; taille?: number }) {
  if (nom === 'employes') return <DessinPersonnel taille={taille} />
  return (
    <span className="icone" style={{ fontSize: Math.round(taille * 0.82), width: taille, height: taille }} aria-hidden="true">
      {EMOJIS[nom]}
    </span>
  )
}
