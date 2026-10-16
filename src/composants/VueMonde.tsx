// La vue du monde : le village en haut, puis tout le puits creusé depuis le début
// jusqu'au front de taille. L'échelle (et l'ascenseur) longent le puits sur la gauche.
// La « caméra » suit le joueur : la vue défile toute seule quand il grimpe.

import { memo, useEffect, useRef, type ReactNode } from 'react'
import { LARGEUR_MINE, PROFONDEUR_BEDROCK, zoneDe, type IdBloc } from '../jeu/donnees'
import { foreuseDebloquee, foreuseEnMarche } from '../jeu/foreuse'
import {
  aLaSurface,
  auFond,
  dureeBlocActuel,
  estCassee,
  indexBlocActuel,
  piocheEquipee,
  positionFront,
  vision,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action, Gain } from '../usePartie'
import { IconePixel } from './IconePixel'
import { ModuleAscenseur } from './ModuleAscenseur'
import { Personnage } from './Personnage'
import { STANDS } from './stands'

type Props = {
  etat: EtatJeu
  jouer: (action: Action) => void
  enMinage: boolean
  enMarche: boolean
  versLaGauche: boolean
  positionSurface: number
  onAllerStand: (position: number) => void
  gains: Gain[]
}

type CaseMine = IdBloc | 'bedrock' | null

// Une case de la mine (un bloc, ou un trou déjà creusé).
function Case({ bloc, profondeur, classe = '' }: { bloc: CaseMine; profondeur: number; classe?: string }) {
  if (bloc === null) return <div className={`case vide ${classe}`} />
  const roche = profondeur > 80 ? 'roche-deepslate' : 'roche-pierre'
  return <div className={`case bloc bloc-${bloc} ${roche} ${classe}`} />
}

// Une torche dessinée en CSS (un bâton et une flamme).
function Torche() {
  return <span className="torche-css" aria-hidden="true" />
}

// Une rangée de la mine : l'étiquette, la place de l'échelle et de l'ascenseur, puis 6 cases.
function Rangee({ profondeur, classe = '', children }: { profondeur: number; classe?: string; children: ReactNode }) {
  return (
    <div className={`rangee ${zoneDe(profondeur).classe} ${classe}`}>
      <span className="etiquette">{profondeur % 5 === 0 || classe.includes('front') ? `-${profondeur} m` : ''}</span>
      <div className="place-echelle" />
      <div className="place-ascenseur" />
      {children}
    </div>
  )
}

// Une rangée déjà creusée. « memo » évite de la redessiner si rien n'a changé :
// il peut y en avoir plus de 100.
const RangeeCreusee = memo(function RangeeCreusee({ profondeur, torche }: { profondeur: number; torche: boolean }) {
  return (
    <Rangee profondeur={profondeur} classe="creusee">
      {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
        <div key={colonne} className="case vide">
          {colonne === 0 && torche && <Torche />}
        </div>
      ))}
    </Rangee>
  )
})

// ---------------------------------------------------------------------------
// Le village
// ---------------------------------------------------------------------------

function Village({ etat, positionSurface, onAllerStand, enMarche, versLaGauche, joueurRef }: {
  etat: EtatJeu
  positionSurface: number
  onAllerStand: (position: number) => void
  enMarche: boolean
  versLaGauche: boolean
  joueurRef: React.RefObject<HTMLDivElement | null>
}) {
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur
  const auVillage = aLaSurface(etat)

  return (
    <div className="village">
      <div className="soleil" aria-hidden="true" />
      <div className="nuage nuage-1" aria-hidden="true" />
      <div className="nuage nuage-2" aria-hidden="true" />

      <div className="rue">
        {STANDS.map((stand, index) => {
          const verrouille = stand.id === 'foreuse' && !foreuseDebloquee(etat)
          const actif = auVillage && index === positionSurface
          return (
            <button
              key={stand.id}
              className={`stand stand-${stand.id} ${actif ? 'stand-actif' : ''} ${verrouille ? 'stand-verrouille' : ''}`}
              onClick={() => onAllerStand(index)}
              disabled={!auVillage}
              title={verrouille ? 'Débloquée au prestige 1' : stand.description}
            >
              {stand.id === 'puits' ? (
                <span className="puits" aria-hidden="true">
                  <span className="puits-toit" />
                  <span className="puits-echelle" />
                  <span className="puits-margelle" />
                </span>
              ) : (
                <span className={`echoppe ${stand.id === 'foreuse' && foreuseEnMarche(etat) ? 'foreuse-tourne' : ''}`} aria-hidden="true">
                  <span className="auvent" />
                  <span className="comptoir">{stand.icone && <IconePixel nom={stand.icone} taille={28} />}</span>
                  {verrouille && (
                    <span className="barriere">
                      <IconePixel nom="cadenas" taille={20} />
                    </span>
                  )}
                </span>
              )}
              <span className="stand-nom">{stand.nom}</span>
            </button>
          )
        })}
      </div>

      <div className="sol">
        {STANDS.map((stand, index) => (
          <div key={stand.id} className="sol-case">
            {auVillage && index === positionSurface && (
              <div ref={joueurRef} className="porte-joueur">
                <Personnage couleurPioche={couleurPioche} action={enMarche ? 'marche' : 'repos'} versLaGauche={versLaGauche} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Le monde entier
// ---------------------------------------------------------------------------

export function VueMonde({ etat, jouer, enMinage, enMarche, versLaGauche, positionSurface, onAllerStand, gains }: Props) {
  const conteneurRef = useRef<HTMLElement>(null)
  const joueurRef = useRef<HTMLDivElement>(null)

  const P = etat.profondeur
  const front = positionFront(etat)
  const nbVisibles = vision(etat)
  const indexActuel = indexBlocActuel(etat)
  const duree = Math.max(0.08, dureeBlocActuel(etat))
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur
  const auVillage = aLaSurface(etat)
  const auFront = auFond(etat)
  const surEchelle = !auVillage && !auFront

  // Pendant le minage, le mineur se place au-dessus du bloc qu'il casse.
  const colonneAffichee = enMinage && indexActuel !== -1 ? indexActuel : etat.colonneMineur

  // La caméra : on fait défiler la vue pour garder le joueur au milieu.
  const repere = auVillage ? -1 : Math.round(etat.position)
  useEffect(() => {
    const conteneur = conteneurRef.current
    const joueur = joueurRef.current
    if (!conteneur || !joueur) return
    const haut = joueur.getBoundingClientRect().top - conteneur.getBoundingClientRect().top + conteneur.scrollTop
    conteneur.scrollTo({ top: haut - conteneur.clientHeight / 2 + joueur.offsetHeight / 2, behavior: 'smooth' })
  }, [repere, P])

  // L'ascenseur : où est la cabine ? (en mètres, comme le joueur)
  const ascenseur = etat.ascenseur
  let profondeurCabine = front
  if (ascenseur.tempsRestant > 0 && ascenseur.tempsTotal > 0) {
    const avancement = 1 - ascenseur.tempsRestant / ascenseur.tempsTotal
    profondeurCabine = avancement < 0.5 ? front * (1 - 2 * avancement) : front * (2 * avancement - 1)
  }

  // Les rangées sous le front de taille : la couche en cours, puis celles du dessous.
  const rangeesDuBas: ReactNode[] = []
  const derniere = Math.min(P + 4, PROFONDEUR_BEDROCK + 1)
  for (let d = P; d <= derniere; d++) {
    const rang = d - P
    if (d >= PROFONDEUR_BEDROCK) {
      rangeesDuBas.push(
        <Rangee key={d} profondeur={d}>
          {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
            <Case key={colonne} bloc="bedrock" profondeur={d} />
          ))}
        </Rangee>,
      )
      continue
    }
    const blocs: CaseMine[] = rang === 0 ? etat.coucheActuelle : (etat.couchesDessous[rang - 1] ?? Array(LARGEUR_MINE).fill(null))
    const visible = rang < nbVisibles
    rangeesDuBas.push(
      <Rangee key={d} profondeur={d} classe={`${visible ? '' : 'noir'} ${rang === 0 ? 'couche-en-cours' : ''}`}>
        {blocs.map((bloc, colonne) => {
          const enCours = rang === 0 && colonne === indexActuel && !etat.victoire
          const classe = enCours ? (enMinage ? 'en-cours casse' : 'en-cours') : ''
          return (
            <div key={colonne} className="emplacement" style={enCours ? { ['--duree' as string]: `${duree}s` } : undefined}>
              {visible ? (
                <Case key={enCours ? etat.stats.blocsCasses : 'fixe'} bloc={bloc} profondeur={d} classe={classe} />
              ) : (
                <div className="case cache" />
              )}
            </div>
          )
        })}
      </Rangee>,
    )
  }

  return (
    <section ref={conteneurRef} className="monde" aria-label="Le village et la mine">
      <Village
        etat={etat}
        positionSurface={positionSurface}
        onAllerStand={onAllerStand}
        enMarche={enMarche}
        versLaGauche={versLaGauche}
        joueurRef={joueurRef}
      />

      <div className="puits-mine">
        {/* L'échelle descend du puits jusqu'au front de taille. */}
        <div className="echelle-longue" style={{ height: `calc(var(--pas) * ${front} + 14px)` }} />

        {/* L'ascenseur (ou son emplacement s'il n'est pas construit). */}
        <div className={`rail-ascenseur ${ascenseur.niveau > 0 ? 'construit' : ''}`} style={{ height: `calc(var(--pas) * ${front} + 14px)` }} />
        {ascenseur.niveau > 0 && (
          <div className="cabine" style={{ top: `calc(var(--pas) * ${profondeurCabine - 1})` }}>
            {Object.keys(ascenseur.chargement).length > 0 && <span className="cabine-chargee" />}
          </div>
        )}

        {/* Le joueur sur l'échelle. */}
        {surEchelle && (
          <div ref={joueurRef} className="joueur-echelle" style={{ top: `calc(var(--pas) * ${etat.position - 1})` }}>
            <Personnage couleurPioche={couleurPioche} action="grimpe" />
          </div>
        )}

        {/* Tout ce qui a déjà été creusé, depuis l'entrée du puits. */}
        {Array.from({ length: Math.max(0, front - 1) }, (_, i) => (
          <RangeeCreusee key={i + 1} profondeur={i + 1} torche={etat.torchesPosees.includes(i + 1)} />
        ))}

        {/* Le front de taille, où se tient le mineur. */}
        {front >= 1 && (
          <Rangee profondeur={front} classe="creusee front">
            {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
              <div key={colonne} className="case vide">
                {colonne === 0 && etat.torchesPosees.includes(front) && <Torche />}
                {auFront && colonne === colonneAffichee && (
                  <div ref={joueurRef} className="porte-joueur">
                    <Personnage couleurPioche={couleurPioche} action={enMinage ? 'creuse' : 'repos'} versLaGauche={versLaGauche} />
                  </div>
                )}
              </div>
            ))}
          </Rangee>
        )}

        {rangeesDuBas}
      </div>

      {etat.enGalerie && !auVillage && <p className="bandeau-galerie">↔️ Galerie : ta pioche ne descend pas plus bas</p>}

      {!auVillage && <ModuleAscenseur etat={etat} jouer={jouer} />}

      <div className="gains" aria-hidden="true">
        {gains.map((g) => (
          <span key={g.id} className="gain">
            +{g.montant} $
          </span>
        ))}
      </div>
    </section>
  )
}
