// La vue du monde : le village en haut, puis tout le puits creusé depuis le début
// jusqu'au front de taille. L'échelle et l'ascenseur longent le puits sur la gauche,
// et la foreuse (au prestige 1) creuse son propre puits sur la droite.
// La « caméra » suit le joueur : la vue défile toute seule quand il bouge.

import { Fragment, memo, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { BLOCS, LARGEUR_MINE, PIOCHES, estRocheDure, profondeurBedrock, zoneDe, type IdBloc } from '../jeu/donnees'
import { activiteEmploye, iconeActiviteEmploye, nbDansSacEmploye, nbSansSalaire, secondesRestantesEmploye, tailleSacEmploye } from '../jeu/employes'
import { foreuseDebloquee, foreuseEnMarche } from '../jeu/foreuse'
import {
  aLaSurface,
  ascenseurEnMouvement,
  auFond,
  dureeBlocActuel,
  estCassee,
  indexBlocActuel,
  nbSurQuai,
  piocheEquipee,
  piochePourDescendre,
  positionFront,
  sensDeMinage,
  type EtatJeu,
} from '../jeu/mineur'
import { MINERAIS_RARES } from '../evenements'
import type { Eclat, Gain, Trouvaille } from '../usePartie'
import { Personnage } from './Personnage'
import { VueVillage } from './VueVillage'

type Props = {
  etat: EtatJeu
  enMinage: boolean
  versLaGauche: boolean
  // La marche au village
  xVillage: number
  versLaGaucheVillage: boolean
  enMarcheVillage: boolean
  onAllerStand: (index: number) => void
  gains: Gain[]
  eclats: Eclat[]
  trouvailles: Trouvaille[]
}

type CaseMine = IdBloc | 'bedrock' | null

// Une case de la mine (un bloc, ou un trou déjà creusé).
function Case({ bloc, profondeur, prestige, classe = '' }: { bloc: CaseMine; profondeur: number; prestige: number; classe?: string }) {
  if (bloc === null) return <div className={`case vide ${classe}`} />
  const roche = estRocheDure(profondeur, prestige) ? 'roche-deepslate' : 'roche-pierre'
  return <div className={`case bloc bloc-${bloc} ${roche} ${classe}`} />
}

// Les éclats d'un bloc qui casse : de petits morceaux qui sautent et retombent.
// Chaque morceau a la texture du bloc ; sa direction est fixée par son numéro.
const DIRECTIONS_ECLATS = [
  { dx: -26, dy: -34 },
  { dx: -12, dy: -46 },
  { dx: 4, dy: -40 },
  { dx: 18, dy: -50 },
  { dx: 30, dy: -30 },
  { dx: -34, dy: -16 },
  { dx: 36, dy: -12 },
]

function Eclats({ bloc, profondeur, prestige }: { bloc: IdBloc; profondeur: number; prestige: number }) {
  const roche = estRocheDure(profondeur, prestige) ? 'roche-deepslate' : 'roche-pierre'
  return (
    <span className="eclats" aria-hidden="true">
      {DIRECTIONS_ECLATS.map((d, i) => (
        <i
          key={i}
          className={`eclat bloc-${bloc} ${roche}`}
          style={{ ['--dx' as string]: `${d.dx}px`, ['--dy' as string]: `${d.dy}px`, ['--tour' as string]: `${(i % 2 ? 1 : -1) * (90 + i * 40)}deg` }}
        />
      ))}
    </span>
  )
}

// Un minerai trouvé : il s'envole en brillant au-dessus du mineur.
function TrouvailleRare({ trouvaille }: { trouvaille: Trouvaille }) {
  return (
    <span className={`trouvaille trouvaille-${trouvaille.bloc} ${MINERAIS_RARES.includes(trouvaille.bloc) ? 'trouvaille-rare' : ''}`} aria-hidden="true">
      <span className="trouvaille-rayons" />
      <span className={`mini-bloc bloc-${trouvaille.bloc} roche-pierre`} />
      <span className="trouvaille-texte">
        +{trouvaille.nombre} {BLOCS[trouvaille.bloc].nom}
      </span>
      <span className="etincelles">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  )
}

// Les pièces qui jaillissent d'une vente.
const PIECES_VENTE = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  return { dx: Math.round(Math.cos(angle) * (60 + (i % 3) * 18)), dy: Math.round(Math.sin(angle) * (40 + (i % 2) * 16)) - 20 }
})

// Une rangée de la mine : l'étiquette, la place de l'échelle et de l'ascenseur,
// les 10 cases, puis la place du puits de la foreuse et celle de la galerie des mineurs.
function Rangee({ profondeur, prestige, classe = '', children }: { profondeur: number; prestige: number; classe?: string; children: ReactNode }) {
  return (
    <div className={`rangee ${zoneDe(profondeur, prestige).classe} ${classe}`}>
      <span className="etiquette">{profondeur % 5 === 0 || classe.includes('front') ? `-${profondeur} m` : ''}</span>
      <div className="place-echelle" />
      <div className="place-ascenseur" />
      {children}
      <div className="place-foreuse" />
      <div className="place-mineurs" />
    </div>
  )
}

// Une rangée déjà creusée. « memo » évite de la redessiner si rien n'a changé :
// il peut y en avoir plus de 100.
const RangeeCreusee = memo(function RangeeCreusee({ profondeur, prestige }: { profondeur: number; prestige: number }) {
  return (
    <Rangee profondeur={profondeur} prestige={prestige} classe="creusee">
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
  // Le puits descend jusqu'à la foreuse (sans dépasser ce qu'on affiche) ;
  // plus profonde que ce qu'on affiche, elle est dessinée en bas avec une flèche.
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
        <span className="foreuse-lumiere" />
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

// Les mineurs employés (prestige 2) dans leur galerie de 2 cases, à droite de la foreuse : à
// gauche leur ascenseur, à droite le trou où ils creusent. Chacun a sa cabine, qu'on voit
// descendre avec lui, l'attendre juste à côté de lui pendant qu'il creuse, puis le remonter
// au village quand son sac est plein. Leur étiquette prend la couleur de leur rareté.
function GalerieMineurs({ etat, derniereRangee }: { etat: EtatJeu; derniereRangee: number }) {
  if (etat.employes.length === 0) return null
  // La galerie descend jusqu'au mineur le plus profond (sans dépasser ce qu'on affiche).
  const plusProfond = Math.max(...etat.employes.map((mineur) => mineur.profondeur))
  const hauteur = Math.min(plusProfond, derniereRangee)
  const unEnRoute = etat.employes.some((mineur) => mineur.etape === 'monte' || mineur.etape === 'descend')
  // Une rangée affichée : jamais plus bas que la dernière rangée qu'on voit.
  const dansLaVue = (rangee: number) => Math.min(rangee, derniereRangee - 1)

  return (
    <>
      <div className="galerie-mineurs" style={{ height: `calc(var(--pas) * ${hauteur} + 14px)` }} />
      <div className="trou-mineurs" style={{ height: `calc(var(--pas) * ${hauteur} + 14px)` }} />
      <span className={`poulie-ascenseur poulie-mineurs ${unEnRoute ? 'tourne' : ''}`} aria-hidden="true" />
      {etat.employes.map((mineur, index) => {
        const creuse = mineur.etape === 'creuse'
        const enRoute = mineur.etape === 'monte' || mineur.etape === 'descend'
        // Où est sa cabine (0 = au village) : avec lui pendant les trajets, juste à côté de lui
        // quand il creuse, et en haut quand il vend au marché (ou attend son salaire).
        const positionCabine = enRoute ? mineur.position : creuse ? Math.max(0, mineur.profondeur - 1) : 0
        const cabine = dansLaVue(positionCabine)
        const cabinePlusBas = positionCabine > derniereRangee - 1
        // Quand il creuse, il se tient juste au-dessus du bloc qu'il casse.
        const rangeeMineur = dansLaVue(mineur.profondeur - 1)
        const mineurPlusBas = mineur.profondeur - 1 > derniereRangee - 1
        // L'indicateur : ce qu'il fait (icône), sa profondeur quand il creuse, sinon le temps restant.
        const detail = creuse ? `-${mineur.profondeur} m` : `${Math.ceil(secondesRestantesEmploye(etat, mineur))} s`
        const remplissage = nbDansSacEmploye(mineur) / tailleSacEmploye(etat, mineur)
        const etiquette = (plusBas: boolean) => (
          <span className={`mineur-nom rarete-${mineur.rarete}`}>
            {iconeActiviteEmploye(mineur)} <span className="mineur-prenom">{mineur.nom}</span> {detail}
            {/* Plus profond que ce qu'on voit : il est dessiné en bas, avec sa vraie profondeur. */}
            {plusBas && ' ↓'}
            {/* Le remplissage de son sac à dos. */}
            <span className="mineur-sac" style={{ ['--remplissage' as string]: remplissage }} />
          </span>
        )
        const couleurPioche = PIOCHES[mineur.niveau]?.couleur ?? PIOCHES[0].couleur
        return (
          <Fragment key={index}>
            {/* Le câble, de la poulie jusqu'au toit de sa cabine. */}
            <span className="cable-ascenseur cable-mineurs" style={{ height: `max(0px, calc(var(--pas) * ${cabine - 1} + 14px))` }} aria-hidden="true" />
            <div
              className={`cabine cabine-mineur mineur-${mineur.etape} ${enRoute ? 'cabine-occupee cabine-en-route' : ''}`}
              style={{ top: `calc(var(--pas) * ${cabine - 1})` }}
              title={`${mineur.nom} : ${activiteEmploye(etat, mineur)}`}
            >
              <span className="cabine-toit" aria-hidden="true">
                <span className="cabine-lampe" />
              </span>
              {/* Pendant les trajets (et au marché), l'étiquette est sur la cabine. */}
              {!creuse && etiquette(cabinePlusBas)}
              {enRoute && (
                <div className="passager">
                  <Personnage couleurPioche={couleurPioche} action="repos" />
                </div>
              )}
              <span className="cabine-grille" aria-hidden="true" />
              <span className="cabine-plancher" aria-hidden="true" />
            </div>
            {creuse && (
              <div
                className={`mineur-employe mineur-creuse rarete-${mineur.rarete} ${mineurPlusBas ? 'mineur-plus-bas' : ''}`}
                style={{ top: `calc(var(--pas) * ${rangeeMineur - 1})` }}
                title={`${mineur.nom} : ${activiteEmploye(etat, mineur)}`}
              >
                {etiquette(mineurPlusBas)}
                <Personnage couleurPioche={couleurPioche} action="creuse" />
                {!mineurPlusBas && (
                  <span className={`mineur-bloc case bloc ${estRocheDure(mineur.profondeur, etat.prestige) ? 'bloc-deepslate roche-deepslate' : 'bloc-pierre roche-pierre'}`} aria-hidden="true" />
                )}
              </div>
            )}
          </Fragment>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Le monde entier
// ---------------------------------------------------------------------------

export function VueMonde({
  etat,
  enMinage,
  versLaGauche,
  xVillage,
  versLaGaucheVillage,
  enMarcheVillage,
  onAllerStand,
  gains,
  eclats,
  trouvailles,
}: Props) {
  const conteneurRef = useRef<HTMLElement>(null)
  // Une référence par endroit où le mineur peut être dessiné. Si elles partageaient la même,
  // le mineur qui disparaît d'un endroit (le village, au départ de l'ascenseur) l'effacerait
  // pendant que celui de la cabine est encore là, et la caméra ne saurait plus qui suivre.
  const joueurVillageRef = useRef<HTMLDivElement>(null)
  const joueurCabineRef = useRef<HTMLDivElement>(null)
  const joueurEchelleRef = useRef<HTMLDivElement>(null)
  const joueurFrontRef = useRef<HTMLDivElement>(null)
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
  const enVillageAPied = auVillage && !dansLaCabine

  // Pendant le minage, le mineur se place au-dessus du bloc qu'il casse.
  const colonneAffichee = enMinage && indexActuel !== -1 ? indexActuel : etat.colonneMineur

  // La caméra : on fait défiler la vue pour garder le joueur au milieu.
  // Pendant qu'il bouge (échelle ou ascenseur), la vue le suit directement, par petits pas ;
  // pour les grands sauts (arrivée au village...), elle glisse en douceur.
  const bouge = etat.position !== etat.cible || dansLaCabine
  // Pendant un trajet, la caméra suit la position exacte, à chaque image (mouvement fluide).
  const repere = auVillage ? -1 : bouge ? etat.position : Math.round(etat.position * 4) / 4
  const joueurSuivi = dansLaCabine ? joueurCabineRef : enVillageAPied ? joueurVillageRef : auFront ? joueurFrontRef : joueurEchelleRef
  useEffect(() => {
    const conteneur = conteneurRef.current
    const joueur = joueurSuivi.current
    if (!conteneur || !joueur) return
    const haut = joueur.getBoundingClientRect().top - conteneur.getBoundingClientRect().top + conteneur.scrollTop
    conteneur.scrollTo({ top: haut - conteneur.clientHeight / 2 + joueur.offsetHeight / 2, behavior: bouge ? 'auto' : 'smooth' })
  }, [repere, P, bouge, joueurSuivi])

  const foreuseVisible = foreuseDebloquee(etat) && etat.foreuse.active
  // La pioche qu'il faut pour descendre plus bas (pour le message de la galerie).
  const piocheQuIlFaut = piochePourDescendre(etat)

  // Les rangées sous le front de taille : la couche en cours, puis celles du dessous.
  const rangeesDuBas: ReactNode[] = []
  const bedrock = profondeurBedrock(etat.prestige)
  const derniere = Math.min(P + 4, bedrock + 1)
  for (let d = P; d <= derniere; d++) {
    const rang = d - P
    if (d >= bedrock) {
      rangeesDuBas.push(
        <Rangee key={d} profondeur={d} prestige={etat.prestige}>
          {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
            <Case key={colonne} bloc="bedrock" profondeur={d} prestige={etat.prestige} />
          ))}
        </Rangee>,
      )
      continue
    }
    const blocs: CaseMine[] = rang === 0 ? etat.coucheActuelle : (etat.couchesDessous[rang - 1] ?? Array(LARGEUR_MINE).fill(null))
    // Lumière naturelle : plus une couche est loin sous le mineur, plus elle est sombre.
    rangeesDuBas.push(
      <Rangee key={d} profondeur={d} prestige={etat.prestige} classe={`${rang === 0 ? 'couche-en-cours' : `ombre-${rang}`}`}>
        {blocs.map((bloc, colonne) => {
          const enCours = rang === 0 && colonne === indexActuel
          let classe = ''
          if (enCours) classe = enMinage ? 'en-cours casse' : 'en-cours'
          return (
            <div key={colonne} className="emplacement" style={enCours ? { ['--duree' as string]: `${duree}s` } : undefined}>
              {/* La clé change quand le mineur commence ce bloc, pour relancer l'animation de fissure. */}
              <Case key={enCours ? 'joueur' : 'fixe'} bloc={bloc} profondeur={d} prestige={etat.prestige} classe={classe} />
            </div>
          )
        })}
      </Rangee>,
    )
  }

  return (
    <section ref={conteneurRef} className="monde" aria-label="Le village et la mine">
      {/* Les grosses ventes : « +X $ » au milieu de l'écran, avec une gerbe de pièces. */}
      <div className="ventes" aria-hidden="true">
        {gains
          .filter((g) => g.vente)
          .map((g) => (
            <span key={g.id} className="gain-vente">
              <span className="gain-vente-texte">+{g.montant.toLocaleString('fr-FR')} $</span>
              {PIECES_VENTE.map((p, i) => (
                <i key={i} className="piece" style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, animationDelay: `${(i % 4) * 40}ms` }} />
              ))}
            </span>
          ))}
      </div>

      {/* De petits rappels toujours visibles : la foreuse (on clique pour aller la voir) et les mineurs. */}
      {(foreuseVisible || etat.employes.length > 0) && (
        <div className="indicateurs">
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
              Foreuse -{etat.foreuse.profondeur} m ·{' '}
              {foreuseEnMarche(etat) ? 'en marche' : 'arrêtée'}
            </button>
          )}
          {etat.employes.length > 0 && (
            <span
              className={`indicateur-foreuse indicateur-mineurs ${nbSansSalaire(etat) > 0 ? 'indicateur-alerte' : ''}`}
              title="Tes mineurs : ⛏️ creusent, ⏫ remontent, 💰 vendent, ⏬ redescendent, 😠 attendent leur salaire (stand Personnel)"
            >
              👷 {etat.employes.length} mineur{etat.employes.length > 1 ? 's' : ''}
              {/* Combien creusent, remontent, vendent, redescendent (seulement ce qui n'est pas à 0). */}
              {(['creuse', 'monte', 'vend', 'descend'] as const).map((etape) => {
                const lesquels = etat.employes.filter((m) => m.etape === etape && m.tempsPaye > 0)
                if (lesquels.length === 0) return null
                return <span key={etape}> · {iconeActiviteEmploye(lesquels[0])} {lesquels.length}</span>
              })}
              {/* Ceux qui ne sont plus payés : il faut aller les payer au stand Personnel. */}
              {nbSansSalaire(etat) > 0 && <strong> · 😠 {nbSansSalaire(etat)} sans salaire !</strong>}
            </span>
          )}
        </div>
      )}

      <VueVillage
        etat={etat}
        x={xVillage}
        versLaGauche={versLaGaucheVillage}
        enMarche={enMarcheVillage}
        onAllerStand={onAllerStand}
        joueurRef={joueurVillageRef}
      />

      <div className="puits-mine">
        {/* L'échelle descend du puits jusqu'au front de taille. */}
        <div className="echelle-longue" style={{ height: `calc(var(--pas) * ${front} + 14px)` }} />

        {/* L'ascenseur (ou son emplacement s'il n'est pas construit) : la cabine monte et descend. */}
        <div className={`rail-ascenseur ${ascenseur.niveau > 0 ? 'construit' : ''}`} style={{ height: `calc(var(--pas) * ${front} + 14px)` }} />
        {ascenseur.niveau > 0 && (
          <>
            {/* La poulie en haut du puits, et le câble qui tient la cabine. */}
            <span className={`poulie-ascenseur ${ascenseurEnMouvement(etat) ? 'tourne' : ''}`} aria-hidden="true" />
            <span className="cable-ascenseur" style={{ height: `calc(var(--pas) * ${ascenseur.position - 1} + 14px)` }} aria-hidden="true" />
            {/* La cabine : une cage en métal avec un toit, une grille, un plancher rayé et une lampe. */}
            <div
              className={`cabine ${dansLaCabine ? 'cabine-occupee' : ''} ${ascenseurEnMouvement(etat) ? 'cabine-en-route' : ''}`}
              style={{ top: `calc(var(--pas) * ${ascenseur.position - 1})` }}
            >
              <span className="cabine-toit" aria-hidden="true">
                <span className="cabine-lampe" />
              </span>
              {/* Les minerais qu'elle transporte : une petite caisse pleine de minerai. */}
              {(Object.keys(ascenseur.chargement).length > 0 || nbSurQuai(etat) > 0) && (
                <span className="cabine-chargee" aria-hidden="true" />
              )}
              {dansLaCabine && (
                <div ref={joueurCabineRef} className="passager">
                  <Personnage couleurPioche={couleurPioche} action="repos" />
                </div>
              )}
              {/* La grille passe devant le passager et le chargement. */}
              <span className="cabine-grille" aria-hidden="true" />
              <span className="cabine-plancher" aria-hidden="true" />
            </div>
          </>
        )}

        {/* Le joueur sur l'échelle. */}
        {surEchelle && (
          <div ref={joueurEchelleRef} className="joueur-echelle" style={{ top: `calc(var(--pas) * ${etat.position - 1})` }}>
            <Personnage couleurPioche={couleurPioche} action="grimpe" />
          </div>
        )}

        <PuitsForeuse etat={etat} derniereRangee={derniere} teteRef={foreuseRef} />
        <GalerieMineurs etat={etat} derniereRangee={derniere} />

        {/* Tout ce qui a déjà été creusé, depuis l'entrée du puits. */}
        {Array.from({ length: Math.max(0, front - 1) }, (_, i) => (
          <RangeeCreusee key={i + 1} profondeur={i + 1} prestige={etat.prestige} />
        ))}

        {/* Le front de taille, où se tient le mineur. */}
        {front >= 1 && (
          <Rangee profondeur={front} prestige={etat.prestige} classe="creusee front">
            {Array.from({ length: LARGEUR_MINE }, (_, colonne) => (
              <div key={colonne} className="case vide">
                {auFront && colonne === colonneAffichee && (
                  <div ref={joueurFrontRef} className="porte-joueur">
                    {/* S'il part vers le puits, il marche vers la gauche, case par case. */}
                    <Personnage
                      couleurPioche={couleurPioche}
                      action={etat.depart ? 'marche' : enMinage ? 'creuse' : 'repos'}
                      // Il part vers le puits (à gauche), il creuse dans le sens de la couche
                      // (en zigzag), ou il regarde là où on l'a fait marcher.
                      versLaGauche={etat.depart ? true : enMinage ? sensDeMinage(etat) < 0 : versLaGauche}
                    />
                  </div>
                )}
                {eclats
                  .filter((e) => e.colonne === colonne)
                  .map((e) => (
                    <Eclats key={e.id} bloc={e.bloc} profondeur={P} prestige={etat.prestige} />
                  ))}
                {trouvailles
                  .filter((t) => t.colonne === colonne)
                  .map((t) => (
                    <TrouvailleRare key={t.id} trouvaille={t} />
                  ))}
              </div>
            ))}
          </Rangee>
        )}

        {rangeesDuBas}
      </div>

      {etat.victoire && !auVillage && (
        <p className="bandeau-galerie">🏆 Bedrock atteinte : creuse encore ici, ou passe prestige à l’arbre de prestige (village).</p>
      )}
      {/* La couche du dessous est trop dure : un message bien visible, qui dit quelle pioche il faut. */}
      {etat.enGalerie && !etat.victoire && !auVillage && (
        <p className="bandeau-galerie bandeau-trop-dur">
          🧱 Couche trop dure pour ta pioche en {piocheEquipee(etat).nom} !{' '}
          {piocheQuIlFaut !== null && piocheQuIlFaut.niveau in etat.pioches && (
            <>
              Équipe ta pioche en <strong>{piocheQuIlFaut.nom}</strong> (onglet Pioches).
            </>
          )}
          {piocheQuIlFaut !== null && !(piocheQuIlFaut.niveau in etat.pioches) && (
            <>
              Il te faut une pioche en <strong>{piocheQuIlFaut.nom}</strong> : achète-la au forgeron (village).
            </>
          )}
        </p>
      )}


      <div className="gains" aria-hidden="true">
        {gains
          .filter((g) => !g.vente)
          .map((g) => (
          <span key={g.id} className="gain">
            +{g.montant} $
          </span>
        ))}
      </div>
    </section>
  )
}
