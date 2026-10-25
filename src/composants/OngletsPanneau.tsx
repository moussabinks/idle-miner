// Des onglets en haut d'une fenêtre (27/10) : on ne montre qu'une partie à la fois (« Équipe »,
// « Recruter », « Chefs »...), pour ne pas noyer le joueur sous les infos. Un onglet peut porter
// une pastille (un nombre, ou « ! » quand il y a quelque chose à faire).

export type Onglet<Id extends string> = { id: Id; titre: string; pastille?: string | null }

type Props<Id extends string> = {
  onglets: Onglet<Id>[]
  actif: Id
  onChoisir: (id: Id) => void
}

export function OngletsPanneau<Id extends string>({ onglets, actif, onChoisir }: Props<Id>) {
  return (
    <nav className="onglets" role="tablist">
      {onglets.map((o) => (
        <button key={o.id} role="tab" aria-selected={o.id === actif} className={`onglet ${o.id === actif ? 'actif' : ''}`} onClick={() => onChoisir(o.id)}>
          {o.titre}
          {o.pastille && <span className="pastille">{o.pastille}</span>}
        </button>
      ))}
    </nav>
  )
}
