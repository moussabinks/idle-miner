// Le panneau de la mine (22/10, refait le 25/10) : tout se passe ici.
//   - Creuser : le gros bloc à cliquer (chaque clic casse un bloc, les clics rapprochés font un
//     combo), et le coffre, qu'on vend d'un clic (plus de sac ni de marche jusqu'au marché) ;
//   - Améliorer : descendre la mine (le palier suivant : il débloque le niveau suivant de TOUT),
//     agrandir le coffre, l'ascenseur ;
//   - Wagonnets : les trajets qui partent de la mine ;
//   - Production : ce que sortent la mine, chaque mineur et tes clics.
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu.

import { useEffect, useRef, useState } from 'react'
import { BATIMENTS, BLOCS, BONUS_COMBO, NIVEAUX_COFFRE, NIVEAUX_MINE, type IdBloc } from '../jeu/donnees'
import { blocsDuNiveau, gainsNiveauSuivant, infoNiveauMine } from '../jeu/mine'
import {
  activerBonusCombo,
  agrandirCoffre,
  aVendreDuCoffre,
  basculerGarderTout,
  bonusActif,
  capaciteCoffre,
  chanceDoublement,
  coffrePlein,
  descendreNiveauMine,
  durabiliteRestante,
  estCassee,
  changerGarder,
  estGardeTout,
  garderDansLeCoffre,
  nbDansCoffre,
  noterCombo,
  peutPayer,
  piocheEnMain,
  prochainNiveauCoffre,
  prochainNiveauMine,
  secondesBonus,
  vendreCoffre,
  vendreMinerai,
  type EtatJeu,
} from '../jeu/mineur'
import { aleatoireNavigateur } from '../jeu/aleatoire'
import { iconeActiviteEmploye, nbSansSalaire, rareteDe } from '../jeu/employes'
import { nombre, nomEmploye, t } from '../jeu/langue'
import { verrou } from '../jeu/niveaux'
import { analyseAscenseur, analyseWagonnet, production } from '../jeu/production'
import type { Eclat, Trouvaille } from '../usePartie'
import { sons } from '../sons'
import { useCompteur } from '../useCompteur'
import { AlerteChariot } from './AlerteChariot'
import { Amelioration } from './Amelioration'
import { AmeliorationAscenseur } from './Ascenseur'
import { BlocDessin } from './BlocDessin'
import { useJeu } from './contexteJeu'
import { OngletsPanneau } from './OngletsPanneau'
import { PanneauTrajets } from './PanneauTrajets'
import { StockMinerais } from './StockMinerais'
import type { IdLiaison } from '../jeu/donnees'
import { IconeImage } from './IconeImage'

type Props = {
  eclats: Eclat[]
  trouvailles: Trouvaille[]
  onCliquer: () => void
  onReglerTrajet: (liaisons: IdLiaison[]) => void
  onAllerAuPersonnel?: () => void // le bouton « Payer » quand des mineurs attendent leur salaire
}

// Un nombre de blocs par seconde, lisible (« 0,42 », « 3,1 », « 12 »).
function parSeconde(n: number): string {
  return nombre(n, n < 1 ? 2 : n < 10 ? 1 : 0)
}

// Le combo : les clics rapprochés (moins de DELAI_COMBO entre deux) s'additionnent. Chaque palier
// (BONUS_COMBO dans donnees.ts) donne un bonus de quelques secondes.
const DELAI_COMBO = 900 // ms
const PALIERS_COMBO = BONUS_COMBO.map((b) => b.palier)

function prochainPalier(combo: number) {
  return BONUS_COMBO.find((b) => b.palier > combo) ?? null
}

// Le bloc à casser, en très grand : le cœur du jeu.
function BlocACliquer({ eclats, trouvailles, onCliquer, clicsParSeconde }: { eclats: Eclat[]; trouvailles: Trouvaille[]; onCliquer: () => void; clicsParSeconde: number }) {
  const { etat, jouer } = useJeu()
  const bonus = bonusActif(etat)
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
      sons.bonus(PALIERS_COMBO.indexOf(suite))
      jouer((e) => activerBonusCombo(e, suite))
    }
    // Sans clic pendant un moment, le combo retombe (et devient peut-être le record).
    window.clearTimeout(finCombo.current)
    finCombo.current = window.setTimeout(() => {
      const fini = comboRef.current
      if (fini >= 3) jouer((e) => noterCombo(e, fini))
      comboRef.current = 0
      setCombo(0)
    }, DELAI_COMBO)
    onCliquer()
  }
  useEffect(() => () => window.clearTimeout(finCombo.current), [])

  const prochain = prochainPalier(combo)
  const avant = [...PALIERS_COMBO].reverse().find((p) => p <= combo) ?? 0
  const partCombo = prochain ? (combo - avant) / (prochain.palier - avant) : 1
  const pioche = piocheEnMain(etat)
  const reste = durabiliteRestante(etat)
  return (
    <div className={`zone-bloc ${combo >= 10 ? 'zone-en-feu' : ''}`}>
      <div className="zone-bloc-entete">
        <span className="etiquette etiquette-nuit">
          ⛏️ {t('Niveau {n}', { n: etat.niveauMine })} · {t(infoNiveauMine(etat.niveauMine).nom)}
        </span>
      </div>
      <button className="bloc-a-cliquer" data-tuto="bloc" disabled={plein} onClick={cliquer} aria-label={t('Casser le bloc ({nom})', { nom: t(BLOCS[bloc].nom) })}>
        {/* La clé change à chaque bloc : le nouveau bloc « pousse » à sa place. */}
        {/* (les clés ont un préfixe : sans lui, deux éléments voisins pouvaient avoir la même) */}
        <span key={`bloc-${etat.stats.blocsCasses}`} className="bloc-pousse">
          <BlocDessin bloc={bloc} fissures={etat.clics} brille={BLOCS[bloc].minerai && BLOCS[bloc].prix >= 35} />
        </span>
        {eclats.map((e) => (
          <span key={`eclat-${e.id}`} className="eclats" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        ))}
        {trouvailles.map((tr) => (
          // (chacune un peu à gauche ou à droite, pour qu'elles ne s'empilent pas quand on clique vite)
          <span key={`trouvaille-${tr.id}`} className={`trouvaille ${tr.nombre > 1 ? 'trouvaille-double' : ''}`} style={{ translate: `${((tr.id * 37) % 5) * 22 - 44}px 0` }} aria-hidden="true">
            +{tr.nombre} <IconeImage emoji={BLOCS[tr.bloc].emoji} />
          </span>
        ))}
        {combo >= 3 && (
          <span key={`combo-${combo}`} className={`combo ${combo >= 25 ? 'combo-gros' : ''}`}>
            🔥 ×{combo}
          </span>
        )}
        {plein && <span className="bloc-plein">📦 {t('Coffre plein : vends-le !')}</span>}
      </button>
      <div className="combo-barre">
        <span className="jauge jauge-jaune" aria-hidden="true">
          <i style={{ width: `${Math.round(partCombo * 100)}%` }} />
        </span>
        {/* (25/10) Le bonus gagné s'affiche ici, à la place du texte du combo : avant, il passait
            par-dessus le niveau de la mine. */}
        {bonus ? (
          <span key={etat.bonus?.palier} className="combo-texte bonus-combo-actif" aria-live="polite">
            {bonus.emoji} {t(bonus.nom)} · {Math.ceil(secondesBonus(etat))} s
          </span>
        ) : (
          <span className="combo-texte">
            {prochain ? (combo >= 3 ? `🔥 ×${combo} → ×${prochain.palier} : ${prochain.emoji} ${t(prochain.nom)}` : t('Clique vite ! ×{n} = {bonus}', { n: prochain.palier, bonus: `${prochain.emoji} ${t(prochain.nom)}` })) : `🏆 ×${combo}`}
          </span>
        )}
      </div>
      <div className="compteurs">
        <span className="compteur" title={t('Les blocs que tu as cassés à la main')}>
          <strong>{nombre(blocsAffiches)}</strong>
          <small>🔨 {t('cassés')}</small>
        </span>
        <span className="compteur" title={t('Ton plus long combo')}>
          <strong>×{Math.max(record, combo)}</strong>
          <small>🏆 {t('record')}</small>
        </span>
        <span className="compteur" title={t('Tes clics par seconde')}>
          <strong>{parSeconde(clicsParSeconde)}</strong>
          <small>👆 {t('clics/s')}</small>
        </span>
      </div>
      {/* La pioche en main : sa durabilité, du vert au rouge. */}
      <div className={`pioche ${cassee ? 'pioche-cassee' : ''}`} title={t('Pioche en {nom} : {n} % de chances de doubler un minerai', { nom: t(pioche.nom), n: Math.round(chanceDoublement(etat) * 100) })}>
        <span aria-hidden="true">{cassee ? '💥' : '⛏️'}</span>
        <span className={`jauge jauge-texte ${cassee || reste < pioche.durabilite * 0.15 ? 'jauge-rose' : ''}`}>
          <i style={{ width: `${Math.round((reste / Math.max(1, pioche.durabilite)) * 100)}%` }} />
          <span>{cassee ? t('Pioche cassée : répare-la au forgeron !') : `${t('Pioche en {nom}', { nom: t(pioche.nom) })} · ${nombre(reste)}`}</span>
        </span>
      </div>
    </div>
  )
}

// Le coffre de la mine : on le vend d'un clic (tout, ou un minerai), sauf ce qu'on garde (📌).
function CoffreMine() {
  const { etat } = useJeu()
  const blocs = [...new Set([...blocsDuNiveau(etat.niveauMine), ...(Object.keys(etat.coffre.contenu) as IdBloc[])])].sort((a, b) => BLOCS[b].prix - BLOCS[a].prix)
  return (
    <StockMinerais
      titre={`📦 ${t('Coffre')}`}
      contenu={etat.coffre.contenu}
      capacite={capaciteCoffre(etat)}
      blocs={blocs}
      vendreTout={(e) => vendreCoffre(e)}
      vendre={(bloc) => (e) => vendreMinerai(e, bloc)}
      aVendre={aVendreDuCoffre(etat)}
      garde={(bloc) => garderDansLeCoffre(etat, bloc)}
      toutGarde={(bloc) => estGardeTout(etat, bloc)}
      changerGarde={(bloc, pas) => (e) => changerGarder(e, bloc, pas)}
      basculerGarde={(bloc) => (e) => basculerGarderTout(e, bloc)}
      textePlein={t('Plein : la mine s’arrête !')}
      tuto
    />
  )
}

// Ce que rapporte le niveau suivant de la mine : le nouveau minerai, la mine qui sort plus, les
// mineurs en plus, ce qui se débloque, et surtout le palier : tout peut monter d'un niveau.
function GainsNiveau({ etat }: { etat: EtatJeu }) {
  const g = gainsNiveauSuivant(etat.niveauMine)
  if (!g) return null
  return (
    <ul className="gains-niveau">
      <li className="gain-fort">⬆️ {t('Palier {n} : coffre, ascenseur, pioches, mineurs, foreuse… tout peut monter au niveau {n} !', { n: g.niveau.niveau })}</li>
      {g.nouveaux.map((bloc) => (
        <li key={bloc} className="gain-fort">
          ✨ {t('Nouveau minerai : {nom} ({prix} $ pièce)', { nom: `${BLOCS[bloc].emoji} ${t(BLOCS[bloc].nom)}`, prix: BLOCS[bloc].prix })}
        </li>
      ))}
      <li>⚙️ {t('La mine sort {avant} → {apres} blocs/min toute seule', { avant: nombre(g.debitAvant * 60, 1), apres: nombre(g.debitApres * 60, 1) })}</li>
      <li>👷 {t('+{n} mineur à embaucher au Personnel', { n: g.mineursEnPlus })}</li>
      {g.batiments.length > 0 && <li className="gain-fort">🏗️ {t('Débloque : {liste}', { liste: g.batiments.map((id) => t(BATIMENTS[id].nom)).join(', ') })}</li>}
      {g.recruteur && <li className="gain-fort">🎲 {t('Débloque le recruteur (mineurs rares)')}</li>}
      {g.manager && <li className="gain-fort">💼 {t('Débloque le manager (il paie les salaires)')}</li>}
    </ul>
  )
}

// Le tableau de bord : ce que la mine produit, et d'où ça vient.
function TableauProduction({ etat, clicsParSeconde }: { etat: EtatJeu; clicsParSeconde: number }) {
  const prod = production(etat)
  const total = prod.total + clicsParSeconde
  const meilleur = Math.max(0.0001, ...prod.mineurs.map((m) => m.blocsParSeconde))
  return (
    <div className="production">
      <div className="production-total carte carte-creme">
        <strong>
          {parSeconde(total)} <small>{t('blocs/s')}</small>
        </strong>
        <span>≈ {nombre(Math.round(prod.dollarsParMinute))} $/min</span>
      </div>
      {prod.arretee && <p className="texte-alerte">📦 {t('Coffre plein : la mine et les mineurs sont à l’arrêt !')}</p>}
      <div className="rangee">
        <span className="etiquette">⚙️ {t('Mine')} {parSeconde(prod.mine)}/s</span>
        <span className="etiquette">👷 {t('Mineurs')} {parSeconde(prod.totalMineurs)}/s</span>
        <span className="etiquette">👆 {t('Toi')} {parSeconde(clicsParSeconde)}/s</span>
      </div>
      {prod.mineurs.length > 0 && (
        <ul className="production-mineurs">
          {prod.mineurs.map((m) => {
            const rarete = rareteDe(m.employe)
            return (
              <li key={m.index} className="carte" style={{ ['--rarete' as string]: rarete.couleur }}>
                <span className="production-nom">
                  {iconeActiviteEmploye(m.employe)} {nomEmploye(m.employe.nom)} <span className="etiquette etiquette-rarete">{t(rarete.nom)}</span>
                </span>
                <span className="jauge" aria-hidden="true">
                  <i style={{ width: `${Math.round((m.blocsParSeconde / meilleur) * 100)}%` }} />
                </span>
                <strong>{m.auTravail ? `${parSeconde(m.blocsParSeconde)}/s` : `😠 ${t('salaire')}`}</strong>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

type OngletMine = 'creuser' | 'ameliorer' | 'wagonnets' | 'production'

// Combien de fois tu as cliqué par seconde ces 3 dernières secondes.
const FENETRE_CLICS = 3000 // ms

export function PanneauMine({ eclats, trouvailles, onCliquer, onReglerTrajet, onAllerAuPersonnel }: Props) {
  const { etat, jouer } = useJeu()
  const sansSalaire = nbSansSalaire(etat)
  const [onglet, setOnglet] = useState<OngletMine>('creuser')
  const clics = useRef<number[]>([])
  const [clicsParSeconde, setClicsParSeconde] = useState(0)
  useEffect(() => {
    const minuteur = window.setInterval(() => {
      const maintenant = performance.now()
      clics.current = clics.current.filter((d) => maintenant - d < FENETRE_CLICS)
      setClicsParSeconde(clics.current.length / (FENETRE_CLICS / 1000))
    }, 500)
    return () => clearInterval(minuteur)
  }, [])
  function cliquer() {
    clics.current.push(performance.now())
    onCliquer()
  }

  const prochain = prochainNiveauMine(etat)
  const coffre = prochainNiveauCoffre(etat)
  const puits = analyseAscenseur(etat)
  const wagonnetMarche = analyseWagonnet(etat)
  const verrouMine = verrou(etat, 'mine', etat.niveauMine)
  const peutDescendre = prochain !== null && verrouMine === null && peutPayer(etat, prochain.cout)
  const ascenseurTropPetit = etat.employes.some((e) => e.role === 'mineur') && puits.tropLent

  return (
    <div className="panneau-mine">
      <OngletsPanneau
        onglets={[
          { id: 'creuser', titre: `⛏️ ${t('Creuser')}`, pastille: coffrePlein(etat) ? '!' : null },
          { id: 'ameliorer', titre: `⬆️ ${t('Améliorer')}`, pastille: peutDescendre ? '!' : null },
          { id: 'wagonnets', titre: `🚃 ${t('Wagonnets')}` },
          // (25/10) plus de « ! » ici : il restait allumé sans rien de particulier à faire
          { id: 'production', titre: `📊 ${t('Production')}` },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />

      {sansSalaire > 0 && (
        <div className="alerte" role="status">
          <span>😠 {sansSalaire === 1 ? t('Un employé attend son salaire : il ne travaille plus.') : t('{n} employés attendent leur salaire : ils ne travaillent plus.', { n: sansSalaire })}</span>
          {onAllerAuPersonnel && (
            <button className="btn btn-bleu btn-petit" onClick={onAllerAuPersonnel}>
              💵 {t('Payer')}
            </button>
          )}
        </div>
      )}

      {onglet === 'creuser' && (
        <div className="mine-colonnes">
          <BlocACliquer eclats={eclats} trouvailles={trouvailles} onCliquer={cliquer} clicsParSeconde={clicsParSeconde} />
          <div className="mine-droite">
            <CoffreMine />
            {prochain && (
              <button className={`carte prochain-niveau ${peutDescendre ? 'prochain-niveau-pret' : ''}`} onClick={() => setOnglet('ameliorer')}>
                <span>
                  ⬇️ {t('Mine niveau {n}', { n: prochain.niveau })} · <strong>{t(prochain.nom)}</strong>
                </span>
                <span className={`etiquette ${peutDescendre ? 'etiquette-vert' : ''}`}>{verrouMine ? `🔒 ${verrouMine}` : peutDescendre ? t('Prêt !') : t('Voir')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {onglet === 'ameliorer' && (
        <div className="liste-ameliorations">
          <div className={`carte carte-creme carte-palier ${peutDescendre ? 'carte-palier-prete' : ''}`}>
            {prochain ? (
              <>
                <h3>
                  ⬇️ {t('Descendre au niveau {n}', { n: prochain.niveau })} · {t(prochain.nom)}
                </h3>
                <GainsNiveau etat={etat} />
              </>
            ) : (
              <h3>🏆 {t('Ta mine est au plus profond : le cœur de diamant !')}</h3>
            )}
            <Amelioration
              icone="⛏️"
              titre={t('Mine')}
              niveau={etat.niveauMine}
              niveauMax={NIVEAUX_MINE.length}
              effet={t(infoNiveauMine(etat.niveauMine).nom)}
              cout={prochain?.cout ?? null}
              verrou={verrouMine}
              possible={peutDescendre}
              action={(e) => descendreNiveauMine(e, aleatoireNavigateur)}
              texte={t('Descendre')}
            />
          </div>
          <Amelioration
            icone="📦"
            titre={t('Coffre')}
            niveau={etat.coffre.niveau + 1}
            niveauMax={NIVEAUX_COFFRE.length}
            effet={
              coffre ? (
                <>
                  {t('{n} places', { n: nombre(capaciteCoffre(etat)) })} → <strong>{t('{n} places', { n: nombre(coffre.capacite) })}</strong>
                </>
              ) : (
                t('{n} places', { n: nombre(capaciteCoffre(etat)) })
              )
            }
            cout={coffre?.cout ?? null}
            verrou={verrou(etat, 'coffre', etat.coffre.niveau + 1)}
            possible={coffre !== null && verrou(etat, 'coffre', etat.coffre.niveau + 1) === null && peutPayer(etat, coffre.cout)}
            action={agrandirCoffre}
          />
          <AmeliorationAscenseur etat={etat} />
          {ascenseurTropPetit && (
            <p className="texte-alerte">
              ⚠️ {t('Ascenseur trop petit : tes mineurs creusent {a} blocs/s, la caisse en remonte {b}.', { a: parSeconde(puits.creuse), b: parSeconde(puits.debit) })}
            </p>
          )}
          <p className="discret">{t('Coffre : {n} / {max}', { n: nombre(nbDansCoffre(etat)), max: nombre(capaciteCoffre(etat)) })}</p>
        </div>
      )}

      {onglet === 'wagonnets' && (
        <>
          <AlerteChariot analyse={wagonnetMarche} batiment={t('la mine')} onAllerAuPersonnel={onAllerAuPersonnel} />
          <PanneauTrajets etat={etat} jouer={jouer} depart="puits" onReglerTrajet={onReglerTrajet} />
        </>
      )}

      {onglet === 'production' && <TableauProduction etat={etat} clicsParSeconde={clicsParSeconde} />}
    </div>
  )
}
