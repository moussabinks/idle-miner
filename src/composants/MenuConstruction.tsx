// Le menu « Construire » du village (20/10, refait le 25/10) :
//   - en haut, en grand, les bâtiments qui restent à construire : leur image, leur prix et
//     « Construire » (ou le cadenas : ce qu'il faut pour les débloquer) ;
//   - les rails et les chemins de pavés ;
//   - en bas, en tout petit, ceux qui sont déjà construits.
// On en choisit un, puis on le pose où on veut sur la carte. Les minerais se paient avec ceux du
// coffre de la mine.
// Aucune règle du jeu ici : on lit l'état et on appelle les fonctions de src/jeu/batiments.ts.

import type { ReactNode } from 'react'
import { BATIMENTS, BLOCS, COUT_CHEMIN, COUT_RAIL, LISTE_BATIMENTS, NIVEAU_JOUEUR_POUR, type Cout, type IdBatiment } from '../jeu/donnees'
import { batimentDebloque, estPose, nouveautesBatiments, peutConstruire, stockSol, type TypeSol } from '../jeu/batiments'
import { nombre, t } from '../jeu/langue'
import { disponible, peutPayer, type EtatJeu } from '../jeu/mineur'
import { niveauPourBatiment, railsDebloques, verrouNiveau } from '../jeu/niveaux'
import { nombreAbrege } from '../nombres'
import { useJeu } from './contexteJeu'
import { Fenetre } from './Fenetre'
import { IMAGES_BATIMENTS } from './iso'
import { PrixCout } from './PrixCout'
import { cheminPublic } from '../chemins'

type Props = {
  etat: EtatJeu
  onFermer: () => void
  onPoserBatiment: (id: IdBatiment) => void
  onPinceau: (sol: TypeSol) => void
}

// Le prix d'une construction (« Gratuit ! » s'il n'y a rien à payer).
function Prix({ etat, cout }: { etat: EtatJeu; cout: Cout }) {
  if (!cout.argent && Object.keys(cout.materiaux).length === 0) return <span className="prix">{t('Gratuit !')}</span>
  return <PrixCout etat={etat} cout={cout} />
}

// Le cadenas d'un bâtiment : le niveau de la mine (« 🕳️ Mine 2 ») ou du joueur (« ⭐ 3 ») qu'il faut.
function verrouBatiment(etat: EtatJeu, id: IdBatiment): string {
  if (etat.niveauMine < BATIMENTS[id].niveauMine) return `🕳️ ${t('Mine {n}', { n: BATIMENTS[id].niveauMine })}`
  return verrouNiveau(etat, niveauPourBatiment(id)) ?? ''
}

// Un bâtiment à construire : son image, son nom, à quoi il sert, et son prix dans le bouton.
function CarteBatiment({ id, nouveau, onPoser }: { id: IdBatiment; nouveau: boolean; onPoser: () => void }) {
  const { etat } = useJeu()
  const info = BATIMENTS[id]
  const debloque = batimentDebloque(etat, id)
  const possible = peutConstruire(etat, id)
  return (
    // (data-tuto : le tutoriel montre la carte du bâtiment, puis son bouton « Construire »)
    <article data-tuto={`batiment-${id}`} className={`carte construire-carte ${debloque ? '' : 'construire-bloque'} ${possible ? 'construire-possible' : ''}`}>
      {nouveau && <span className="etiquette etiquette-rose construire-nouveau">{t('Nouveau !')}</span>}
      <img className="construire-image" src={IMAGES_BATIMENTS[id]} alt="" draggable={false} />
      <div className="construire-texte">
        <h3>
          {info.emoji} {t(info.nom)}
        </h3>
        <p className="discret">{t(info.description)}</p>
      </div>
      {debloque ? (
        <button className={`btn btn-vert btn-large construire-bouton ${possible ? 'btn-attention' : ''}`} data-tuto={`poser-${id}`} disabled={!possible} onClick={onPoser}>
          <span>🏗️ {t('Construire')}</span>
          <Prix etat={etat} cout={info.cout} />
        </button>
      ) : (
        <span className="verrou construire-bouton">🔒 {verrouBatiment(etat, id)}</span>
      )}
    </article>
  )
}

// Les rails ou les chemins : une ligne, un prix par case, un bouton « Poser ».
// (26/10) « stock » : les cases rangées (retirées, ou restées après une réorganisation du village),
// qu'on repose gratuitement avant de payer les suivantes.
function LigneSol({ icone, titre, effet, cout, verrou, onPoser, stock = 0 }: { icone: ReactNode; titre: string; effet: string; cout: Cout; verrou: string | null; onPoser: () => void; stock?: number }) {
  const { etat } = useJeu()
  return (
    <div className="ligne-amelioration">
      <span className="construire-sol-icone" aria-hidden="true">
        {icone}
      </span>
      <span className="ligne-amelioration-texte">
        <span className="ligne-amelioration-nom">
          {titre} {stock > 0 && <span className="etiquette etiquette-vert">{t('{n} en stock', { n: nombre(stock) })}</span>}
        </span>
        <span className="ligne-amelioration-effet">{effet}</span>
      </span>
      {verrou ? (
        <span className="verrou">🔒 {verrou}</span>
      ) : (
        <span className="ligne-amelioration-boutons">
          <button className="btn btn-vert btn-petit" disabled={stock <= 0 && !peutPayer(etat, cout)} onClick={onPoser}>
            <span>{t('Poser')}</span>
            {stock > 0 ? <span className="prix">{t('Gratuit')}</span> : <Prix etat={etat} cout={cout} />}
          </button>
        </span>
      )}
    </div>
  )
}

export function MenuConstruction({ etat, onFermer, onPoserBatiment, onPinceau }: Props) {
  const nouveautes = nouveautesBatiments(etat)
  const aConstruire = LISTE_BATIMENTS.filter((id) => !estPose(etat, id))
  // Les débloqués d'abord (dans l'ordre du jeu), puis ceux sous cadenas.
  const tries = [...aConstruire.filter((id) => batimentDebloque(etat, id)), ...aConstruire.filter((id) => !batimentDebloque(etat, id))]
  const construits = (['puits', ...LISTE_BATIMENTS] as IdBatiment[]).filter((id) => estPose(etat, id))
  return (
    <Fenetre titre={t('Construire')} icone="🏗️" couleur="orange" taille="grande" onFermer={onFermer} classe="fenetre-construire">
      {/* Ce qu'on a pour payer : l'argent, et les minerais du coffre de la mine. */}
      <div className="rangee construire-ressources">
        <span className="etiquette">💵 {nombreAbrege(etat.argent)} $</span>
        <span className="etiquette">
          {BLOCS.pierre.emoji} {nombre(disponible(etat, 'pierre'))}
        </span>
        <span className="etiquette">
          {BLOCS.fer.emoji} {nombre(disponible(etat, 'fer'))}
        </span>
        {disponible(etat, 'redstone') > 0 && (
          <span className="etiquette">
            {BLOCS.redstone.emoji} {nombre(disponible(etat, 'redstone'))}
          </span>
        )}
      </div>

      {tries.length > 0 ? (
        <div className="grille-construire">
          {tries.map((id) => (
            <CarteBatiment key={id} id={id} nouveau={nouveautes.includes(id)} onPoser={() => onPoserBatiment(id)} />
          ))}
        </div>
      ) : (
        <p className="carte carte-creme">🎉 {t('Tous les bâtiments sont construits !')}</p>
      )}

      <h3 className="titre-section">{t('Rails et chemins')}</h3>
      <LigneSol
        icone={<img className="construire-sol-image" src={cheminPublic('/images/batiments/rails.svg')} alt="" width={56} height={56} draggable={false} />}
        titre={t('Rails')}
        effet={t('Relie deux bâtiments : un wagonnet roulera dessus. Prix par case.')}
        cout={COUT_RAIL}
        verrou={railsDebloques(etat) ? null : `⭐ ${NIVEAU_JOUEUR_POUR.rails}`}
        onPoser={() => onPinceau('rail')}
        stock={stockSol(etat, 'rail')}
      />
      <LigneSol icone="🪨" titre={t('Chemin de pavés')} effet={t('Juste pour faire joli ! Prix par case.')} cout={COUT_CHEMIN} verrou={null} onPoser={() => onPinceau('chemin')} stock={stockSol(etat, 'chemin')} />

      {construits.length > 0 && (
        <>
          <h3 className="titre-section">{t('Déjà construits')}</h3>
          <ul className="construits">
            {construits.map((id) => (
              <li key={id} className="etiquette etiquette-vert">
                ✔ {BATIMENTS[id].emoji} {t(BATIMENTS[id].nom)}
              </li>
            ))}
          </ul>
        </>
      )}
    </Fenetre>
  )
}
