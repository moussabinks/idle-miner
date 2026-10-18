// La vue du monde : le village en haut, puis tout le puits creusé depuis le début
// jusqu'au front de taille. L'échelle et l'ascenseur longent le puits sur la gauche,
// et la foreuse (au prestige 1) creuse son propre puits sur la droite.
// La « caméra » suit le joueur : la vue défile toute seule quand il bouge.

import { memo, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { LARGEUR_MINE, PROFONDEUR_BEDROCK, zoneDe, type IdBloc } from '../jeu/donnees'
import { foreuseDebloquee, foreuseEnMarche } from '../jeu/foreuse'
import {
  aLaSurface,
  auFond,
  dureeBlocActuel,
  dureeBlocAssistant,
  estCassee,
  indexBlocActuel,
  indexBlocAssistant,
  nbSurQuai,
  piocheEquipee,
  positionFront,
  type EtatJeu,
} from '../jeu/mineur'
import type { Action, Gain } from '../usePartie'
import { IconePixel } from './IconePixel'
import { ModuleAscenseur } from './ModuleAscenseur'
import { Personnage } from './Personnage'
import { PersonnageMacron } from './PersonnageMacron'
import { VueVillage } from './VueVillage'

type Props = {
  etat: EtatJeu
  jouer: (action: Action) => void
  enMinage: boolean
  versLaGauche: boolean
  // La marche au village
  xVillage: number
  versLaGaucheVillage: boolean
  enMarcheVillage: boolean
  onAllerStand: (index: number) => void
  gains: Gain[]
}

type CaseMine = IdBloc | 'bedrock' | null

// Une case de la mine (un bloc, ou un trou déjà creusé).
function Case({ bloc, profondeur, classe = '' }: { bloc: CaseMine; profondeur: number; classe?: string }) {
  if (bloc === null) return <div className={`case vide ${classe}`} />
  const roche = profondeur > 80 ? 'roche-deepslate' : 'roche-pierre'
  return (
    <div className={`case bloc bloc-${bloc} ${roche} ${classe}`}>
      {/* Dans un donjon, on voit le monstre qui attend... */}
      {bloc === 'donjon' && (
        <span className="monstre">
          <IconePixel nom="zombie" taille={22} />
        </span>
      )}
    </div>
  )
}

// Une rangée de la mine : l'étiquette, la place de l'échelle et de l'ascenseur,
// les 10 cases, puis la place du puits de la foreuse.
function Rangee({ profondeur, classe = '', children }: { profondeur: number; classe?: string; children: ReactNode }) {
  return (
    <div className={`rangee ${zoneDe(profondeur).classe} ${classe}`}>
      <span className="etiquette">{profondeur % 5 === 0 || classe.includes('front') ? `-${profondeur} m` : ''}</span>
      <div className="place-echelle" />
      <div className="place-ascenseur" />
      {children}
      <div className="place-foreuse" />
    </div>
  )
}

// Une rangée déjà creusée. « memo » évite de la redessiner si rien n'a changé :
// il peut y en avoir plus de 100.
const RangeeCreusee = memo(function RangeeCreusee({ profondeur }: { profondeur: number }) {
  return (
    <Rangee profondeur={profondeur} classe="creusee">
      {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
        <div key={colonne} className="case vide" />
      ))}
    </Rangee>
  )
})

// La foreuse dans son puits, à droite de la mine (jaune et noire, comme un engin de chantier).
function PuitsForeuse({ etat, derniereRangee, teteRef }: { etat: EtatJeu; derniereRangee: number; teteRef: RefObject<HTMLDivElement | null> }) {
  if (!foreuseDebloquee(etat)) return null
  const foreuse = etat.foreuse
  const enMarche = foreuseEnMarche(etat)
  // Si la foreuse est plus profonde que ce qu'on affiche, on la dessine en bas avec une flèche.
  const profondeurAffichee = Math.min(foreuse.profondeur, derniereRangee)
  const plusBas = foreuse.profondeur > derniereRangee

  return (
    <>
      <div className="puits-foreuse" style={{ height: `calc(var(--pas) * ${profondeurAffichee} + 14px)` }} />
      <div
        ref={teteRef}
        className={`tete-foreuse ${enMarche ? 'tete-foreuse-tourne' : ''} ${foreuse.active ? '' : 'tete-foreuse-eteinte'}`}
        style={{ top: `calc(var(--pas) * ${profondeurAffichee - 1})` }}
        title={`Foreuse à -${foreuse.profondeur} m`}
      >
        <span className="foreuse-corps" />
        <span className="foreuse-meche" />
        {enMarche && (
          <span className="foreuse-debris" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        <span className="foreuse-etiquette">{plusBas ? `↓ -${foreuse.profondeur} m` : `-${foreuse.profondeur} m`}</span>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Le monde entier
// ---------------------------------------------------------------------------

export function VueMonde({ etat, jouer, enMinage, versLaGauche, xVillage, versLaGaucheVillage, enMarcheVillage, onAllerStand, gains }: Props) {
  const conteneurRef = useRef<HTMLElement>(null)
  const joueurRef = useRef<HTMLDivElement>(null)
  const foreuseRef = useRef<HTMLDivElement>(null)

  // Fait défiler la vue jusqu'à un élément (le joueur, ou la foreuse).
  function montrer(element: HTMLElement | null, douceur: ScrollBehavior) {
    const conteneur = conteneurRef.current
    if (!conteneur || !element) return
    const haut = element.getBoundingClientRect().top - conteneur.getBoundingClientRect().top + conteneur.scrollTop
    conteneur.scrollTo({ top: haut - conteneur.clientHeight / 2 + element.offsetHeight / 2, behavior: douceur })
  }

  const P = etat.profondeur
  const front = positionFront(etat)
  const indexActuel = indexBlocActuel(etat)
  const duree = Math.max(0.08, dureeBlocActuel(etat))
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur
  const auVillage = aLaSurface(etat)
  const ascenseur = etat.ascenseur
  const dansLaCabine = ascenseur.passager
  // Le mineur n'est dessiné qu'à un seul endroit à la fois (sinon la caméra ne sait plus qui suivre).
  const auFront = auFond(etat) && !dansLaCabine
  const surEchelle = !auVillage && !auFront && !dansLaCabine

  // Pendant le minage, le mineur se place au-dessus du bloc qu'il casse.
  const colonneAffichee = enMinage && indexActuel !== -1 ? indexActuel : etat.colonneMineur

  // L'assistant (Emmanuel Macron) : il se place au-dessus du bloc qu'il casse.
  // S'il tombe sur la même case que le joueur, il se met juste à côté.
  const assistantLa = etat.assistant.embauche
  const indexAssistant = assistantLa ? indexBlocAssistant(etat) : -1
  const assistantTravaille = enMinage && indexAssistant !== -1
  const dureeAssistant = Math.max(0.08, dureeBlocAssistant(etat))
  let colonneAssistant = assistantTravaille ? indexAssistant : etat.assistant.colonne
  if (colonneAssistant === colonneAffichee) colonneAssistant = colonneAffichee === 0 ? 1 : colonneAffichee - 1

  // La caméra : on fait défiler la vue pour garder le joueur au milieu.
  // Pendant qu'il bouge (échelle ou ascenseur), la vue le suit directement, par petits pas ;
  // pour les grands sauts (arrivée au village...), elle glisse en douceur.
  const bouge = etat.position !== etat.cible || dansLaCabine
  const repere = auVillage ? -1 : Math.round(etat.position * 4) / 4
  useEffect(() => {
    const conteneur = conteneurRef.current
    const joueur = joueurRef.current
    if (!conteneur || !joueur) return
    const haut = joueur.getBoundingClientRect().top - conteneur.getBoundingClientRect().top + conteneur.scrollTop
    conteneur.scrollTo({ top: haut - conteneur.clientHeight / 2 + joueur.offsetHeight / 2, behavior: bouge ? 'auto' : 'smooth' })
  }, [repere, P, bouge])

  const foreuseVisible = foreuseDebloquee(etat) && etat.foreuse.active

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
    // Lumière naturelle : plus une couche est loin sous le mineur, plus elle est sombre.
    rangeesDuBas.push(
      <Rangee key={d} profondeur={d} classe={`${rang === 0 ? 'couche-en-cours' : `ombre-${rang}`}`}>
        {blocs.map((bloc, colonne) => {
          const enCours = rang === 0 && colonne === indexActuel
          const cibleAssistant = rang === 0 && assistantTravaille && colonne === indexAssistant
          let classe = ''
          if (enCours) classe = enMinage ? 'en-cours casse' : 'en-cours'
          if (cibleAssistant) classe = 'en-cours-assistant casse'
          const dureeCase = cibleAssistant ? dureeAssistant : duree
          return (
            <div
              key={colonne}
              className="emplacement"
              style={enCours || cibleAssistant ? { ['--duree' as string]: `${dureeCase}s` } : undefined}
            >
              {/* La clé change quand un mineur commence ce bloc, pour relancer l'animation de fissure. */}
              <Case key={enCours ? 'joueur' : cibleAssistant ? 'assistant' : 'fixe'} bloc={bloc} profondeur={d} classe={classe} />
            </div>
          )
        })}
      </Rangee>,
    )
  }

  return (
    <section ref={conteneurRef} className="monde" aria-label="Le village et la mine">
      {/* Un petit rappel de la foreuse, toujours visible : on clique pour aller la voir. */}
      {foreuseVisible && (
        <button
          className={`indicateur-foreuse ${foreuseEnMarche(etat) ? 'tourne' : ''}`}
          onClick={() => montrer(foreuseRef.current, 'smooth')}
          title="Voir la foreuse"
        >
          <span className="mini-foreuse" aria-hidden="true">
            <span className="foreuse-corps" />
            <span className="foreuse-meche" />
          </span>
          Foreuse -{etat.foreuse.profondeur} m · {foreuseEnMarche(etat) ? 'en marche' : 'arrêtée'}
        </button>
      )}

      <VueVillage
        etat={etat}
        x={xVillage}
        versLaGauche={versLaGaucheVillage}
        enMarche={enMarcheVillage}
        onAllerStand={onAllerStand}
        joueurRef={joueurRef}
      />

      <div className="puits-mine">
        {/* L'échelle descend du puits jusqu'au front de taille. */}
        <div className="echelle-longue" style={{ height: `calc(var(--pas) * ${front} + 14px)` }} />

        {/* L'ascenseur (ou son emplacement s'il n'est pas construit) : la cabine monte et descend. */}
        <div className={`rail-ascenseur ${ascenseur.niveau > 0 ? 'construit' : ''}`} style={{ height: `calc(var(--pas) * ${front} + 14px)` }} />
        {ascenseur.niveau > 0 && (
          <div className={`cabine ${dansLaCabine ? 'cabine-occupee' : ''}`} style={{ top: `calc(var(--pas) * ${ascenseur.position - 1})` }}>
            {(Object.keys(ascenseur.chargement).length > 0 || nbSurQuai(etat) > 0) && <span className="cabine-chargee" />}
            {dansLaCabine && (
              <div ref={joueurRef} className="passager">
                <Personnage couleurPioche={couleurPioche} action="repos" />
              </div>
            )}
          </div>
        )}

        {/* Le joueur sur l'échelle. */}
        {surEchelle && (
          <div ref={joueurRef} className="joueur-echelle" style={{ top: `calc(var(--pas) * ${etat.position - 1})` }}>
            <Personnage couleurPioche={couleurPioche} action="grimpe" />
          </div>
        )}

        <PuitsForeuse etat={etat} derniereRangee={derniere} teteRef={foreuseRef} />

        {/* Tout ce qui a déjà été creusé, depuis l'entrée du puits. */}
        {Array.from({ length: Math.max(0, front - 1) }, (_, i) => (
          <RangeeCreusee key={i + 1} profondeur={i + 1} />
        ))}

        {/* Le front de taille, où se tient le mineur. */}
        {front >= 1 && (
          <Rangee profondeur={front} classe="creusee front">
            {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
              <div key={colonne} className="case vide">
                {auFront && colonne === colonneAffichee && (
                  <div ref={joueurRef} className="porte-joueur">
                    <Personnage couleurPioche={couleurPioche} action={enMinage ? 'creuse' : 'repos'} versLaGauche={versLaGauche} />
                  </div>
                )}
                {assistantLa && colonne === colonneAssistant && (
                  <div className="porte-joueur">
                    <PersonnageMacron couleurPioche={couleurPioche} action={assistantTravaille ? 'creuse' : 'repos'} />
                  </div>
                )}
              </div>
            ))}
          </Rangee>
        )}

        {rangeesDuBas}
      </div>

      {etat.victoire && !auVillage && (
        <p className="bandeau-galerie">🏆 Bedrock atteinte : creuse encore ici, ou passe prestige au puits du village.</p>
      )}
      {etat.enGalerie && !etat.victoire && !auVillage && <p className="bandeau-galerie">↔️ Galerie : ta pioche ne descend pas plus bas</p>}

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
