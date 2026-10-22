// Le panneau de la mine (22/10) : la mine ne se visite plus, tout se passe ici.
//   - le gros bloc à cliquer : chaque clic casse un bloc (avec une pioche cassée, il en faut 2),
//     et ce qui tombe va dans le coffre ; les clics rapprochés font un combo (27/10) ;
//   - le tableau de production (27/10) : les blocs par seconde de la mine, de chaque mineur et
//     de tes clics, et ce que ça rapporte ;
//   - le coffre de la mine : tout ce qui sort de la mine y attend (clics, mine toute seule,
//     mineurs). Une ligne par minerai du niveau (même à 0, 27/10) : le wagonnet du marché
//     l'emporte ou le laisse, et un bouton le met dans le sac ;
//   - le niveau suivant de la mine, et tout ce qu'il apporte, bien en avant (27/10) ;
//   - les trajets des wagonnets qui partent de la mine (PanneauTrajets) : vers le marché, la
//     foreuse, le générateur ;
//   - les améliorations : descendre d'un niveau, agrandir le coffre, l'ascenseur, les wagonnets.
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu.

import { useEffect, useRef, useState } from 'react'
import { BATIMENTS, BLOCS, NIVEAUX_COFFRE, NIVEAUX_MINE, NIVEAU_MINE_MAX, type IdBloc } from '../jeu/donnees'
import { blocsDuNiveau, chancesDesBlocs, gainsNiveauSuivant, infoNiveauMine } from '../jeu/mine'
import {
  agrandirCoffre,
  capaciteCoffre,
  chanceDoublement,
  coffrePlein,
  durabiliteRestante,
  descendreNiveauMine,
  estCassee,
  piocheEnMain,
  nbDansCoffre,
  peutPayer,
  placeLibre,
  prendreDuCoffre,
  prochainNiveauCoffre,
  prochainNiveauMine,
  type EtatJeu,
} from '../jeu/mineur'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { iconeActiviteEmploye, rareteDe } from '../jeu/employes'
import { analyseAscenseur, analyseWagonnet, production } from '../jeu/production'
import { envoyerObjet, objetEnvoye, trajetDe } from '../jeu/wagonnet'
import type { Eclat, Trouvaille } from '../usePartie'
import { Amelioration } from './Amelioration'
import { AmeliorationAscenseur } from './Ascenseur'
import { Barre } from './Barre'
import type { PropsPanneau } from './Panneaux'
import { OngletsPanneau } from './OngletsPanneau'
import { PanneauTrajets } from './PanneauTrajets'
import { sons } from '../sons'

type Props = PropsPanneau & {
  eclats: Eclat[]
  trouvailles: Trouvaille[]
  onCliquer: () => void
}

// Un nombre de blocs par seconde, lisible (« 0,42 », « 3,1 », « 12 »).
function parSeconde(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: n < 1 ? 2 : n < 10 ? 1 : 0 })
}

// Le combo : les clics rapprochés (moins de DELAI_COMBO entre deux) s'additionnent. Ce n'est que
// pour le plaisir (aucune règle du jeu) : le compteur grossit, le bloc brille, et un son
// marque chaque palier.
const DELAI_COMBO = 900 // ms
const PALIERS_COMBO = [10, 25, 50, 100, 200, 500]

// Le bloc à casser, en très grand, avec ses éclats, les minerais qui en sortent et le combo.
function BlocACliquer({
  etat,
  eclats,
  trouvailles,
  onCliquer,
  clicsParSeconde,
}: {
  etat: EtatJeu
  eclats: Eclat[]
  trouvailles: Trouvaille[]
  onCliquer: () => void
  clicsParSeconde: number
}) {
  const prod = production(etat)
  const bloc = etat.prochainBloc
  const plein = coffrePlein(etat)
  const cassee = estCassee(etat)
  const [combo, setCombo] = useState(0)
  const dernierClic = useRef(0)
  const finCombo = useRef(0)

  function cliquer() {
    const maintenant = performance.now()
    const suite = maintenant - dernierClic.current < DELAI_COMBO ? combo + 1 : 1
    dernierClic.current = maintenant
    setCombo(suite)
    if (PALIERS_COMBO.includes(suite)) sons.combo(PALIERS_COMBO.indexOf(suite))
    // Sans clic pendant un moment, le combo retombe.
    window.clearTimeout(finCombo.current)
    finCombo.current = window.setTimeout(() => setCombo(0), DELAI_COMBO)
    onCliquer()
  }
  useEffect(() => () => window.clearTimeout(finCombo.current), [])

  // Plus le combo est long, plus le bloc brille (de 0 à 1).
  const ardeur = Math.min(1, combo / 50)
  return (
    <div className={`zone-bloc-mine ${combo >= 10 ? 'zone-en-feu' : ''}`} style={{ ['--ardeur' as string]: ardeur }}>
      <button
        className={`bloc-mine ${etat.clics > 0 ? 'bloc-fissure' : ''}`}
        data-tuto="bloc"
        disabled={plein}
        onClick={cliquer}
        aria-label={`Casser le bloc (${BLOCS[bloc].nom})`}
        title={plein ? 'Le coffre est plein : vide-le !' : `Clique pour casser : ${BLOCS[bloc].nom}`}
      >
        <span className="halo-bloc-mine" aria-hidden="true" />
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
        {combo >= 3 && (
          // La clé change à chaque clic : le compteur « saute ».
          <span key={combo} className={`combo-mine ${combo >= 25 ? 'combo-gros' : ''}`} aria-live="off">
            🔥 ×{combo}
          </span>
        )}
      </button>
      {/* À côté du bloc (27/10) : le niveau, le bloc, ta pioche et ce que produit la mine. */}
      <div className="bloc-mine-texte">
        <span className="discret titre-niveau-mine">
          Niveau {etat.niveauMine} · <strong>{infoNiveauMine(etat.niveauMine).nom}</strong>
        </span>
        <strong>{plein ? '📦 Coffre plein !' : `👆 ${BLOCS[bloc].emoji} ${BLOCS[bloc].nom}`}</strong>
        <JaugePioche etat={etat} />
        <span className="discret">
          {cassee ? '💥 Pioche cassée : 2 clics par bloc (forgeron).' : `⛏️ ${Math.round(chanceDoublement(etat) * 100)} % de doubler un minerai`}
        </span>
        <span className="production-mini">
          ⚙️ {parSeconde(prod.total + clicsParSeconde)} blocs/s · ≈ {Math.round(prod.dollarsParMinute).toLocaleString('fr-FR')} $/min
        </span>
      </div>
    </div>
  )
}

// La pioche en main : son nom et sa durabilité (rouge quand elle s'use, « cassée » à zéro).
function JaugePioche({ etat }: { etat: EtatJeu }) {
  const pioche = piocheEnMain(etat)
  const reste = durabiliteRestante(etat)
  const part = reste / Math.max(1, pioche.durabilite)
  const niveau = reste <= 0 ? 'pioche-cassee' : part < 0.2 ? 'pioche-usee' : ''
  return (
    <div className={`jauge-pioche ${niveau}`} title={`Pioche en ${pioche.nom} : ${reste} / ${pioche.durabilite} clics`}>
      <span className="jauge-pioche-icone" aria-hidden="true">
        {reste <= 0 ? '💥' : pioche.emoji}
      </span>
      <span className="jauge-pioche-barre">
        <i style={{ width: `${Math.round(part * 100)}%` }} />
        <span className="jauge-pioche-texte">{reste <= 0 ? 'Cassée : répare-la au forgeron' : `Pioche en ${pioche.nom} · ${reste} / ${pioche.durabilite}`}</span>
      </span>
    </div>
  )
}

// Les goulots (27/10) : l'ascenseur et le wagonnet du marché suivent-ils la production ? Une
// alerte quand ils ne suivent pas, une ligne verte quand tout va bien.
function Goulots({ etat, onVoir }: { etat: EtatJeu; onVoir: (onglet: OngletMine) => void }) {
  const ascenseur = analyseAscenseur(etat)
  const wagonnet = analyseWagonnet(etat)
  const aMineurs = etat.employes.some((e) => e.role === 'mineur')
  if (!aMineurs && !wagonnet) return null
  return (
    <div className="goulots">
      {aMineurs &&
        (ascenseur.tropLent ? (
          <div className="goulot goulot-alerte">
            <span title={`Tes mineurs passent ${Math.round(ascenseur.partDansLePuits * 100)} % de leur temps dans le puits.`}>
              ⚠️ <strong>Ascenseur trop lent</strong> : {Math.round(ascenseur.partDansLePuits * 100)} % du temps dans le puits
              {ascenseur.gainProchainNiveau !== null && ` · +${parSeconde(ascenseur.gainProchainNiveau)} bloc/s au niveau suivant`}
            </span>
            <button className="bouton bouton-petit bouton-ameliorer" onClick={() => onVoir('ameliorer')}>
              ⬆️ Voir
            </button>
          </div>
        ) : (
          <div className="goulot goulot-ok">
            ✔ Ascenseur : {Math.round(ascenseur.partDansLePuits * 100)} % du temps des mineurs dans le puits
          </div>
        ))}
      {wagonnet &&
        (wagonnet.moteur === 'personne' ? (
          <div className="goulot goulot-alerte">
            <span>
              ⚠️ <strong>Personne ne pousse le wagonnet du marché</strong> : embauche un pousseur (Personnel) ou électrifie les rails.
            </span>
          </div>
        ) : wagonnet.surplus > 0.005 ? (
          <div className="goulot goulot-alerte">
            <span
              title={`Il emporte au plus ${parSeconde(wagonnet.debitMax)} bloc/s (aller-retour de ${Math.round(wagonnet.secondesAllerRetour)} s), la mine en sort ${parSeconde(wagonnet.apport)}. Le coffre se remplit de ${parSeconde(wagonnet.surplus)} bloc/s : agrandis les wagonnets${wagonnet.moteur === 'pousseur' ? ' ou électrifie les rails' : ''}.`}
            >
              ⚠️ <strong>Wagonnet saturé</strong> : {parSeconde(wagonnet.debitMax)} bloc/s au plus, la mine en sort {parSeconde(wagonnet.apport)} · agrandis-le
            </span>
            <button className="bouton bouton-petit bouton-ameliorer" onClick={() => onVoir('wagonnets')}>
              ⬆️ Voir
            </button>
          </div>
        ) : (
          <div className="goulot goulot-ok">
            ✔ Wagonnet : jusqu'à {parSeconde(wagonnet.debitMax)} bloc/s, la mine en sort {parSeconde(wagonnet.apport)}
          </div>
        ))}
    </div>
  )
}

// Le tableau de bord : ce que la mine produit, et d'où ça vient (la mine toute seule, chaque
// mineur, et toi quand tu cliques).
function TableauProduction({ etat, clicsParSeconde }: { etat: EtatJeu; clicsParSeconde: number }) {
  const prod = production(etat)
  const total = prod.total + clicsParSeconde
  const meilleur = Math.max(0.0001, ...prod.mineurs.map((m) => m.blocsParSeconde))
  return (
    <div className={`tableau-production ${prod.arretee ? 'production-arretee' : ''}`}>
      <div className="production-total">
        <span className="production-chiffre">
          {parSeconde(total)} <small>blocs/s</small>
        </span>
        <span className="production-argent">≈ {Math.round(prod.dollarsParMinute).toLocaleString('fr-FR')} $/min</span>
      </div>
      {prod.arretee && <span className="manque">📦 Coffre plein : la mine et les mineurs sont à l'arrêt !</span>}
      <div className="production-sources">
        <span className="source-production" title="La mine sort des blocs toute seule">
          ⚙️ Mine <strong>{parSeconde(prod.mine)}/s</strong>
        </span>
        <span className="source-production" title="Tes mineurs, trajets compris">
          👷 Mineurs <strong>{parSeconde(prod.totalMineurs)}/s</strong>
        </span>
        <span className={`source-production ${clicsParSeconde > 0 ? 'source-active' : ''}`} title="Tes clics sur le bloc">
          👆 Toi <strong>{parSeconde(clicsParSeconde)}/s</strong>
        </span>
      </div>
      {prod.mineurs.length > 0 && (
        <ul className="liste-rendements">
          {prod.mineurs.map((m) => {
            const rarete = rareteDe(m.employe)
            return (
              <li key={m.index} className="rendement-mineur" style={{ ['--rarete' as string]: rarete.couleur }}>
                <span className="rendement-nom">
                  {iconeActiviteEmploye(m.employe)} {m.employe.nom}
                  <span className="rendement-rarete">{rarete.nom}</span>
                </span>
                <span className="rendement-barre" aria-hidden="true">
                  <i style={{ width: `${Math.round((m.blocsParSeconde / meilleur) * 100)}%` }} />
                </span>
                <strong className="rendement-chiffre">{m.auTravail ? `${parSeconde(m.blocsParSeconde)}/s` : '😠 salaire'}</strong>
              </li>
            )
          })}
        </ul>
      )}
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

// Le coffre de la mine (27/10) : une ligne par minerai que sort la mine à son niveau, même s'il
// n'y en a pas encore (on règle le wagonnet à l'avance). Pour chacun : combien il y en a, ce que
// fait le wagonnet du marché (🚃 Vendre / 📦 Garder), et 🎒 pour le mettre dans son sac.
function CoffreMine({ etat, jouer }: PropsPanneau) {
  const plein = coffrePlein(etat)
  const placeSac = placeLibre(etat)
  const wagonnet = trajetDe(etat, 'mine-marche') !== null
  // Les minerais du niveau, et ceux d'avant qui resteraient dans le coffre (les plus chers en haut).
  const blocs = [...new Set([...blocsDuNiveau(etat.niveauMine), ...(Object.keys(etat.coffre.contenu) as IdBloc[])])].sort((a, b) => BLOCS[b].prix - BLOCS[a].prix)
  const total = nbDansCoffre(etat)
  // Ce que les autres wagonnets prennent d'abord dans le coffre.
  const reserve: Partial<Record<IdBloc, string>> = {
    ...(trajetDe(etat, 'mine-foreuse') ? { charbon: '🔥 foreuse d’abord' } : {}),
    ...(trajetDe(etat, 'mine-generateur') ? { redstone: '⚡ générateur d’abord' } : {}),
  }
  return (
    <div className="ligne-achat coffre-mine">
      {/* Le titre et la barre sur une seule ligne (la place est comptée). */}
      <div className="coffre-entete">
        <strong>📦 Coffre</strong>
        <div className="coffre-barre">
          <Barre valeur={total} max={capaciteCoffre(etat)} texte={plein ? `Plein (${total}) : la mine s’arrête !` : `${total} / ${capaciteCoffre(etat)}`} couleur={plein ? 'rouge' : 'or'} />
        </div>
      </div>
      <div className={`table-coffre ${wagonnet ? '' : 'sans-wagonnet'}`}>
        <span className="entete-coffre">Minerai</span>
        <span className="entete-coffre nombre">Coffre</span>
        {wagonnet && <span className="entete-coffre">🚃 Wagonnet</span>}
        <span className="entete-coffre" />
        {blocs.map((bloc) => {
          const nombre = etat.coffre.contenu[bloc] ?? 0
          const envoye = wagonnet && objetEnvoye(etat, 'mine-marche', bloc)
          return (
            <div key={bloc} className={`ligne-coffre ${nombre === 0 ? 'ligne-vide' : ''}`}>
              <span className="nom-coffre" title={`${BLOCS[bloc].prix} $ pièce`}>
                <span aria-hidden="true">{BLOCS[bloc].emoji}</span> {BLOCS[bloc].nom}
                <small className="discret"> {BLOCS[bloc].prix} $</small>
                {reserve[bloc] && <small className="reserve-coffre">{reserve[bloc]}</small>}
              </span>
              <strong className="nombre">{nombre.toLocaleString('fr-FR')}</strong>
              {wagonnet && (
                <span className="choix-wagonnet" role="group" aria-label={`Wagonnet : ${BLOCS[bloc].nom}`}>
                  <button className={envoye ? 'actif vendre' : ''} aria-pressed={envoye} title="Le wagonnet l’emporte et le vend au marché" onClick={() => jouer((e) => envoyerObjet(e, 'mine-marche', bloc, true))}>
                    Vendre
                  </button>
                  <button className={envoye ? '' : 'actif garder'} aria-pressed={!envoye} title="Le wagonnet le laisse dans le coffre" onClick={() => jouer((e) => envoyerObjet(e, 'mine-marche', bloc, false))}>
                    Garder
                  </button>
                </span>
              )}
              <button
                className="bouton bouton-petit bouton-sac bouton-sac-ligne"
                disabled={nombre === 0 || placeSac === 0}
                title={`Mettre ${Math.min(nombre, placeSac)} ${BLOCS[bloc].nom.toLowerCase()} dans ton sac`}
                onClick={() => jouer((e) => prendreDuCoffre(e, { [bloc]: nombre }))}
              >
                🎒
              </button>
            </div>
          )
        })}
      </div>
      <div className="boutons">
        <button className="bouton bouton-sac" data-tuto="sac" disabled={total === 0 || placeSac === 0} onClick={() => jouer((e) => prendreDuCoffre(e))}>
          🎒 Tout mettre dans le sac ({Math.min(total, placeSac)})
        </button>
      </div>
      {placeSac === 0 && <span className="discret manque">🎒 Sac plein : va d’abord vendre au marché.</span>}
      {!wagonnet && <span className="discret">🛤️ Des rails jusqu’au marché : un wagonnet vendra le coffre tout seul.</span>}
    </div>
  )
}

// Un nombre avec une décimale si besoin (« 3,4 »).
const court = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: n < 10 ? 1 : 0 })
const enPlus = (avant: number, apres: number) => `+${Math.round((apres / Math.max(0.0001, avant) - 1) * 100)} %`

// Ce que rapporte le niveau suivant de la mine (27/10), en liste bien lisible.
function GainsNiveau({ niveauActuel }: { niveauActuel: number }) {
  const g = gainsNiveauSuivant(niveauActuel)
  if (!g) return null
  return (
    <ul className="gains-niveau">
      {g.nouveaux.map((bloc) => (
        <li key={bloc} className="gain-fort">
          ✨ Nouveau minerai : {BLOCS[bloc].emoji} <strong>{BLOCS[bloc].nom}</strong> ({BLOCS[bloc].prix} $ pièce)
        </li>
      ))}
      <li>
        💰 Un bloc vaut en moyenne {court(g.valeurAvant)} → <strong>{court(g.valeurApres)} $</strong> <span className="gain-pourcent">{enPlus(g.valeurAvant, g.valeurApres)}</span>
      </li>
      <li>
        ⚙️ La mine sort {court(g.debitAvant * 60)} → <strong>{court(g.debitApres * 60)} blocs/min</strong> toute seule <span className="gain-pourcent">{enPlus(g.debitAvant, g.debitApres)}</span>
      </li>
      <li>
        👷 <strong>+{g.mineursEnPlus} mineurs</strong> à embaucher au Personnel
      </li>
      {g.batiments.length > 0 && (
        <li className="gain-fort">
          🏗️ Débloque : <strong>{g.batiments.map((id) => BATIMENTS[id].nom).join(', ')}</strong>
        </li>
      )}
      {g.recruteur && (
        <li className="gain-fort">
          🎲 Débloque le <strong>recruteur</strong> (mineurs rares)
        </li>
      )}
      {g.manager && (
        <li className="gain-fort">
          💼 Débloque le <strong>manager</strong> (il paie les salaires)
        </li>
      )}
    </ul>
  )
}

// Au premier onglet, un rappel du niveau suivant (27/10) : il brille quand on peut le payer.
function ProchainNiveau({ etat, onVoir }: { etat: EtatJeu; onVoir: () => void }) {
  const g = gainsNiveauSuivant(etat.niveauMine)
  const prochain = prochainNiveauMine(etat)
  if (!g || !prochain) return null
  const possible = peutPayer(etat, prochain.cout)
  return (
    <button className={`rappel-niveau ${possible ? 'rappel-possible' : ''}`} onClick={onVoir}>
      <span className="rappel-niveau-titre">
        ⬇ Niveau {g.niveau.niveau} : <strong>{g.niveau.nom}</strong>
      </span>
      <span className="rappel-niveau-gains">
        {g.nouveaux.map((bloc) => `+${BLOCS[bloc].emoji} ${BLOCS[bloc].nom}`).join(' ')} · valeur {enPlus(g.valeurAvant, g.valeurApres)}
        {g.batiments.length > 0 && ` · 🏗️ ${g.batiments.map((id) => BATIMENTS[id].nom).join(', ')}`}
      </span>
      <span className="rappel-niveau-action">{possible ? '💰 Achetable !' : 'Voir ›'}</span>
    </button>
  )
}

// Les onglets du panneau (27/10 : cinq, pour que rien ne défile).
type OngletMine = 'creuser' | 'production' | 'wagonnets' | 'niveau' | 'ameliorer'

// Combien de fois tu as cliqué par seconde ces 3 dernières secondes.
const FENETRE_CLICS = 3000 // ms

export function PanneauMine({ etat, jouer, eclats, trouvailles, onCliquer }: Props) {
  const [onglet, setOnglet] = useState<OngletMine>('creuser')
  // Les heures de tes derniers clics, et ta vitesse recalculée deux fois par seconde.
  const clics = useRef<number[]>([])
  const [clicsParSeconde, setClicsParSeconde] = useState(0)
  useEffect(() => {
    const minuteur = window.setInterval(() => {
      const maintenant = performance.now()
      clics.current = clics.current.filter((t) => maintenant - t < FENETRE_CLICS)
      setClicsParSeconde(clics.current.length / (FENETRE_CLICS / 1000))
    }, 500)
    return () => clearInterval(minuteur)
  }, [])
  function cliquer() {
    clics.current.push(performance.now())
    onCliquer()
  }
  const niveau = infoNiveauMine(etat.niveauMine)
  const prochain = prochainNiveauMine(etat)
  const coffre = prochainNiveauCoffre(etat)
  const puits = analyseAscenseur(etat)
  // Ce qu'on peut acheter tout de suite (pour les pastilles des onglets).
  const niveauAchetable = prochain !== null && peutPayer(etat, prochain.cout)
  const ameliorable = coffre !== null && peutPayer(etat, coffre.cout)
  // Un goulot (ascenseur trop lent, wagonnet saturé) : une pastille « ! » sur l'onglet Production.
  const wagonnetMarche = analyseWagonnet(etat)
  const goulot = (etat.employes.some((e) => e.role === 'mineur') && puits.tropLent) || (wagonnetMarche !== null && (wagonnetMarche.moteur === 'personne' || wagonnetMarche.surplus > 0.005))
  return (
    <div className="liste-cartes">
      {/* Cinq onglets (27/10), pour que tout tienne sans défiler : creuser (le bloc et le
          coffre), la production, les wagonnets, le niveau de la mine, les améliorations. */}
      <OngletsPanneau
        onglets={[
          { id: 'creuser', titre: '⛏️ Creuser', pastille: coffrePlein(etat) ? '!' : null },
          { id: 'production', titre: '📊 Prod.', pastille: goulot ? '!' : null },
          { id: 'wagonnets', titre: etat.trajets.length > 0 ? `🚃 Wagons (${etat.trajets.length})` : '🚃 Wagons' },
          { id: 'niveau', titre: `⬇️ Niv. ${etat.niveauMine}`, pastille: niveauAchetable ? '+' : null },
          { id: 'ameliorer', titre: '⬆️ Plus', pastille: ameliorable ? '+' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      {onglet === 'creuser' && (
        <>
          <BlocACliquer etat={etat} eclats={eclats} trouvailles={trouvailles} onCliquer={cliquer} clicsParSeconde={clicsParSeconde} />
          <CoffreMine etat={etat} jouer={jouer} />
          <ProchainNiveau etat={etat} onVoir={() => setOnglet('niveau')} />
        </>
      )}

      {onglet === 'production' && (
        <>
          <TableauProduction etat={etat} clicsParSeconde={clicsParSeconde} />
          <Goulots etat={etat} onVoir={setOnglet} />
        </>
      )}

      {onglet === 'wagonnets' && <PanneauTrajets etat={etat} jouer={jouer} depart="puits" />}

      {onglet === 'niveau' && (
        <>
          {/* Descendre d'un niveau (27/10) : la grande carte, avec tout ce qu'on y gagne. */}
          <div className={`ligne-achat carte-niveau-mine ${prochain && peutPayer(etat, prochain.cout) ? 'niveau-achetable' : ''}`}>
            <div className="ligne-titre">
              <strong>{prochain ? `⬇ Descendre au niveau ${prochain.niveau}` : '🏆 Mine au plus profond'}</strong>
              <span className="discret">
                Niveau {etat.niveauMine} / {NIVEAU_MINE_MAX}
              </span>
            </div>
            {prochain ? (
              <>
                <span className="nom-niveau-suivant">{prochain.nom}</span>
                <GainsNiveau niveauActuel={etat.niveauMine} />
                <details className="plus-d-infos">
                  <summary>Les chances de chaque minerai</summary>
                  <span className="discret">
                    Maintenant : <Chances niveau={etat.niveauMine} />
                  </span>
                  <span className="discret">
                    Au niveau {prochain.niveau} : <Chances niveau={prochain.niveau} />
                  </span>
                </details>
              </>
            ) : (
              <>
                <span className="discret">{niveau.nom} : tous les minerais, jusqu’au diamant.</span>
                <Chances niveau={etat.niveauMine} />
              </>
            )}
            <Amelioration
              etat={etat}
              actuel={`Niveau ${etat.niveauMine} · ${niveau.nom}`}
              niveau={etat.niveauMine}
              niveauMax={NIVEAUX_MINE.length}
              suivant={prochain && { cout: prochain.cout, texte: `⬇ Descendre au niveau ${prochain.niveau}` }}
              possible={prochain !== null && peutPayer(etat, prochain.cout)}
              onAmeliorer={() => jouer((e) => descendreNiveauMine(e, aleatoireNavigateur))}
            />
          </div>

        </>
      )}

      {onglet === 'ameliorer' && (
        <>
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
            {/* Est-ce utile de l'améliorer ? La part du temps perdue dans le puits (27/10). */}
            {etat.employes.some((e) => e.role === 'mineur') && (
              <span className={puits.tropLent ? 'texte-alerte' : 'discret'}>
                {puits.tropLent ? '⚠️ ' : '✔ '}
                Tes mineurs passent {Math.round(puits.partDansLePuits * 100)} % de leur temps dans le puits
                {puits.gainProchainNiveau !== null && ` · niveau suivant : +${parSeconde(puits.gainProchainNiveau)} bloc/s`}.
              </span>
            )}
            <AmeliorationAscenseur etat={etat} jouer={jouer} />
          </div>
        </>
      )}
    </div>
  )
}
