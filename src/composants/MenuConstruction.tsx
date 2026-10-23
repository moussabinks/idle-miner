// Le menu « Bâtiments » du village (20/10) : tous les bâtiments du jeu, avec leur prix (le
// marché est gratuit) ou le niveau (du joueur, 29/10, ou de la mine) qu'il faut (cadenas). On en choisit un, puis on le
// pose où on veut sur la carte. Les rails (3 fer la case) et les chemins de pavés sont là aussi.
// Les minerais se paient avec ceux du sac, puis ceux du coffre de la mine.
// (Les décorations à acheter ont été retirées le 27/10.)
// Aucune règle du jeu ici : on lit l'état et on appelle les fonctions de src/jeu/batiments.ts.

import { BATIMENTS, BLOCS, COUT_CHEMIN, COUT_RAIL, LISTE_BATIMENTS, NIVEAU_JOUEUR_POUR, type Cout, type IdBatiment, type IdBloc } from '../jeu/donnees'
import { batimentDebloque, estPose, nouveautesBatiments, peutConstruire, type TypeSol } from '../jeu/batiments'
import { disponible, type EtatJeu } from '../jeu/mineur'
import { niveauPourBatiment, railsDebloques, verrouNiveau } from '../jeu/niveaux'
import { IMAGES_BATIMENTS } from './iso'
import { BadgeXp } from './Amelioration'

type Props = {
  etat: EtatJeu
  onFermer: () => void
  onPoserBatiment: (id: IdBatiment) => void
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

function CarteBatiment({ etat, id, nouveau, onPoser }: { etat: EtatJeu; id: IdBatiment; nouveau: boolean; onPoser: () => void }) {
  const info = BATIMENTS[id]
  const debloque = batimentDebloque(etat, id)
  const pose = estPose(etat, id)
  // On peut le poser tout de suite : sa carte brille, pour donner envie.
  const abordable = !pose && peutConstruire(etat, id)
  return (
    <article className={`carte-construction ${debloque ? '' : 'construction-bloquee'} ${pose ? 'construction-posee' : ''} ${abordable ? 'construction-abordable' : ''}`}>
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
          <span className="construction-verrou">
            🔒 {verrouNiveau(etat, niveauPourBatiment(id)) !== null ? <BadgeXp texte={`⭐ ${niveauPourBatiment(id)}`} /> : `Mine niveau ${info.niveauMine}`}
          </span>
        ) : (
          <>
            <PrixConstruction etat={etat} cout={info.cout} />
            <button className="bouton bouton-petit bouton-acheter" data-tuto={`poser-${id}`} disabled={!peutConstruire(etat, id)} onClick={onPoser}>
              🏗️ Poser
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export function MenuConstruction({ etat, onFermer, onPoserBatiment, onPinceau }: Props) {
  const nouveautes = nouveautesBatiments(etat)
  return (
    <div className="voile voile-construction" role="dialog" aria-modal="true" aria-label="Construire" onClick={onFermer}>
      <div className="carte fenetre-construction" onClick={(e) => e.stopPropagation()}>
        <div className="entete-construction">
          <h2 className="titre-construction">🏗️ Bâtiments</h2>
          <button className="bouton-fermer" onClick={onFermer} aria-label="Fermer">
            ✖
          </button>
        </div>
        <p className="discret">
          💵 {Math.floor(etat.argent).toLocaleString('fr-FR')} $ · 🪨 {disponible(etat, 'pierre')} pierre · 🔩 {disponible(etat, 'fer')} fer (sac + coffre de la mine)
        </p>
        <div className="grille-construction">
          {LISTE_BATIMENTS.map((id) => (
            <CarteBatiment key={id} etat={etat} id={id} nouveau={nouveautes.includes(id)} onPoser={() => onPoserBatiment(id)} />
          ))}
          <article className={`carte-construction ${railsDebloques(etat) ? '' : 'construction-bloquee'}`}>
            <div className="construction-image">
              <img src="/images/batiments/rails.webp" alt="" draggable={false} />
              {!railsDebloques(etat) && <span className="construction-cadenas">🔒</span>}
            </div>
            <div className="construction-texte">
              <strong>🛤️ Rails</strong>
              <span className="discret">Relie deux bâtiments (mine, marché, foreuse, générateur), puis envoie un wagonnet depuis le panneau du départ. Pose-les en ligne, ils se raccordent tout seuls ; un rail sur le côté fait un virage ou un embranchement. Pas de boucle !</span>
              <span className="discret">1 case · {etat.village.rails.length} posée{etat.village.rails.length > 1 ? 's' : ''}</span>
            </div>
            <div className="construction-achat">
              {railsDebloques(etat) ? (
                <>
                  <PrixConstruction etat={etat} cout={COUT_RAIL} />
                  <button className="bouton bouton-petit bouton-acheter" onClick={() => onPinceau('rail')}>
                    🛤️ Poser des rails
                  </button>
                </>
              ) : (
                <span className="construction-verrou">
                  🔒 <BadgeXp texte={`⭐ ${NIVEAU_JOUEUR_POUR.rails}`} />
                </span>
              )}
            </div>
          </article>
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
        </div>
      </div>
    </div>
  )
}
