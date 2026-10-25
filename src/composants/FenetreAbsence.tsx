// La fenêtre du retour (30/10) : quand on revient sur son monde, ce qui s'est passé pendant
// l'absence (le jeu a continué de tourner, au plus 8 h). En grand, tout ce que l'absence a
// rapporté ; (25/10) une publicité DOUBLE ces gains.
// Aucune règle du jeu ici : le résumé est calculé par src/jeu/absence.ts.

import { useState } from 'react'
import { doublerAbsence, type ResumeAbsence } from '../jeu/absence'
import { nombre, t } from '../jeu/langue'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'

type Props = {
  resume: ResumeAbsence
  onFermer: () => void
}

// « 2 h 13 », « 12 min », « 45 s ».
function dureeAbsence(secondes: number): string {
  if (secondes < 60) return `${Math.round(secondes)} s`
  const minutes = Math.floor(secondes / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

export function FenetreAbsence({ resume, onFermer }: Props) {
  const { jouer, regarderPub } = useJeu()
  const [double, setDouble] = useState(false)
  const lignes = [
    resume.blocsMineurs > 0 && { icone: '👷', texte: t('Tes mineurs ont creusé'), valeur: t('{n} blocs', { n: nombre(resume.blocsMineurs) }) },
    resume.blocsMine > 0 && { icone: '⛏️', texte: t('La mine a sorti toute seule'), valeur: t('{n} blocs', { n: nombre(resume.blocsMine) }) },
    resume.blocsForeuse > 0 && { icone: '⚙️', texte: t('La foreuse a foré'), valeur: t('{n} blocs', { n: nombre(resume.blocsForeuse) }) },
    resume.ventesWagonnets > 0 && { icone: '🚃', texte: t('Tes wagonnets ont vendu'), valeur: `${nombre(resume.ventesWagonnets)} $` },
  ].filter((l): l is { icone: string; texte: string; valeur: string } => Boolean(l))

  function doubler() {
    regarderPub(() => {
      jouer((e) => doublerAbsence(e, resume))
      setDouble(true)
    })
  }

  return (
    <Fenetre
      titre={t('Bon retour, mineur !')}
      icone="☀️"
      couleur="jaune"
      devant
      onFermer={onFermer}
      pied={
        <>
          {resume.gains > 0 && !double && (
            <button className="btn btn-violet btn-grand btn-attention" onClick={doubler}>
              📺 {t('Doubler')} · +{nombre(resume.gains)} $
            </button>
          )}
          <button className="btn btn-jaune btn-grand" onClick={onFermer} autoFocus>
            {t('Continuer')}
          </button>
        </>
      }
    >
      <p className="discret">{t('Pendant ton absence ({duree}), ta mine a continué de tourner :', { duree: dureeAbsence(resume.secondes) })}</p>
      <ul className="absence-lignes">
        {lignes.map((l) => (
          <li key={l.texte} className="carte">
            <span aria-hidden="true">{l.icone}</span>
            <span>{l.texte}</span>
            <strong>{l.valeur}</strong>
          </li>
        ))}
      </ul>
      <div className="absence-gains carte carte-creme">
        <span>{t('Tout ce que ton absence a rapporté')}</span>
        <strong className="absence-total">
          💰 +{nombre(double ? resume.gains * 2 : resume.gains)} $ {double && <span className="etiquette etiquette-violet">×2</span>}
        </strong>
        {resume.ventesWagonnets === 0 && <span className="discret">{t('Relie la mine au marché et embauche un pousseur : il vendra pour toi, même jeu fermé.')}</span>}
      </div>
      {resume.sansSalaire > 0 && (
        <p className="texte-alerte">
          😠 {resume.sansSalaire === 1 ? t('Un employé attend son salaire : paie-le au Personnel !') : t('{n} employés attendent leur salaire : paie-les au Personnel !', { n: resume.sansSalaire })}
        </p>
      )}
      <p className="discret">
        ⏱️{' '}
        {resume.absenceMax === null
          ? t('Sans manager, tes mineurs s’arrêtent dès que leur salaire est fini. Embauche le manager au Personnel (mine niveau 3).')
          : t('Ton manager paie les salaires pendant {duree}, puis il s’endort : réveille-le avant de partir.', { duree: dureeAbsence(resume.absenceMax) })}
      </p>
    </Fenetre>
  )
}
