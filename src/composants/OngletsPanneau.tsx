// Des onglets en haut d'une fenêtre (27/10) : on ne montre qu'une partie à la fois (« Équipe »,
// « Recruter », « Chefs »...), pour ne pas noyer le joueur sous les infos. Un onglet peut porter
// une pastille (un nombre, ou « ! » quand il y a quelque chose à faire).
// Le titre commence par son icône (« ⛏️ Creuser ») : sur un petit téléphone, quand il y a beaucoup
// d'onglets, ceux qui ne sont pas choisis ne montrent que leur icône (voir .onglets-nombreux).

export type Onglet<Id extends string> = { id: Id; titre: string; pastille?: string | null }

type Props<Id extends string> = {
  onglets: Onglet<Id>[]
  actif: Id
  onChoisir: (id: Id) => void
}

export function OngletsPanneau<Id extends string>({ onglets, actif, onChoisir }: Props<Id>) {
  return (
    <nav className={`onglets ${onglets.length >= 4 ? 'onglets-nombreux' : ''}`} role="tablist">
      {onglets.map((o) => {
        // L'icône, puis le texte (après la première espace).
        const espace = o.titre.indexOf(' ')
        const icone = espace > 0 ? o.titre.slice(0, espace) : ''
        const texte = espace > 0 ? o.titre.slice(espace + 1) : o.titre
        return (
          <button key={o.id} role="tab" aria-selected={o.id === actif} aria-label={texte} className={`onglet ${o.id === actif ? 'actif' : ''}`} onClick={() => onChoisir(o.id)}>
            {icone && <span aria-hidden="true">{icone} </span>}
            <span className="onglet-texte">{texte}</span>
            {o.pastille && <span className="pastille">{o.pastille}</span>}
          </button>
        )
      })}
    </nav>
  )
}
