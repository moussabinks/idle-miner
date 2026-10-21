// Le panneau de la mine (22/10) : la mine ne se visite plus, tout se passe ici.
//   - le gros bloc à cliquer : chaque clic casse un bloc (avec une pioche cassée, il en faut 2),
//     et ce qui tombe va dans le coffre ;
//   - le coffre de la mine : tout ce qui sort de la mine y attend (clics, mine toute seule,
//     mineurs). On le met dans son sac pour aller le vendre au marché ;
//   - le wagonnet, quand des rails relient la mine au marché : on peut le pousser soi-même ;
//   - les améliorations : descendre d'un niveau, agrandir le coffre, l'ascenseur, le wagonnet.
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu.

import { useState } from 'react'
import { BLOCS, NIVEAUX_COFFRE, NIVEAUX_MINE, NIVEAUX_WAGONNET, NIVEAU_MINE_MAX, type IdBloc } from '../jeu/donnees'
import { chancesDesBlocs, infoNiveauMine } from '../jeu/mine'
import {
  agrandirCoffre,
  capaciteCoffre,
  chanceDoublement,
  coffrePlein,
  debitMine,
  descendreNiveauMine,
  estCassee,
  nbDansCoffre,
  peutPayer,
  placeLibre,
  prendreDuCoffre,
  prochainNiveauCoffre,
  prochainNiveauMine,
  reglerVente,
  type EtatJeu,
} from '../jeu/mineur'
import { railsAlimentes } from '../jeu/generateur'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import {
  ameliorerWagonnet,
  capaciteWagonnet,
  distanceDepuisLaMine,
  ligneDuWagonnet,
  longueurTrajet,
  peutPousserWagonnet,
  prochainNiveauWagonnet,
  pousserWagonnet,
  wagonnetEnRoute,
} from '../jeu/wagonnet'
import { lotChoisi, type Choix } from '../choix'
import type { Eclat, Trouvaille } from '../usePartie'
import { Amelioration } from './Amelioration'
import { AmeliorationAscenseur } from './Ascenseur'
import { Barre } from './Barre'
import { Jauges } from './Jauges'
import type { PropsPanneau } from './Panneaux'

type Props = PropsPanneau & {
  eclats: Eclat[]
  trouvailles: Trouvaille[]
  onCliquer: () => void
}

// Le bloc à casser, en grand, avec ses éclats et les minerais qui en sortent.
function BlocACliquer({ etat, eclats, trouvailles, onCliquer }: { etat: EtatJeu; eclats: Eclat[]; trouvailles: Trouvaille[]; onCliquer: () => void }) {
  const bloc = etat.prochainBloc
  const plein = coffrePlein(etat)
  const cassee = estCassee(etat)
  return (
    <div className="zone-bloc-mine">
      <button
        className={`bloc-mine ${etat.clics > 0 ? 'bloc-fissure' : ''}`}
        disabled={plein}
        onClick={onCliquer}
        aria-label={`Casser le bloc (${BLOCS[bloc].nom})`}
        title={plein ? 'Le coffre est plein : vide-le !' : `Clique pour casser : ${BLOCS[bloc].nom}`}
      >
        {/* La clé change à chaque bloc : le nouveau bloc « pousse » à sa place. */}
        <span key={etat.stats.blocsCasses} className={`case bloc bloc-${bloc} roche-pierre bloc-mine-dessin`} aria-hidden="true" />
        {eclats.map((e) => (
          <span key={e.id} className={`eclats-bloc-mine bloc-${e.bloc}`} aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        ))}
        {trouvailles.map((t) => (
          <span key={t.id} className={`trouvaille-bloc-mine ${t.nombre > 1 ? 'trouvaille-double' : ''}`} aria-hidden="true">
            +{t.nombre} {BLOCS[t.bloc].emoji}
            {t.nombre > 1 && ' ×2 !'}
          </span>
        ))}
      </button>
      <div className="bloc-mine-texte">
        <strong>{plein ? '📦 Coffre plein !' : `👆 Clique : ${BLOCS[bloc].emoji} ${BLOCS[bloc].nom}`}</strong>
        <span className="discret">
          {cassee
            ? '💥 Pioche cassée : 2 clics par bloc. Fais-la réparer au forgeron.'
            : `⛏️ ${Math.round(chanceDoublement(etat) * 100)} % de chance de doubler un minerai`}
        </span>
      </div>
    </div>
  )
}

// Les chances de chaque bloc à un niveau de la mine, en petit (« Fer 14 % · Or 8 % »).
function Chances({ niveau }: { niveau: number }) {
  const chances = Object.entries(chancesDesBlocs(niveau)) as [IdBloc, number][]
  return (
    <span className="discret chances-mine">
      {chances.map(([bloc, chance]) => (
        <span key={bloc}>
          {BLOCS[bloc].emoji} {Math.round(chance * 100)} %
        </span>
      ))}
    </span>
  )
}

// Le wagonnet : où il en est, le pousser soi-même, l'agrandir.
function Wagonnet({ etat, jouer }: PropsPanneau) {
  const ligne = ligneDuWagonnet(etat)
  const w = etat.wagonnet
  if (!ligne) {
    return (
      <div className="ligne-achat">
        <strong>🛤️ Wagonnet</strong>
        <span className="discret">
          Pose des rails de la mine jusqu'au marché (menu Bâtiments, 3 🔩 fer la case) : le wagonnet y emportera le coffre et le vendra tout
          seul à l'arrivée. Tu peux le pousser, ou demander à un mineur de le faire (au Personnel).
        </span>
      </div>
    )
  }
  const electrique = railsAlimentes(etat)
  const pousseur = w.pousseur === 'joueur' ? 'toi' : w.pousseur === 'electricite' ? 'l’électricité ⚡' : w.pousseur
  const prochain = prochainNiveauWagonnet(etat)
  return (
    <div className="ligne-achat">
      <div className="ligne-titre">
        <strong>🛤️ Wagonnet</strong>
        {electrique && <span className="badge badge-vert">⚡ Électrique</span>}
      </div>
      <span className="discret">
        {wagonnetEnRoute(etat)
          ? `${w.etape === 'aller' ? 'En route vers le marché' : 'Revient à la mine'}, poussé par ${pousseur}.`
          : electrique
            ? 'Il part tout seul dès qu’il y a quelque chose dans le coffre.'
            : etat.employes.some((e) => e.role === 'pousseur')
              ? 'Un mineur pousseur attend au quai : il le pousse dès qu’il y a quelque chose dans le coffre.'
              : 'Au quai. Pousse-le jusqu’au marché, ou mets un mineur « pousseur » au Personnel.'}{' '}
        Les objets gardés au marché restent dans le coffre.
      </span>
      {wagonnetEnRoute(etat) && <Barre valeur={distanceDepuisLaMine(etat)} max={longueurTrajet(ligne)} texte={w.etape === 'aller' ? '→ Marché' : '← Mine'} couleur="or" />}
      <div className="boutons">
        <button className="bouton bouton-petit bouton-voyage" disabled={!peutPousserWagonnet(etat)} onClick={() => jouer(pousserWagonnet)}>
          🛤️ Pousser le wagonnet ({Math.min(capaciteWagonnet(etat), nbDansCoffre(etat))} objets)
        </button>
      </div>
      <Amelioration
        etat={etat}
        actuel={`${capaciteWagonnet(etat).toLocaleString('fr-FR')} places`}
        niveau={w.niveau + 1}
        niveauMax={NIVEAUX_WAGONNET.length}
        suivant={prochain && { cout: prochain.cout, texte: `⬆ ${prochain.capacite.toLocaleString('fr-FR')} places` }}
        possible={prochain !== null && !wagonnetEnRoute(etat) && peutPayer(etat, prochain.cout)}
        onAmeliorer={() => jouer(ameliorerWagonnet)}
      />
    </div>
  )
}

export function PanneauMine({ etat, jouer, eclats, trouvailles, onCliquer }: Props) {
  const [choix, setChoix] = useState<Choix>({})
  // Le coffre, les objets les plus précieux en premier.
  const piles = (Object.entries(etat.coffre.contenu) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const lot = lotChoisi(choix, [], piles)
  const nbLot = Object.values(lot).reduce((t, n) => t + (n ?? 0), 0)
  const placeSac = placeLibre(etat)
  const niveau = infoNiveauMine(etat.niveauMine)
  const prochain = prochainNiveauMine(etat)
  const coffre = prochainNiveauCoffre(etat)
  return (
    <div className="liste-cartes">
      <BlocACliquer etat={etat} eclats={eclats} trouvailles={trouvailles} onCliquer={onCliquer} />
      <p className="discret">
        Niveau {etat.niveauMine} · <strong>{niveau.nom}</strong> · la mine sort toute seule {Math.round(debitMine(etat) * 60)} blocs par minute.
      </p>

      {/* Le coffre : tout ce qui sort de la mine. */}
      <div className="ligne-achat">
        <strong>
          📦 Coffre · {nbDansCoffre(etat)} / {capaciteCoffre(etat)}
        </strong>
        <Barre valeur={nbDansCoffre(etat)} max={capaciteCoffre(etat)} texte={coffrePlein(etat) ? 'Plein : la mine s’arrête !' : `${nbDansCoffre(etat)} objets`} couleur={coffrePlein(etat) ? 'rouge' : 'or'} />
        {piles.length === 0 ? (
          <span className="discret">Vide. Clique sur le bloc pour le remplir !</span>
        ) : (
          <>
            <Jauges
              piles={piles}
              choix={choix}
              gardes={[]}
              onChanger={(bloc, valeur) => setChoix({ ...choix, [bloc]: valeur })}
              prixUnitaire={(bloc) => BLOCS[bloc].prix}
              onToutSelectionner={() => setChoix(Object.fromEntries(piles.map(([bloc]) => [bloc, 'max'])))}
            />
            <div className="boutons">
              <button
                className="bouton bouton-sac"
                disabled={nbLot === 0 || placeSac === 0}
                onClick={() => {
                  jouer((e) => prendreDuCoffre(e, lot))
                  setChoix({})
                }}
              >
                🎒 Mettre dans le sac ({Math.min(nbLot, placeSac)})
              </button>
            </div>
            {placeSac === 0 && <span className="discret manque">🎒 Ton sac est plein : va d’abord vendre au marché.</span>}
            {ligneDuWagonnet(etat) && (
              <div className="garder-coffre">
                <span className="discret">Le wagonnet laisse dans le coffre :</span>
                {piles.map(([bloc]) => (
                  <label key={bloc} className="case-option">
                    <input type="checkbox" checked={etat.nonAVendre.includes(bloc)} onChange={(e) => jouer((x) => reglerVente(x, bloc, !e.target.checked))} />
                    {BLOCS[bloc].emoji} {BLOCS[bloc].nom}
                  </label>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Wagonnet etat={etat} jouer={jouer} />

      {/* Descendre d'un niveau : de nouveaux minerais, plus rares et plus chers. */}
      <div className="ligne-achat">
        <strong>⬇ Niveau de la mine</strong>
        <Chances niveau={etat.niveauMine} />
        {prochain && (
          <span className="discret">
            Au niveau {prochain.niveau} : <Chances niveau={prochain.niveau} />
          </span>
        )}
        <Amelioration
          etat={etat}
          actuel={`Niveau ${etat.niveauMine} / ${NIVEAU_MINE_MAX}`}
          niveau={etat.niveauMine}
          niveauMax={NIVEAUX_MINE.length}
          suivant={prochain && { cout: prochain.cout, texte: `⬇ ${prochain.nom}` }}
          possible={prochain !== null && peutPayer(etat, prochain.cout)}
          onAmeliorer={() => jouer((e) => descendreNiveauMine(e, aleatoireNavigateur))}
        />
      </div>

      <div className="ligne-achat">
        <strong>📦 Taille du coffre</strong>
        <Amelioration
          etat={etat}
          actuel={`${capaciteCoffre(etat).toLocaleString('fr-FR')} places`}
          niveau={etat.coffre.niveau + 1}
          niveauMax={NIVEAUX_COFFRE.length}
          suivant={coffre && { cout: coffre.cout, texte: `⬆ ${coffre.capacite.toLocaleString('fr-FR')} places` }}
          possible={coffre !== null && peutPayer(etat, coffre.cout)}
          onAmeliorer={() => jouer(agrandirCoffre)}
        />
      </div>

      <div className="ligne-achat">
        <strong>🛗 Ascenseur</strong>
        <span className="discret">Tes mineurs remontent leur sac (et redescendent) plus vite.</span>
        <AmeliorationAscenseur etat={etat} jouer={jouer} />
      </div>
    </div>
  )
}
