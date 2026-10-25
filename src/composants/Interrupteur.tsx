// Un interrupteur (25/10) : un gros bouton qui glisse de « arrêté » (gris) à « en marche » (vert).
// Pour activer un trajet de wagonnet, ou mettre le manager au travail.

type Props = {
  allume: boolean
  texte: string // ce qui est écrit à côté (« Automatisation activée »)
  onBasculer: () => void
}

export function Interrupteur({ allume, texte, onBasculer }: Props) {
  return (
    <button className={`bascule ${allume ? 'bascule-allume' : ''}`} role="switch" aria-checked={allume} onClick={onBasculer}>
      <span className="bascule-piste" aria-hidden="true">
        <span className="bascule-curseur" />
      </span>
      <span>{texte}</span>
    </button>
  )
}
