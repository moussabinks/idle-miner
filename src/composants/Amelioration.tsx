// Les lignes d'achat et d'amélioration, les mêmes partout (mine, coffre, ascenseur, foreuse,
// générateur, mineurs, pioches...) pour que le jeu se lise d'un coup d'œil (25/10, nouveau style) :
//
//   [ Coffre  niv. 2  ■■□□□ ]                         [ 💵 Améliorer ] [ 💎 6 ]
//   [ 300 places → 800 places ]                          3 000 $ · 80 🔩
//
//   - à gauche : le nom, le niveau (petits carrés), et ce que ça change (maintenant → après) ;
//   - à droite : le bouton vert avec le prix, et le bouton violet pour payer en gemmes ;
//   - ou « 🔒 Mine 3 » si ce n'est pas encore débloqué, ou « MAX ».
//
// « action » est l'action du jeu (par exemple agrandirCoffre) : le bouton vert la fait en payant
// en argent et minerais, le violet la fait en payant en gemmes (acheterAvecGemmes).

import { useMemo, type ReactNode } from 'react'
import type { Cout } from '../jeu/donnees'
import { prixEnGemmes } from '../jeu/gemmes'
import { niveauJoueur } from '../jeu/niveaux'
import { t } from '../jeu/langue'
import { acheterAvecGemmes, possibleEnGemmes, type EtatJeu } from '../jeu/mineur'
import type { Action } from '../usePartie'
import { useJeu } from './contexteJeu'
import { PrixCout } from './PrixCout'

type Props = {
  titre: ReactNode // « Coffre », « Pioche en fer », « Ascenseur »
  niveau?: number // le nombre de niveaux achetés (pour les carrés)
  niveauMax?: number
  effet?: ReactNode // ce que ça change : « 300 places → 800 places »
  cout: Cout | null // le prix du niveau suivant (null : niveau maximum)
  verrou?: string | null // ce qu'il faut pour débloquer le niveau suivant (« 🕳️ Mine 3 »)
  possible: boolean // on peut le faire en payant en argent (débloqué, payable, rien ne l'empêche)
  action: Action
  texte?: string // le mot du bouton (« Améliorer » par défaut)
  icone?: string // une icône devant le titre
  classe?: string
}

export function Amelioration({ titre, niveau, niveauMax, effet, cout, verrou = null, possible, action, texte, icone, classe = '' }: Props) {
  const { etat } = useJeu()
  return (
    <div className={`ligne-amelioration ${classe}`}>
      <div className="ligne-amelioration-texte">
        <span className="ligne-amelioration-nom">
          {icone && <span aria-hidden="true">{icone}</span>}
          {titre}
          {niveau !== undefined && niveauMax !== undefined && <Niveaux niveau={niveau} max={niveauMax} />}
        </span>
        {effet && <span className="ligne-amelioration-effet">{effet}</span>}
      </div>
      {cout === null ? (
        <span className="etiquette etiquette-jaune">{t('MAX')}</span>
      ) : verrou !== null ? (
        <span className="verrou" title={t('Descends la mine pour débloquer ce niveau')}>
          🔒 {verrou}
        </span>
      ) : (
        <BoutonsAchat etat={etat} cout={cout} possible={possible} action={action} texte={texte ?? t('Améliorer')} />
      )}
    </div>
  )
}

// Les petits carrés des niveaux (pleins : achetés).
export function Niveaux({ niveau, max }: { niveau: number; max: number }) {
  return (
    <span className="niveaux" aria-label={t('Niveau {n} sur {max}', { n: niveau, max })}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < niveau ? 'plein' : ''} />
      ))}
    </span>
  )
}

// Le bouton vert (argent et minerais, avec le prix dessous) et le bouton violet (gemmes).
export function BoutonsAchat({ etat, cout, possible, action, texte }: { etat: EtatJeu; cout: Cout; possible: boolean; action: Action; texte: string }) {
  const { jouer } = useJeu()
  const gemmes = prixEnGemmes(cout)
  // (25/10, FPS) L'essai copie toute la partie : on ne le refait pas à chaque tour d'horloge
  // (20 fois par seconde), seulement quand change ce qui peut l'autoriser ou l'empêcher (les
  // gemmes, le palier de la mine, le niveau du joueur, l'équipe, les bâtiments, le prix). Sans assez de gemmes,
  // pas d'essai du tout.
  const assez = (etat.gemmes ?? 0) >= gemmes
  const cle = assez ? [etat.gemmes, etat.niveauMine, niveauJoueur(etat), etat.employes.length, etat.village.batiments.length, JSON.stringify(cout)].join('|') : ''
  const enGemmes = useMemo(() => assez && possibleEnGemmes(etat, action), [cle]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="ligne-amelioration-boutons">
      <button className="btn btn-vert btn-petit" disabled={!possible} onClick={() => jouer(action)}>
        <span>{texte}</span>
        <PrixCout etat={etat} cout={cout} />
      </button>
      <button
        className="btn btn-gemmes btn-petit"
        disabled={!enGemmes}
        onClick={() => jouer((e) => acheterAvecGemmes(() => action(e)))}
        title={t('Payer en gemmes, sans argent ni minerais')}
      >
        <span>💎 {gemmes}</span>
      </button>
    </span>
  )
}

// Un achat simple (embaucher, construire...) : les mêmes deux boutons, sans niveaux.
export function Achat({ titre, effet, cout, possible, action, texte, icone, verrou = null }: Omit<Props, 'niveau' | 'niveauMax'> & { cout: Cout }) {
  return <Amelioration titre={titre} effet={effet} cout={cout} possible={possible} action={action} texte={texte ?? t('Acheter')} icone={icone} verrou={verrou} />
}
