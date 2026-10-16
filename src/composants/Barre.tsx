// Une barre de progression (durabilité, remplissage du sac...).

type Props = {
  valeur: number
  max: number
  texte: string
  couleur: 'vert' | 'rouge' | 'or' | 'violet'
}

export function Barre({ valeur, max, texte, couleur }: Props) {
  const pourcentage = max > 0 ? Math.min(100, (valeur / max) * 100) : 0
  return (
    <div className="barre" role="meter" aria-valuenow={valeur} aria-valuemin={0} aria-valuemax={max} aria-label={texte}>
      <div className={`barre-remplie barre-${couleur}`} style={{ width: `${pourcentage}%` }} />
      <span className="barre-texte">{texte}</span>
    </div>
  )
}
