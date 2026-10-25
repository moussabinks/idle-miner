// Une jauge avec son texte par-dessus (« 120 / 300 », « Plein ! »).

type Props = {
  valeur: number
  max: number
  texte: string
  couleur: 'vert' | 'rouge' | 'or' | 'violet' | 'bleu'
}

const CLASSES: Record<Props['couleur'], string> = { vert: '', rouge: 'jauge-rose', or: 'jauge-jaune', violet: 'jauge-violet', bleu: 'jauge-bleu' }

export function Barre({ valeur, max, texte, couleur }: Props) {
  const pourcentage = max > 0 ? Math.min(100, (valeur / max) * 100) : 0
  return (
    <div className={`jauge jauge-texte ${CLASSES[couleur]}`} role="meter" aria-valuenow={valeur} aria-valuemin={0} aria-valuemax={max} aria-label={texte}>
      <i style={{ width: `${pourcentage}%` }} />
      <span>{texte}</span>
    </div>
  )
}
