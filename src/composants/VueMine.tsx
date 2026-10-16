// La vue de la mine : le tunnel où se tient le mineur, la couche en cours
// et les couches du dessous (noires si on n'y voit rien).
// À gauche, l'échelle qui remonte à la surface. À droite, l'ascenseur (s'il est construit).

import { LARGEUR_MINE, PROFONDEUR_BEDROCK, zoneDe, type IdBloc } from '../jeu/donnees'
import {
  ascenseurDisponible,
  dureeBlocActuel,
  estCassee,
  estEclaire,
  indexBlocActuel,
  piocheEquipee,
  vision,
  type EtatJeu,
} from '../jeu/mineur'
import type { Gain } from '../usePartie'
import { Personnage } from './Personnage'

type Props = {
  etat: EtatJeu
  enMinage: boolean
  versLaGauche: boolean
  gains: Gain[]
}

type CaseMine = IdBloc | 'bedrock' | null

// Une case de la mine.
function Case({ bloc, profondeur, classe = '' }: { bloc: CaseMine; profondeur: number; classe?: string }) {
  if (bloc === null) return <div className={`case vide ${classe}`} />
  // Sous -40 m, les minerais sont dans de la deepslate.
  const roche = profondeur > 40 ? 'roche-deepslate' : 'roche-pierre'
  return <div className={`case bloc bloc-${bloc} ${roche} ${classe}`} />
}

// La colonne de l'ascenseur, à droite de la mine.
function CageAscenseur({ etat, avecCabine }: { etat: EtatJeu; avecCabine: boolean }) {
  if (!etat.ascenseur.possede) return null
  return (
    <div className="cage-ascenseur" aria-hidden="true">
      {avecCabine && ascenseurDisponible(etat) && <span className="cabine" />}
    </div>
  )
}

export function VueMine({ etat, enMinage, versLaGauche, gains }: Props) {
  const nbVisibles = vision(etat)
  const indexActuel = indexBlocActuel(etat)
  const duree = Math.max(0.08, dureeBlocActuel(etat))
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur

  // Les couches à dessiner sous le tunnel : la couche en cours, puis celles du dessous.
  const couches: { profondeur: number; blocs: CaseMine[] }[] = []
  if (!etat.victoire) couches.push({ profondeur: etat.profondeur, blocs: etat.coucheActuelle })
  for (let i = 0; couches.length < 5; i++) {
    const profondeur = etat.victoire ? PROFONDEUR_BEDROCK + i : etat.profondeur + 1 + i
    const blocs: CaseMine[] =
      profondeur >= PROFONDEUR_BEDROCK ? Array(LARGEUR_MINE).fill('bedrock') : (etat.couchesDessous[i] ?? Array(LARGEUR_MINE).fill(null))
    couches.push({ profondeur, blocs })
  }

  // Pendant le minage, le mineur se place au-dessus du bloc qu'il est en train de casser.
  const colonneAffichee = enMinage && indexActuel !== -1 ? indexActuel : etat.colonneMineur

  const profondeurTunnel = etat.victoire ? PROFONDEUR_BEDROCK - 1 : etat.profondeur - 1
  const classeAscenseur = etat.ascenseur.possede ? 'avec-ascenseur' : ''

  // Progression de l'ascenseur quand il est en route (0 à 100 %).
  const ascenseur = etat.ascenseur
  const progressionAscenseur = ascenseur.tempsTotal > 0 ? (1 - ascenseur.tempsRestant / ascenseur.tempsTotal) * 100 : 0

  return (
    <section className={`mine ${zoneDe(etat.profondeur).classe}`} aria-label="La mine">
      {/* Le tunnel où se tient le mineur. */}
      <div className={`rangee tunnel ${classeAscenseur} ${profondeurTunnel <= 0 ? 'ciel' : ''}`}>
        <span className="etiquette">{profondeurTunnel <= 0 ? '☀️' : `-${profondeurTunnel} m`}</span>
        <div className="echelle" title="L'échelle remonte à la surface (flèche ↑)" />
        {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
          <div key={colonne} className="case vide">
            {colonne === colonneAffichee && (
              <Personnage couleurPioche={couleurPioche} action={enMinage ? 'creuse' : 'repos'} versLaGauche={versLaGauche} />
            )}
            {colonne === 0 && estEclaire(etat) && etat.profondeur > 3 && <span className="torche">🕯️</span>}
          </div>
        ))}
        <CageAscenseur etat={etat} avecCabine />
        <div className="gains" aria-hidden="true">
          {gains.map((g) => (
            <span key={g.id} className="gain">
              +{g.montant} $
            </span>
          ))}
        </div>
      </div>

      {couches.map((couche, rang) => {
        const visible = rang < nbVisibles
        return (
          <div key={couche.profondeur + '-' + rang} className={`rangee ${classeAscenseur} ${visible ? '' : 'noir'}`}>
            <span className="etiquette">-{couche.profondeur} m</span>
            <div className="echelle echelle-vide" />
            {couche.blocs.map((bloc, colonne) => {
              const enCours = rang === 0 && colonne === indexActuel && !etat.victoire
              const classe = enCours ? (enMinage ? 'en-cours casse' : 'en-cours') : ''
              return (
                <div key={colonne} className="emplacement" style={enCours ? { ['--duree' as string]: `${duree}s` } : undefined}>
                  {!visible ? (
                    <div className="case cache" />
                  ) : (
                    // La clé change à chaque bloc cassé pour relancer l'animation de fissure.
                    <Case key={enCours ? etat.stats.blocsCasses : 'fixe'} bloc={bloc} profondeur={couche.profondeur} classe={classe} />
                  )}
                </div>
              )
            })}
            <CageAscenseur etat={etat} avecCabine={false} />
          </div>
        )
      })}

      {etat.enGalerie && <p className="bandeau-galerie">↔️ Galerie : ta pioche ne descend pas plus bas</p>}
      {ascenseur.possede && ascenseur.tempsRestant > 0 && (
        <p className="bandeau-ascenseur">
          🛗 L'ascenseur {progressionAscenseur < 50 ? 'monte au marché' : 'redescend vers toi'}… {Math.ceil(ascenseur.tempsRestant)} s
        </p>
      )}
    </section>
  )
}
