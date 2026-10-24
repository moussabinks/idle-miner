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
import { BATIMENTS, BLOCS, BONUS_COMBO, NIVEAU_JOUEUR_POUR, NIVEAUX_COFFRE, NIVEAUX_MINE, NIVEAU_MINE_MAX, type IdBloc } from '../jeu/donnees'
import { chancesDesBlocs, gainsNiveauSuivant, infoNiveauMine } from '../jeu/mine'
import {
  prochainNiveauAscenseur,
  activerBonusCombo,
  agrandirCoffre,
  bonusActif,
  secondesBonus,
  capaciteCoffre,
  chanceDoublement,
  coffrePlein,
  durabiliteRestante,
  descendreNiveauMine,
  estCassee,
  piocheEnMain,
  nbDansCoffre,
  noterCombo,
  peutPayer,
  garderDansLeCoffre,
  prendreDuCoffre,
  prochainNiveauCoffre,
  prochainNiveauMine,
  type EtatJeu,
} from '../jeu/mineur'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { iconeActiviteEmploye, nbSansSalaire, rareteDe } from '../jeu/employes'
import { analyseAscenseur, analyseWagonnet, chariotTropPetit, production } from '../jeu/production'
import { AlerteChariot } from './AlerteChariot'
import { trajetAutomatique } from '../jeu/wagonnet'
import type { Eclat, Trouvaille } from '../usePartie'
import { Amelioration, BadgeXp } from './Amelioration'
import { AmeliorationAscenseur } from './Ascenseur'
import type { PropsPanneau } from './Panneaux'
import { OngletsPanneau } from './OngletsPanneau'
import { PanneauTrajets } from './PanneauTrajets'
import { StockMinerais } from './StockMinerais'
import { sons } from '../sons'
import { useCompteur } from '../useCompteur'
import { niveauAtteint, niveauPourBatiment, verrou } from '../jeu/niveaux'

type Props = PropsPanneau & {
  eclats: Eclat[]
  trouvailles: Trouvaille[]
  onCliquer: () => void
  onAllerAuPersonnel?: () => void // (23/10) le bouton « Payer » quand des mineurs attendent leur salaire
}

// Un nombre de blocs par seconde, lisible (« 0,42 », « 3,1 », « 12 »).
function parSeconde(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: n < 1 ? 2 : n < 10 ? 1 : 0 })
}

// Le combo : les clics rapprochés (moins de DELAI_COMBO entre deux) s'additionnent : le compteur
// grossit, le bloc brille, et un son marque chaque palier. (30/10) Chaque palier donne aussi un
// bonus de quelques secondes (BONUS_COMBO dans donnees.ts : fortune, plusieurs blocs par clic).
const DELAI_COMBO = 900 // ms
const PALIERS_COMBO = BONUS_COMBO.map((b) => b.palier)

// Le prochain palier de combo (et son bonus), au-delà de ce combo.
function prochainPalier(combo: number) {
  return BONUS_COMBO.find((b) => b.palier > combo) ?? null
}

// Le bloc à casser, en très grand (23/10 : refait pour être le cœur du jeu). De haut en bas :
//   - le niveau de la mine et le bloc qui attend (« 👆 🔩 Fer ») ;
//   - le bonus de combo en cours ;
//   - le gros bloc, ses éclats, les minerais qui en sortent et le compteur de combo ;
//   - la barre de combo : où on en est vers le prochain bonus (×10, ×25, ×50...) ;
//   - trois compteurs : les blocs cassés à la main, le record de combo et les clics par seconde
//     (24/10 : plus de « 💰 ce tour », ses gros chiffres faisaient grandir et rétrécir le panneau) ;
//   - la pioche (elle tremble et rougit quand elle est cassée, à chaque clic).
function BlocACliquer({
  etat,
  eclats,
  trouvailles,
  onCliquer,
  onPalier,
  onFinCombo,
  clicsParSeconde,
}: {
  etat: EtatJeu
  eclats: Eclat[]
  trouvailles: Trouvaille[]
  onCliquer: () => void
  onPalier: (palier: number) => void
  onFinCombo: (combo: number) => void
  clicsParSeconde: number
}) {
  const bonus = bonusActif(etat)
  const prod = production(etat)
  const bloc = etat.prochainBloc
  const plein = coffrePlein(etat)
  const cassee = estCassee(etat)
  const [combo, setCombo] = useState(0)
  const comboRef = useRef(0)
  const dernierClic = useRef(0)
  const finCombo = useRef(0)
  const blocsAffiches = useCompteur(etat.stats.blocsCasses)
  const record = etat.stats.meilleurCombo ?? 0

  function cliquer() {
    const maintenant = performance.now()
    const suite = maintenant - dernierClic.current < DELAI_COMBO ? combo + 1 : 1
    dernierClic.current = maintenant
    setCombo(suite)
    comboRef.current = suite
    if (PALIERS_COMBO.includes(suite)) {
      // (23/10) Plus d'arpège du combo : seulement le son du bonus qui démarre.
      sons.bonus(PALIERS_COMBO.indexOf(suite))
      onPalier(suite)
    }
    // Sans clic pendant un moment, le combo retombe (et devient peut-être le record).
    window.clearTimeout(finCombo.current)
    finCombo.current = window.setTimeout(() => {
      if (comboRef.current >= 3) onFinCombo(comboRef.current)
      comboRef.current = 0
      setCombo(0)
    }, DELAI_COMBO)
    onCliquer()
  }
  useEffect(() => () => window.clearTimeout(finCombo.current), [])

  // Plus le combo est long, plus le bloc brille (de 0 à 1).
  const ardeur = Math.min(1, combo / 50)
  // La barre de combo : du palier d'avant au prochain.
  const prochain = prochainPalier(combo)
  const avant = [...PALIERS_COMBO].reverse().find((p) => p <= combo) ?? 0
  const partCombo = prochain ? (combo - avant) / (prochain.palier - avant) : 1
  return (
    <div className={`zone-bloc-mine zone-bloc-geante ${combo >= 10 ? 'zone-en-feu' : ''} ${bonus ? 'zone-bonus' : ''}`} style={{ ['--ardeur' as string]: ardeur }}>
      <div className="bloc-mine-entete">
        <span className="discret titre-niveau-mine">
          Niveau {etat.niveauMine} · <strong>{infoNiveauMine(etat.niveauMine).nom}</strong>
        </span>
        <strong className={`bloc-a-casser ${plein ? 'bloc-a-casser-plein' : ''}`}>{plein ? '📦 Coffre plein !' : `👆 ${BLOCS[bloc].emoji} ${BLOCS[bloc].nom}`}</strong>
      </div>
      {/* Le bonus de combo en cours (30/10), avec le temps qui reste. */}
      {bonus && (
        <span key={etat.bonus?.palier} className="bonus-combo" aria-live="polite">
          {bonus.emoji} {bonus.nom}
          <small>
            {bonus.fortune > 0 && ` +${Math.round(bonus.fortune * 100)} % fortune`}
            {bonus.blocs > 1 && ` · ×${bonus.blocs} blocs`} · {Math.ceil(secondesBonus(etat))} s
          </small>
        </span>
      )}
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
      {/* La barre de combo, toujours là : elle donne envie d'aller au prochain bonus. */}
      <div className={`barre-combo ${combo >= 3 ? 'barre-combo-active' : ''}`}>
        <span className="barre-combo-piste" aria-hidden="true">
          <i style={{ width: `${Math.round(partCombo * 100)}%` }} />
        </span>
        <span className="barre-combo-texte">
          {prochain
            ? combo >= 3
              ? `🔥 ×${combo} → ×${prochain.palier} : ${prochain.emoji} ${prochain.nom}`
              : `Clique vite ! ×${prochain.palier} = ${prochain.emoji} ${prochain.nom}`
            : `🏆 ×${combo} : légendaire !`}
        </span>
      </div>
      {/* Les compteurs (23/10) : ça monte à chaque bloc. */}
      <div className="compteurs-mine">
        <span className="compteur-mine" title="Les blocs que tu as cassés à la main, depuis le début">
          <b>🔨</b>
          <strong key={etat.stats.blocsCasses} className="compteur-saute">
            {blocsAffiches.toLocaleString('fr-FR')}
          </strong>
          <small>cassés</small>
        </span>
        <span className={`compteur-mine ${combo > 0 && combo >= record ? 'compteur-record' : ''}`} title="Ton plus long combo">
          <b>🏆</b>
          <strong>×{Math.max(record, combo)}</strong>
          <small>record</small>
        </span>
        <span className="compteur-mine" title="Tes clics par seconde (ces 3 dernières secondes)">
          <b>⚡</b>
          <strong>{parSeconde(clicsParSeconde)}</strong>
          <small>clics/s</small>
        </span>
      </div>
      <JaugePioche etat={etat} />
      <span className="production-mini">
        {cassee ? '💥 Pioche cassée : 2 clics par bloc, fais-la réparer au forgeron !' : `⛏️ ${Math.round(chanceDoublement(etat) * 100)} % de doubler un minerai`} · ⚙️ {parSeconde(prod.total + clicsParSeconde)} blocs/s · ≈{' '}
        {Math.round(prod.dollarsParMinute).toLocaleString('fr-FR')} $/min
      </span>
    </div>
  )
}

// La pioche en main : son nom et sa durabilité (du vert au rouge quand elle s'use, « cassée » à zéro).
// (23/10) Cassée, elle rougit et clignote, et tremble à chaque clic, pour prévenir.
function JaugePioche({ etat }: { etat: EtatJeu }) {
  const pioche = piocheEnMain(etat)
  const reste = durabiliteRestante(etat)
  const part = reste / Math.max(1, pioche.durabilite)
  // (30/10) Sous 15 %, elle clignote ; sa couleur va du vert (neuve) au rouge (presque cassée).
  const niveau = reste <= 0 ? 'pioche-cassee' : part < 0.15 ? 'pioche-usee' : ''
  // (cassée : la clé change à chaque clic, la jauge rejoue sa secousse)
  const secousse = reste <= 0 ? etat.stats.blocsCasses * 2 + etat.clics : 0
  return (
    <div key={secousse} className={`jauge-pioche ${niveau}`} style={{ ['--teinte' as string]: Math.round(part * 120) }} title={`Pioche en ${pioche.nom} : ${reste} / ${pioche.durabilite} clics`}>
      <span className="jauge-pioche-icone" aria-hidden="true">
        {reste <= 0 ? '💥' : pioche.emoji}
      </span>
      <span className="jauge-pioche-barre">
        <i style={{ width: `${Math.round(part * 100)}%` }} />
        <span className="jauge-pioche-texte">{reste <= 0 ? '💥 Cassée : répare-la au forgeron !' : `Pioche en ${pioche.nom} · ${reste} / ${pioche.durabilite}`}</span>
      </span>
    </div>
  )
}

// Les goulots (27/10) : l'ascenseur et le wagonnet du marché suivent-ils la production ? Une
// alerte quand ils ne suivent pas, une ligne verte quand tout va bien.
function Goulots({ etat, onVoir, onAllerAuPersonnel }: { etat: EtatJeu; onVoir: (onglet: OngletMine) => void; onAllerAuPersonnel?: () => void }) {
  const ascenseur = analyseAscenseur(etat)
  const wagonnet = analyseWagonnet(etat)
  const aMineurs = etat.employes.some((e) => e.role === 'mineur')
  if (!aMineurs && !wagonnet) return null
  return (
    <div className="goulots">
      {/* L'ascenseur : seulement quand il est trop lent (27/10 : la ligne « tout va bien » n'était
          pas claire). */}
      {aMineurs && ascenseur.tropLent && (
        <div className="goulot goulot-alerte">
          <span>
            ⚠️ <strong>Ascenseur trop petit</strong> : tes mineurs creusent {parSeconde(ascenseur.creuse)} bloc/s, la caisse en remonte {parSeconde(ascenseur.debit)}
            {ascenseur.gainProchainNiveau !== null && ` · améliore-le : +${parSeconde(ascenseur.gainProchainNiveau)} bloc/s`}
          </span>
          <button className="bouton bouton-petit bouton-ameliorer" onClick={() => onVoir('ameliorer')}>
            ⬆️ Voir
          </button>
        </div>
      )}
      {wagonnet &&
        (wagonnet.moteur === 'personne' ? (
          <div className="goulot goulot-alerte">
            <span>
              ⚠️ <strong>Personne ne pousse le wagonnet du marché</strong> : embauche un pousseur (Personnel) ou électrifie les rails.
            </span>
          </div>
        ) : chariotTropPetit(wagonnet) ? (
          <AlerteChariot analyse={wagonnet} batiment="la mine" onAllerAuPersonnel={onAllerAuPersonnel} />
        ) : (
          <div className="goulot goulot-ok">
            ✔ Wagonnet : jusqu'à {parSeconde(wagonnet.debitMax)} bloc/s, la mine en sort {parSeconde(wagonnet.apport)} tout seule
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
  // Ce que les autres wagonnets prennent d'abord dans le coffre.
  const reserve: Partial<Record<IdBloc, string>> = {
    // (23/10 : seulement si ce wagonnet a son pousseur ; sans lui, tout part au marché)
    ...(trajetAutomatique(etat, 'mine-foreuse') ? { charbon: '🔥 foreuse d’abord' } : {}),
    ...(trajetAutomatique(etat, 'mine-generateur') ? { redstone: '⚡ générateur d’abord' } : {}),
  }
  return (
    <StockMinerais
      etat={etat}
      jouer={jouer}
      titre="📦 Coffre"
      nomStock="coffre"
      contenu={etat.coffre.contenu}
      capacite={capaciteCoffre(etat)}
      textePlein={`Plein (${nbDansCoffre(etat)}) : la mine s’arrête !`}
      liaison="mine-marche"
      reserve={reserve}
      prendre={prendreDuCoffre}
      garde={(bloc) => garderDansLeCoffre(etat, bloc)}
      tutoSac
    />
  )
}

// Un nombre avec une décimale si besoin (« 3,4 »).
const court = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: n < 10 ? 1 : 0 })
const enPlus = (avant: number, apres: number) => (avant <= 0 ? 'nouveau !' : `+${Math.round((apres / avant - 1) * 100)} %`)

// Ce que rapporte le niveau suivant de la mine (27/10), en liste bien lisible.
// (23/10) Seulement ce qui est vrai et utile : le nouveau minerai, la mine qui sort plus de blocs,
// les mineurs en plus. Plus de « un bloc vaut en moyenne... », et un bâtiment (ou le recruteur,
// le manager) n'est annoncé que si le niveau du joueur le permet déjà (sinon, il ne se débloque
// pas en descendant).
function GainsNiveau({ etat }: { etat: EtatJeu }) {
  const g = gainsNiveauSuivant(etat.niveauMine)
  if (!g) return null
  const batimentsDebloques = g.batiments.filter((id) => niveauAtteint(etat, niveauPourBatiment(id)))
  return (
    <ul className="gains-niveau">
      {g.nouveaux.map((bloc) => (
        <li key={bloc} className="gain-fort">
          ✨ Nouveau minerai : {BLOCS[bloc].emoji} <strong>{BLOCS[bloc].nom}</strong> ({BLOCS[bloc].prix} $ pièce)
        </li>
      ))}
      <li>
        ⚙️ La mine sort {court(g.debitAvant * 60)} → <strong>{court(g.debitApres * 60)} blocs/min</strong> toute seule <span className="gain-pourcent">{enPlus(g.debitAvant, g.debitApres)}</span>
      </li>
      <li>
        👷 <strong>+{g.mineursEnPlus} mineur{g.mineursEnPlus > 1 ? 's' : ''}</strong> à embaucher au Personnel
      </li>
      {batimentsDebloques.length > 0 && (
        <li className="gain-fort">
          🏗️ Débloque : <strong>{batimentsDebloques.map((id) => BATIMENTS[id].nom).join(', ')}</strong>
        </li>
      )}
      {g.recruteur && niveauAtteint(etat, NIVEAU_JOUEUR_POUR.recruteur[0]) && (
        <li className="gain-fort">
          🎲 Débloque le <strong>recruteur</strong> (mineurs rares)
        </li>
      )}
      {g.manager && niveauAtteint(etat, NIVEAU_JOUEUR_POUR.manager) && (
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
  const bloque = verrou(etat, 'mine', etat.niveauMine)
  const possible = bloque === null && peutPayer(etat, prochain.cout)
  return (
    <button className={`rappel-niveau ${possible ? 'rappel-possible' : ''}`} onClick={onVoir}>
      <span className="rappel-niveau-titre">
        ⬇ Mine niveau {g.niveau.niveau} : <strong>{g.niveau.nom}</strong>
      </span>
      <span className="rappel-niveau-gains">{g.nouveaux.map((bloc) => `+${BLOCS[bloc].emoji} ${BLOCS[bloc].nom}`).join(' ')}</span>
      <span className="rappel-niveau-action">{bloque ? <BadgeXp texte={bloque} /> : possible ? '💰 Achetable !' : 'Voir ›'}</span>
    </button>
  )
}

// Les onglets du panneau. (30/10 : quatre ; « Améliorer » réunit le niveau de la mine, le coffre
// et l'ascenseur, qui étaient cachés dans « Plus ».)
type OngletMine = 'creuser' | 'production' | 'wagonnets' | 'ameliorer'

// Combien de fois tu as cliqué par seconde ces 3 dernières secondes.
const FENETRE_CLICS = 3000 // ms

export function PanneauMine({ etat, jouer, eclats, trouvailles, onCliquer, onReglerTrajet, onAllerAuPersonnel }: Props) {
  const sansSalaire = nbSansSalaire(etat)
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
  const ascenseurSuivant = prochainNiveauAscenseur(etat)
  const ameliorable =
    niveauAchetable ||
    (coffre !== null && verrou(etat, 'coffre', etat.coffre.niveau + 1) === null && peutPayer(etat, coffre.cout)) ||
    (ascenseurSuivant !== null && verrou(etat, 'ascenseur', etat.ascenseur.niveau) === null && peutPayer(etat, ascenseurSuivant.cout))
  // Un goulot (ascenseur trop lent, wagonnet saturé) : une pastille « ! » sur l'onglet Production.
  const wagonnetMarche = analyseWagonnet(etat)
  // (23/10) L'ascenseur trop petit : une alerte bien visible aussi dans l'onglet principal.
  const ascenseurTropPetit = etat.employes.some((e) => e.role === 'mineur') && puits.tropLent
  const goulot = ascenseurTropPetit || (wagonnetMarche !== null && (wagonnetMarche.moteur === 'personne' || chariotTropPetit(wagonnetMarche)))
  return (
    <div className="liste-cartes panneau-mine-aere">
      {/* Cinq onglets (27/10), pour que tout tienne sans défiler : creuser (le bloc et le
          coffre), la production, les wagonnets, le niveau de la mine, les améliorations. */}
      <OngletsPanneau
        onglets={[
          { id: 'creuser', titre: '⛏️ Creuser', pastille: coffrePlein(etat) || ascenseurTropPetit ? '!' : null },
          { id: 'ameliorer', titre: '⬆️ Améliorer', pastille: ameliorable ? '+' : null },
          { id: 'wagonnets', titre: etat.trajets.length > 0 ? `🚃 Wagons (${etat.trajets.length})` : '🚃 Wagons' },
          { id: 'production', titre: '📊 Prod.', pastille: goulot ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      {/* (23/10) Le chariot du pousseur du marché ne suit pas ce que la mine sort toute seule. */}
      {onglet !== 'production' && <AlerteChariot analyse={wagonnetMarche} batiment="la mine" onAllerAuPersonnel={onAllerAuPersonnel} />}
      {/* (23/10) Des mineurs pas payés : ils ne creusent plus. Bien en vue, avec de quoi y aller. */}
      {sansSalaire > 0 && (
        <div className="goulot goulot-alerte alerte-salaires-mine" role="status">
          <span>
            😠 <strong>{sansSalaire === 1 ? 'Un mineur attend son salaire' : `${sansSalaire} mineurs attendent leur salaire`}</strong> : il{sansSalaire > 1 ? 's' : ''} ne creuse{sansSalaire > 1 ? 'nt' : ''} plus.
          </span>
          {onAllerAuPersonnel && (
            <button className="bouton bouton-petit bouton-acheter" onClick={onAllerAuPersonnel}>
              💵 Payer
            </button>
          )}
        </div>
      )}
      {/* (23/10) Deux colonnes sur grand écran : à gauche le bloc et ses compteurs, à droite le
          coffre et le reste. Tout tient sans défiler. Sur téléphone, l'un sous l'autre. */}
      {onglet === 'creuser' && (
        <div className="mine-deux-colonnes">
          <div className="mine-gauche">
            <BlocACliquer
              etat={etat}
              eclats={eclats}
              trouvailles={trouvailles}
              onCliquer={cliquer}
              onPalier={(palier) => jouer((e) => activerBonusCombo(e, palier))}
              onFinCombo={(combo) => jouer((e) => noterCombo(e, combo))}
              clicsParSeconde={clicsParSeconde}
            />
          </div>
          <div className="mine-droite">
            {ascenseurTropPetit && (
              <div className="goulot goulot-alerte alerte-ascenseur-mine" role="status">
                <span>
                  🛗 <strong>Ascenseur trop petit</strong> : tes mineurs creusent {parSeconde(puits.creuse)} bloc/s, la caisse n’en remonte que {parSeconde(puits.debit)}
                  {puits.gainProchainNiveau !== null && ` · améliore-le : +${parSeconde(puits.gainProchainNiveau)} bloc/s`}.
                </span>
                <button className="bouton bouton-petit bouton-ameliorer" onClick={() => setOnglet('ameliorer')}>
                  ⬆️ Améliorer
                </button>
              </div>
            )}
            <CoffreMine etat={etat} jouer={jouer} />
            {/* (30/10) Un raccourci bien visible vers les améliorations de la mine. */}
            <button className={`raccourci-ameliorer ${ameliorable ? 'raccourci-possible' : ''}`} onClick={() => setOnglet('ameliorer')}>
              ⬆️ Agrandir le coffre, l’ascenseur, descendre la mine {ameliorable ? '· 💰 Achetable !' : '›'}
            </button>
            <ProchainNiveau etat={etat} onVoir={() => setOnglet('ameliorer')} />
          </div>
        </div>
      )}

      {onglet === 'production' && (
        <>
          <TableauProduction etat={etat} clicsParSeconde={clicsParSeconde} />
          <Goulots etat={etat} onVoir={setOnglet} onAllerAuPersonnel={onAllerAuPersonnel} />
        </>
      )}

      {onglet === 'wagonnets' && <PanneauTrajets etat={etat} jouer={jouer} depart="puits" onReglerTrajet={onReglerTrajet} />}

      {onglet === 'ameliorer' && (
        <div className="mine-ameliorer">
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
                <GainsNiveau etat={etat} />
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
              suivant={prochain && { cout: prochain.cout, texte: `⬇ Descendre : mine niveau ${prochain.niveau}` }}
              verrou={verrou(etat, 'mine', etat.niveauMine)}
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
              verrou={verrou(etat, 'coffre', etat.coffre.niveau + 1)}
              possible={coffre !== null && peutPayer(etat, coffre.cout)}
              onAmeliorer={() => jouer(agrandirCoffre)}
            />
          </div>

          <div className="ligne-achat">
            <strong>🛗 Ascenseur</strong>
            <span className="discret">Sa caisse fait des allers-retours sans cesse et remonte ce que creusent tes mineurs : plus grande et plus rapide, elle en remonte plus.</span>
            {/* Est-ce utile de l'améliorer ? Les mineurs creusent-ils plus qu'elle ne remonte (23/10) ? */}
            {etat.employes.some((e) => e.role === 'mineur') && puits.tropLent && (
              <span className="texte-alerte">
                ⚠️ Trop petit : tes mineurs creusent {parSeconde(puits.creuse)} bloc/s, la caisse en remonte {parSeconde(puits.debit)}
                {puits.gainProchainNiveau !== null && ` · niveau suivant : +${parSeconde(puits.gainProchainNiveau)} bloc/s`}.
              </span>
            )}
            <AmeliorationAscenseur etat={etat} jouer={jouer} />
          </div>
        </div>
      )}
    </div>
  )
}
