// Le menu « Bâtiments » et le menu « Décorations » du village (20/10).
//   - Bâtiments : tous les bâtiments du jeu, avec leur prix (le marché est gratuit) ou le
//     niveau de mine qu'il faut (cadenas). On en choisit un, puis on le pose où on veut sur la
//     carte. Les rails (3 fer la case) sont là aussi.
// Les minerais se paient avec ceux du sac, puis ceux du coffre de la mine.
//   - Décorations : des fleurs, des arbres, des lanternes... et des chemins de pavés, seulement
//     pour faire joli (payés en argent).
// Aucune règle du jeu ici : on lit l'état et on appelle les fonctions de src/jeu/batiments.ts.

import { BATIMENTS, COUT_CHEMIN, COUT_RAIL, DECORATIONS, LISTE_BATIMENTS, LISTE_DECORATIONS, type Cout, type IdBatiment, type IdDecoration } from '../jeu/donnees'
import {
  batimentDebloque,
  decorationDebloquee,
  estPose,
  nouveautesBatiments,
  peutAcheterDecoration,
  peutConstruire,
  type TypeSol,
} from '../jeu/batiments'
import { disponible, type EtatJeu } from '../jeu/mineur'
import { BLOCS, type IdBloc } from '../jeu/donnees'
import { DessinDecoration } from './DessinsVillage'
import { IMAGES_BATIMENTS, hauteurDecoration, versEcran } from './iso'

export type OngletConstruction = 'batiments' | 'decorations'

type Props = {
  etat: EtatJeu
  onglet: OngletConstruction
  onOnglet: (onglet: OngletConstruction) => void
  onFermer: () => void
  onPoserBatiment: (id: IdBatiment) => void
  onPoserDecoration: (id: IdDecoration) => void
  onPinceau: (sol: TypeSol) => void
}

// Le prix d'une construction (les minerais du sac et du coffre de la mine comptent).
function PrixConstruction({ etat, cout }: { etat: EtatJeu; cout: Cout }) {
  if (!cout.argent && Object.keys(cout.materiaux).length === 0) return <span className="ok prix-gratuit">Gratuit !</span>
  return (
    <span className="materiaux">
      {cout.argent !== undefined && <span className={etat.argent >= cout.argent ? 'ok' : 'manque'}>{cout.argent.toLocaleString('fr-FR')} $</span>}
      {Object.entries(cout.materiaux).map(([id, nombre]) => {
        const bloc = id as IdBloc
        const possede = disponible(etat, bloc)
        return (
          <span key={bloc} className={possede >= (nombre ?? 0) ? 'ok' : 'manque'}>
            {Math.min(possede, nombre ?? 0)}/{nombre} {BLOCS[bloc].emoji} {BLOCS[bloc].nom}
          </span>
        )
      })}
    </span>
  )
}

// Une petite image d'une décoration (son dessin SVG, cadré).
function ApercuDecoration({ id }: { id: IdDecoration }) {
  const taille = DECORATIONS[id].taille
  const c = versEcran(taille / 2, taille / 2)
  const hauteur = hauteurDecoration(id) + 18
  const largeur = taille === 2 ? 84 : 46
  return (
    <svg className="apercu-deco" viewBox={`${c.x - largeur / 2} ${c.y - hauteur + 12} ${largeur} ${hauteur}`} aria-hidden="true">
      <DessinDecoration id={id} x={0} y={0} taille={taille} miroir={false} />
    </svg>
  )
}

function CarteBatiment({ etat, id, nouveau, onPoser }: { etat: EtatJeu; id: IdBatiment; nouveau: boolean; onPoser: () => void }) {
  const info = BATIMENTS[id]
  const debloque = batimentDebloque(etat, id)
  const pose = estPose(etat, id)
  return (
    <article className={`carte-construction ${debloque ? '' : 'construction-bloquee'} ${pose ? 'construction-posee' : ''}`}>
      {nouveau && <span className="pastille-nouveau">Nouveau !</span>}
      <div className="construction-image">
        <img src={IMAGES_BATIMENTS[id as Exclude<IdBatiment, 'puits'>]} alt="" draggable={false} />
        {!debloque && <span className="construction-cadenas">🔒</span>}
      </div>
      <div className="construction-texte">
        <strong>
          {info.emoji} {info.nom}
        </strong>
        <span className="discret">{info.description}</span>
        <span className="discret">
          {info.taille} × {info.taille} cases
        </span>
      </div>
      <div className="construction-achat">
        {pose ? (
          <span className="ok">✔ Construit</span>
        ) : !debloque ? (
          <span className="construction-verrou">🔒 Mine niveau {info.niveauMine}</span>
        ) : (
          <>
            <PrixConstruction etat={etat} cout={info.cout} />
            <button className="bouton bouton-petit bouton-acheter" disabled={!peutConstruire(etat, id)} onClick={onPoser}>
              🏗️ Poser
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export function MenuConstruction({ etat, onglet, onOnglet, onFermer, onPoserBatiment, onPoserDecoration, onPinceau }: Props) {
  const nouveautes = nouveautesBatiments(etat)
  return (
    <div className="voile voile-construction" role="dialog" aria-modal="true" aria-label="Construire" onClick={onFermer}>
      <div className="carte fenetre-construction" onClick={(e) => e.stopPropagation()}>
        <div className="entete-construction">
          <nav className="onglets" role="tablist">
            <button role="tab" aria-selected={onglet === 'batiments'} className={`onglet ${onglet === 'batiments' ? 'actif' : ''}`} onClick={() => onOnglet('batiments')}>
              🏗️ Bâtiments
            </button>
            <button role="tab" aria-selected={onglet === 'decorations'} className={`onglet ${onglet === 'decorations' ? 'actif' : ''}`} onClick={() => onOnglet('decorations')}>
              🌸 Décorations
            </button>
          </nav>
          <button className="bouton-fermer" onClick={onFermer} aria-label="Fermer">
            ✖
          </button>
        </div>
        <p className="discret">
          💵 {Math.floor(etat.argent).toLocaleString('fr-FR')} $ · 🪨 {disponible(etat, 'pierre')} pierre · 🔩 {disponible(etat, 'fer')} fer (sac + coffre de la mine)
        </p>

        {onglet === 'batiments' && (
          <div className="grille-construction">
            {LISTE_BATIMENTS.map((id) => (
              <CarteBatiment key={id} etat={etat} id={id} nouveau={nouveautes.includes(id)} onPoser={() => onPoserBatiment(id)} />
            ))}
            <article className="carte-construction">
              <div className="construction-image">
                <img src="/images/batiments/rails.webp" alt="" draggable={false} />
              </div>
              <div className="construction-texte">
                <strong>🛤️ Rails</strong>
                <span className="discret">Relie la mine au marché par une ligne continue : le wagonnet y emporte le coffre de la mine. Pose-les en ligne, ils se raccordent tout seuls ; un rail posé sur le côté fait un virage.</span>
                <span className="discret">1 case · {etat.village.rails.length} posée{etat.village.rails.length > 1 ? 's' : ''}</span>
              </div>
              <div className="construction-achat">
                <PrixConstruction etat={etat} cout={COUT_RAIL} />
                <button className="bouton bouton-petit bouton-acheter" onClick={() => onPinceau('rail')}>
                  🛤️ Poser des rails
                </button>
              </div>
            </article>
          </div>
        )}

        {onglet === 'decorations' && (
          <div className="grille-construction grille-decorations">
            <article className="carte-construction">
              <div className="construction-image construction-chemin" aria-hidden="true" />
              <div className="construction-texte">
                <strong>🪨 Chemin de pavés</strong>
                <span className="discret">Pour relier tes bâtiments. Juste joli !</span>
              </div>
              <div className="construction-achat">
                <PrixConstruction etat={etat} cout={COUT_CHEMIN} />
                <button className="bouton bouton-petit bouton-acheter" onClick={() => onPinceau('chemin')}>
                  🖌️ Poser
                </button>
              </div>
            </article>
            {LISTE_DECORATIONS.map((id) => {
              const deco = DECORATIONS[id]
              const debloquee = decorationDebloquee(etat, id)
              return (
                <article key={id} className={`carte-construction ${debloquee ? '' : 'construction-bloquee'}`}>
                  <div className="construction-image">
                    <ApercuDecoration id={id} />
                    {!debloquee && <span className="construction-cadenas">🔒</span>}
                  </div>
                  <div className="construction-texte">
                    <strong>{deco.nom}</strong>
                    <span className="discret">
                      {deco.taille} × {deco.taille} {deco.taille > 1 ? 'cases' : 'case'}
                      {deco.bloque ? ' · on ne passe pas à travers' : ''}
                    </span>
                  </div>
                  <div className="construction-achat">
                    {debloquee ? (
                      <>
                        <span className={etat.argent >= deco.prix ? 'ok' : 'manque'}>{deco.prix.toLocaleString('fr-FR')} $</span>
                        <button className="bouton bouton-petit bouton-acheter" disabled={!peutAcheterDecoration(etat, id)} onClick={() => onPoserDecoration(id)}>
                          🌸 Poser
                        </button>
                      </>
                    ) : (
                      <span className="construction-verrou">🔒 Mine niveau {deco.niveauMine}</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
