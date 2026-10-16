// La vue de la mine : le tunnel où se tient le mineur, la couche en cours
// et les couches du dessous (noires si on n'y voit rien).

import { LARGEUR_MINE, PORTEE_TORCHE, PROFONDEUR_BEDROCK, zoneDe, type IdBloc } from '../jeu/donnees'
import { dureeBlocActuel, indexBlocActuel, vision, type EtatJeu } from '../jeu/mineur'
import type { Gain } from '../usePartie'

type Props = {
  etat: EtatJeu
  enMinage: boolean
  gains: Gain[]
}

// Une case de la mine.
function Case({ bloc, profondeur, classe = '' }: { bloc: IdBloc | 'bedrock' | null; profondeur: number; classe?: string }) {
  if (bloc === null) return <div className={`case vide ${classe}`} />
  // Sous -40 m, les minerais sont dans de la deepslate.
  const roche = profondeur > 40 ? 'roche-deepslate' : 'roche-pierre'
  return <div className={`case bloc bloc-${bloc} ${roche} ${classe}`} />
}

export function VueMine({ etat, enMinage, gains }: Props) {
  const nbVisibles = vision(etat)
  const indexActuel = indexBlocActuel(etat)
  const duree = Math.max(0.08, dureeBlocActuel(etat))
  const torcheIci = etat.torchesPosees.some((d) => d <= etat.profondeur && etat.profondeur - d <= PORTEE_TORCHE)

  // Les couches à dessiner sous le tunnel : la couche en cours, puis celles du dessous.
  const couches: { profondeur: number; blocs: (IdBloc | 'bedrock' | null)[] }[] = []
  if (!etat.victoire) couches.push({ profondeur: etat.profondeur, blocs: etat.coucheActuelle })
  for (let i = 0; couches.length < 5; i++) {
    const profondeur = etat.victoire ? PROFONDEUR_BEDROCK + i : etat.profondeur + 1 + i
    const blocs =
      profondeur >= PROFONDEUR_BEDROCK ? Array(LARGEUR_MINE).fill('bedrock') : (etat.couchesDessous[i] ?? Array(LARGEUR_MINE).fill(null))
    couches.push({ profondeur, blocs })
  }

  const profondeurTunnel = etat.victoire ? PROFONDEUR_BEDROCK - 1 : etat.profondeur - 1
  const colonneMineur = indexActuel === -1 ? 0 : indexActuel

  return (
    <section className={`mine ${zoneDe(etat.profondeur).classe}`} aria-label="La mine">
      {/* Le tunnel : ciel et herbe en surface, galerie creusée plus bas. */}
      <div className={`rangee tunnel ${profondeurTunnel <= 0 ? 'ciel' : ''}`}>
        <span className="etiquette">{profondeurTunnel <= 0 ? '☀️' : `-${profondeurTunnel} m`}</span>
        {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
          <div key={colonne} className="case vide">
            {colonne === colonneMineur && (
              <span className={`mineur ${enMinage ? 'mineur-actif' : ''}`} role="img" aria-label="Le mineur">
                🧑‍🏭
              </span>
            )}
            {colonne === 0 && torcheIci && <span className="torche">🕯️</span>}
          </div>
        ))}
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
          <div key={couche.profondeur + '-' + rang} className={`rangee ${visible ? '' : 'noir'}`}>
            <span className="etiquette">-{couche.profondeur} m</span>
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
          </div>
        )
      })}

      {etat.enGalerie && <p className="bandeau-galerie">↔️ Galerie : ta pioche ne descend pas plus bas</p>}
    </section>
  )
}
