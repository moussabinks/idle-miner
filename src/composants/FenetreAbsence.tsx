// La fenêtre du retour (30/10) : quand on revient sur son monde, ce qui s'est passé pendant
// l'absence (le jeu a continué de tourner, au plus 8 h) : ce que les mineurs et la mine ont
// creusé... (23/10 : plus les voyages des wagonnets ni le coffre ; en bas, le temps d'absence
// que couvre le manager, et comment l'allonger) (23/10) En grand : ce que les pousseurs ont vendu au marché avec leurs wagonnets
// (l'argent est déjà dans la caisse : plus de bouton « Tout récupérer », juste « Continuer »).
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
        {/* Le chiffre le plus attirant, en grand : ce que les pousseurs ont vendu au marché. */}
        <div className="absence-ventes">
          <span className="absence-ventes-titre">🛤️ Tes pousseurs ont vendu au marché</span>
          <div className="absence-argent">
            <span aria-hidden="true">💰</span> +{nombre(resume.ventesWagonnets)} $
          </div>
          {resume.ventesWagonnets === 0 && <span className="discret">Relie la mine au marché et embauche un pousseur : il vendra pour toi, même jeu fermé.</span>}
        </div>
        {resume.sansSalaire > 0 && (
          <p className="texte-alerte">
            😠 {resume.sansSalaire === 1 ? 'Un mineur attend son salaire' : `${resume.sansSalaire} mineurs attendent leur salaire`} : ils se sont arrêtés. Paie-les au Personnel !
          </p>
        )}
        {/* (23/10) Combien de temps le jeu tourne jeu fermé : le manager paie les salaires pendant
            un temps (30 min au départ), qu'on allonge en l'améliorant au Personnel. */}
        <p className={`absence-limite ${resume.absenceMax !== null && resume.secondes > resume.absenceMax ? 'absence-limite-depassee' : ''}`}>
          {resume.absenceMax === null ? (
            <>
              ⏱️ Sans manager, tes mineurs s'arrêtent dès que leur salaire est fini. Embauche le <strong>manager au Personnel</strong> : il les paie
              pendant 15 min, et plus en l'améliorant.
            </>
          ) : resume.managerAuMax ? (
            <>
              ⏱️ Temps d'absence max : <strong>{dureeAbsence(resume.absenceMax)}</strong> : ton manager s'endort après (il est au maximum). Pense à le
              réveiller au Personnel avant de partir.
            </>
          ) : (
            <>
              ⏱️ Temps d'absence max : <strong>{dureeAbsence(resume.absenceMax)}</strong> : ton manager s'endort après. Réveille-le au Personnel avant de
              partir ; pour qu'il tienne plus longtemps, améliore le <strong>manager</strong> au bâtiment du <strong>Personnel</strong>.
            </>
          )}
        </p>
        <button className="bouton bouton-vendre tuto-gros-bouton" onClick={onRecuperer} autoFocus>
          ▶ Continuer
        </button>
      </section>
    </div>
  )
}
