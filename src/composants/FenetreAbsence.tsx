// La fenêtre du retour (30/10) : quand on revient sur son monde, ce qui s'est passé pendant
// l'absence (le jeu a continué de tourner, au plus 8 h) : ce que les mineurs et la mine ont
// creusé, ce que les wagonnets ont gagné... et un gros bouton « Tout récupérer ».
// Aucune règle du jeu ici : le résumé est calculé par src/jeu/absence.ts.

import type { ResumeAbsence } from '../jeu/absence'

type Props = {
  resume: ResumeAbsence
  onRecuperer: () => void
}

// « 2 h 13 », « 12 min », « 45 s ».
function dureeAbsence(secondes: number): string {
  if (secondes < 60) return `${Math.round(secondes)} s`
  const minutes = Math.floor(secondes / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

const nombre = (n: number) => Math.round(n).toLocaleString('fr-FR')

export function FenetreAbsence({ resume, onRecuperer }: Props) {
  const lignes = [
    resume.blocsMineurs > 0 && { icone: '👷', texte: 'Tes mineurs ont creusé', valeur: `${nombre(resume.blocsMineurs)} blocs` },
    resume.blocsMine > 0 && { icone: '⛏️', texte: 'La mine a sorti toute seule', valeur: `${nombre(resume.blocsMine)} blocs` },
    resume.blocsForeuse > 0 && { icone: '⚙️', texte: 'La foreuse a foré', valeur: `${nombre(resume.blocsForeuse)} blocs` },
    resume.voyages > 0 && { icone: '🚃', texte: 'Les wagonnets ont fait', valeur: `${nombre(resume.voyages)} voyages` },
    resume.coffre > 0 && { icone: '📦', texte: 'En plus dans le coffre', valeur: `${nombre(resume.coffre)} blocs` },
  ].filter((l): l is { icone: string; texte: string; valeur: string } => Boolean(l))
  return (
    <div className="voile voile-devant" role="dialog" aria-modal="true" aria-labelledby="titre-absence">
      <section className="carte fenetre-absence">
        <span className="absence-soleil" aria-hidden="true" />
        <h2 id="titre-absence">Bon retour, mineur !</h2>
        <p className="discret">Pendant ton absence ({dureeAbsence(resume.secondes)}), ta mine a continué de tourner :</p>
        <ul className="absence-lignes">
          {lignes.map((l, i) => (
            <li key={l.texte} style={{ animationDelay: `${150 + i * 120}ms` }}>
              <span className="absence-icone" aria-hidden="true">
                {l.icone}
              </span>
              <span>{l.texte}</span>
              <strong>{l.valeur}</strong>
            </li>
          ))}
        </ul>
        {resume.argent > 0 && (
          <div className="absence-argent">
            <span aria-hidden="true">💰</span> +{nombre(resume.argent)} $
          </div>
        )}
        {resume.sansSalaire > 0 && (
          <p className="texte-alerte">
            😠 {resume.sansSalaire === 1 ? 'Un mineur attend son salaire' : `${resume.sansSalaire} mineurs attendent leur salaire`} : ils se sont arrêtés. Paie-les au Personnel !
          </p>
        )}
        <button className="bouton bouton-vendre tuto-gros-bouton" onClick={onRecuperer} autoFocus>
          💰 Tout récupérer !
        </button>
      </section>
    </div>
  )
}
