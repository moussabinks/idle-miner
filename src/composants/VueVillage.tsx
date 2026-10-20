// Le village : un monde plus large que l'écran, avec un chemin, des hautes herbes,
// des fleurs, des arbres et les stands. La vue suit le mineur quand il marche.

import { useEffect, useRef, useState, type RefObject } from 'react'
import { aleatoireAvecGraine, choisir, entierEntre } from '../jeu/aleatoire'
import { PIOCHES } from '../jeu/donnees'
import { alerteSalaires, employesDebloques } from '../jeu/employes'
import { foreuseDebloquee, foreuseEnMarche } from '../jeu/foreuse'
import { DECOUVERTES, decouvertesAMontrer } from '../jeu/decouvertes'
import { aLaSurface, estCassee, piocheEquipee, type EtatJeu } from '../jeu/mineur'
import { Icone } from './Icone'
import { Personnage } from './Personnage'
import { LONGUEUR_VILLAGE, STANDS, TUILE, standProche } from './stands'

type Props = {
  etat: EtatJeu
  x: number // position du mineur, en tuiles
  versLaGauche: boolean
  enMarche: boolean
  onAllerStand: (index: number) => void
  joueurRef: RefObject<HTMLDivElement | null>
}

// ---------------------------------------------------------------------------
// Les décorations, tirées une fois pour toutes (toujours les mêmes à chaque visite)
// ---------------------------------------------------------------------------

type Decor = { type: 'arbre' | 'herbe' | 'fleur' | 'rocher' | 'barriere'; x: number; devant: boolean; couleur?: string }

// Le décor continue un peu après le dernier stand, pour les écrans larges.
const LONGUEUR_DECOR = 40

function genererDecor(): Decor[] {
  const aleatoire = aleatoireAvecGraine(2026)
  const decor: Decor[] = []
  const loinDesStands = (x: number, distance: number) => STANDS.every((s) => Math.abs(s.x - x) > distance)

  // Des arbres entre les stands.
  for (let x = 0.5; x < LONGUEUR_DECOR; x += 1.5 + aleatoire() * 2) {
    if (loinDesStands(x, 1.3)) decor.push({ type: 'arbre', x, devant: false })
  }
  // Des hautes herbes et des fleurs tout le long, derrière et devant le chemin.
  for (let x = 0.2; x < LONGUEUR_DECOR; x += 0.35 + aleatoire() * 0.6) {
    const devant = aleatoire() < 0.5
    if (aleatoire() < 0.25) decor.push({ type: 'fleur', x, devant, couleur: choisir(aleatoire, ['#e5534b', '#f5d142', '#f2f2f2', '#b48ee8']) })
    else decor.push({ type: 'herbe', x, devant })
  }
  // Quelques rochers et des bouts de barrière.
  for (let i = 0; i < 3; i++) decor.push({ type: 'rocher', x: entierEntre(aleatoire, 1, LONGUEUR_VILLAGE - 2) + 0.3, devant: true })
  for (const x of [21.8, 23.2]) decor.push({ type: 'barriere', x, devant: false })
  return decor
}

const DECOR = genererDecor()

// Des collines au fond (elles défilent moins vite que le reste : effet de profondeur).
const COLLINES = Array.from({ length: 9 }, (_, i) => ({ x: i * 7 - 2, largeur: 9 + (i % 3) * 3, hauteur: 46 + (i % 4) * 14 }))

// ---------------------------------------------------------------------------

export function VueVillage({ etat, x, versLaGauche, enMarche, onAllerStand, joueurRef }: Props) {
  // La largeur visible du village, pour placer la « caméra ».
  const cadreRef = useRef<HTMLDivElement>(null)
  const [largeurVue, setLargeurVue] = useState(600)
  useEffect(() => {
    const cadre = cadreRef.current
    if (!cadre) return
    const observateur = new ResizeObserver(() => setLargeurVue(cadre.clientWidth))
    observateur.observe(cadre)
    return () => observateur.disconnect()
  }, [])

  // Sur un grand écran, le monde prend au moins toute la largeur visible.
  const largeurMonde = Math.max(LONGUEUR_VILLAGE * TUILE, largeurVue)
  const camera = Math.min(largeurMonde - largeurVue, Math.max(0, x * TUILE - largeurVue / 2))

  const auVillage = aLaSurface(etat)
  const couleurPioche = estCassee(etat) ? null : piocheEquipee(etat).couleur
  const standActif = auVillage ? standProche(x) : null
  // Un stand tout juste débloqué (foreuse au prestige 1, Personnel au prestige 2, recruteur et
  // manager ensuite) : une flèche qui clignote sur le côté montre où il est, et un « Nouveau ! »
  // saute au-dessus de lui.
  const aDecouvrir = auVillage ? decouvertesAMontrer(etat) : []
  const standsNouveaux = aDecouvrir.map((id) => DECOUVERTES[id].stand)
  const indexCible = aDecouvrir.length > 0 ? STANDS.findIndex((s) => s.id === DECOUVERTES[aDecouvrir[0]].stand) : -1
  const cible = indexCible >= 0 ? STANDS[indexCible] : null
  const versLaDroite = cible !== null && cible.x > x
  // Des mineurs ne sont pas payés : une flèche rouge (même style) les montre au stand Personnel.
  const alerte = auVillage ? alerteSalaires(etat) : null
  const indexPersonnel = STANDS.findIndex((s) => s.id === 'employes')
  const personnel = STANDS[indexPersonnel]
  const salairesVersLaDroite = personnel.x > x
  // Les mineurs qui attendent leur salaire, devant le stand Personnel.
  const enAttente = etat.employes.filter((e) => e.etape === 'attend')

  return (
    <div ref={cadreRef} className="village">
      <div className="soleil" aria-hidden="true" />
      {cible && standActif?.id !== cible.id && (
        <button className={`fleche-decouverte ${versLaDroite ? 'fleche-droite' : 'fleche-gauche'}`} onClick={() => onAllerStand(indexCible)}>
          {!versLaDroite && <span className="fleche-pointe">⬅</span>}
          <span>
            Nouveau : <strong>{DECOUVERTES[aDecouvrir[0]].nom}</strong> !
          </span>
          {versLaDroite && <span className="fleche-pointe">➡</span>}
        </button>
      )}
      {alerte && standActif?.id !== 'employes' && (
        <button
          className={`fleche-decouverte fleche-salaires ${salairesVersLaDroite ? 'fleche-droite' : 'fleche-gauche'}`}
          onClick={() => onAllerStand(indexPersonnel)}
        >
          {!salairesVersLaDroite && <span className="fleche-pointe">⬅</span>}
          <span>
            {alerte} <strong>Personnel</strong>
          </span>
          {salairesVersLaDroite && <span className="fleche-pointe">➡</span>}
        </button>
      )}
      <div className="nuage nuage-1" aria-hidden="true" />
      <div className="nuage nuage-2" aria-hidden="true" />

      {/* Les collines du fond défilent à 40 % de la vitesse : effet de profondeur. */}
      <div className="collines" style={{ transform: `translateX(${-camera * 0.4}px)` }} aria-hidden="true">
        {COLLINES.map((c, i) => (
          <span key={i} className="colline" style={{ left: c.x * TUILE, width: c.largeur * TUILE, height: c.hauteur }} />
        ))}
      </div>

      <div className="village-monde" style={{ width: largeurMonde, transform: `translateX(${-camera}px)` }}>
        <div className="sol-village" aria-hidden="true" />

        {/* Décor derrière le chemin */}
        {DECOR.filter((d) => !d.devant).map((d, i) => (
          <span
            key={`f${i}`}
            className={`decor decor-${d.type} decor-fond`}
            style={{ left: d.x * TUILE, ['--couleur' as string]: d.couleur }}
            aria-hidden="true"
          />
        ))}

        {/* Les stands */}
        {STANDS.map((stand, index) => {
          // La foreuse s'ouvre au prestige 1, les mineurs au prestige 2 : avant, un cadenas.
          const verrouille = (stand.id === 'foreuse' && !foreuseDebloquee(etat)) || (stand.id === 'employes' && !employesDebloques(etat))
          const actif = standActif?.id === stand.id
          return (
            <button
              key={stand.id}
              className={`stand stand-${stand.id} ${actif ? 'stand-actif' : ''} ${verrouille ? 'stand-verrouille' : ''}`}
              style={{ left: stand.x * TUILE - 34 }}
              onClick={() => onAllerStand(index)}
              disabled={!auVillage}
              title={verrouille ? `Débloqué au prestige ${stand.id === 'foreuse' ? 1 : 2}` : stand.description}
            >
              {stand.id === 'employes' && alerte ? (
                <span className="badge-nouveau badge-salaires">😠 Salaires ! ⬇</span>
              ) : (
                standsNouveaux.includes(stand.id as 'foreuse' | 'employes') && <span className="badge-nouveau">Nouveau ! ⬇</span>
              )}
              <span className="panneau-bois">{stand.nom}</span>
              {stand.id === 'puits' && (
                // L'entrée de la mine : une galerie creusée dans un rocher, étayée de poutres,
                // avec des rails, une lanterne et un wagonnet de minerai.
                <span className="entree-mine" aria-hidden="true">
                  <span className="entree-rocher" />
                  <span className="entree-trou" />
                  <span className="entree-poutres" />
                  <span className="entree-lanterne" />
                  <span className="entree-rails" />
                  <span className="entree-wagon" />
                </span>
              )}
              {stand.id === 'foreuse' && (
                <span className={`derrick ${foreuseEnMarche(etat) ? 'derrick-tourne' : ''}`} aria-hidden="true">
                  <span className="derrick-aura" />
                  <span className="derrick-tour" />
                  <span className="derrick-gyrophare" />
                  <span className="derrick-moteur">
                    <span className="derrick-roue" />
                  </span>
                  <span className="derrick-meche" />
                  {verrouille && (
                    <span className="barriere">
                      <Icone nom="cadenas" taille={22} />
                    </span>
                  )}
                </span>
              )}
              {stand.id !== 'puits' && stand.id !== 'foreuse' && (
                <span className="echoppe" aria-hidden="true">
                  <span className="auvent" />
                  <span className="comptoir">{stand.icone && <Icone nom={stand.icone} taille={28} />}</span>
                  {verrouille && (
                    <span className="barriere">
                      <Icone nom="cadenas" taille={22} />
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}

        {/* Les mineurs pas payés attendent devant le stand Personnel, mécontents. */}
        {enAttente.map((mineur, i) => (
          <div
            key={`${mineur.nom}-${i}`}
            className={`mineur-attend rarete-${mineur.rarete}`}
            style={{ left: (personnel.x + 0.9 + (i % 4) * 0.55) * TUILE - 16, bottom: 30 + Math.floor(i / 4) * 8 }}
            title={`${mineur.nom} attend son salaire`}
          >
            <span className="bulle-colere">😠</span>
            <Personnage couleurPioche={PIOCHES[mineur.niveau]?.couleur ?? null} action="repos" versLaGauche />
          </div>
        ))}

        {/* Le mineur, sur le chemin (sauf s'il vient de monter dans l'ascenseur) */}
        {auVillage && !etat.ascenseur.passager && (
          <div ref={joueurRef} className="joueur-village" style={{ left: x * TUILE - 22 }}>
            <Personnage couleurPioche={couleurPioche} action={enMarche ? 'marche' : 'repos'} versLaGauche={versLaGauche} />
          </div>
        )}

        {/* Décor devant le chemin (les hautes herbes passent devant le mineur) */}
        {DECOR.filter((d) => d.devant).map((d, i) => (
          <span
            key={`d${i}`}
            className={`decor decor-${d.type} decor-devant`}
            style={{ left: d.x * TUILE, ['--couleur' as string]: d.couleur }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
