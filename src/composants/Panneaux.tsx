// Les panneaux des stands du village (Marché, Forgeron, Bazar, Foreuse, Générateur) et le
// panneau des succès. Le panneau de la mine est dans PanneauMine.tsx.
// Ils n'ont aucune règle du jeu : ils lisent l'état et appellent les actions de src/jeu.

import { useState, type ReactNode } from 'react'
import { OngletsPanneau } from './OngletsPanneau'
import { StockMinerais } from './StockMinerais'
import { BATIMENTS, BLOCS, LIAISONS, LISTE_BLOCS, NIVEAUX_CHARIOT, NIVEAUX_FORAGE, NIVEAUX_GENERATEUR, NIVEAU_GENERATEUR_AUTO, NIVEAU_RECHARGE_AUTO, PIOCHES, SACS, SECONDES_PAR_CHARBON, SECONDES_PAR_REDSTONE, type IdBloc, type IdLiaison } from '../jeu/donnees'
import {
  ameliorerChariot,
  ameliorerForage,
  basculerRechargeAuto,
  capaciteChariot,
  chariotPlein,
  foreuseEnMarche,
  nbDansChariot,
  peutAmeliorerChariot,
  peutAmeliorerForage,
  prendreDuChariot,
  prochainNiveauChariot,
  prochainNiveauForage,
  rechargeAutoDisponible,
  remplirForeuse,
  secondesDeCharbon,
  charbonMaxForeuse,
  placeCharbonForeuse,
  secondesPourRemplir,
  vitesseForage,
} from '../jeu/foreuse'
import {
  ameliorerGenerateur,
  basculerGenerateur,
  basculerPuisage,
  batimentDansLeRayon,
  foreuseAlimentee,
  generateurEnMarche,
  prochainNiveauGenerateur,
  puissanceGenerateur,
  puisageDisponible,
  casesDansLeRayon,
  rayonGenerateur,
  remplirGenerateur,
} from '../jeu/generateur'
import {
  acheterPioche,
  acheterSac,
  coutPioche,
  coutReparation,
  disponible,
  equiper,
  peutAcheterPioche,
  peutPayer,
  peutReparer,
  prixProchainSac,
  reglerVente,
  reparer,
  valeurDe,
  vendreLot,
  type EtatJeu,
} from '../jeu/mineur'
import { SUCCES } from '../jeu/succes'
import { batimentPose } from '../jeu/village'
import { liaisonsDepuis, ligneDe, trajetElectrique } from '../jeu/wagonnet'
import { PanneauTrajets } from './PanneauTrajets'
import type { Action } from '../usePartie'
import { Achat, Amelioration } from './Amelioration'
import { Barre } from './Barre'
import { lotChoisi, type Choix } from '../choix'
import { Jauges } from './Jauges'
import { verrou } from '../jeu/niveaux'

export type PropsPanneau = {
  etat: EtatJeu
  jouer: (action: Action) => void
  onReglerTrajet?: (liaisons: IdLiaison[]) => void // ouvre la fenêtre des trajets (27/10)
}

// Chaque sorte d'action a sa couleur (voir « Les couleurs des boutons » dans index.css).
export type GenreBouton = 'neutre' | 'acheter' | 'ameliorer' | 'reparer' | 'vendre' | 'sac' | 'charbon' | 'voyage' | 'creuser'

export function Bouton({ actif, onClick, genre, children }: { actif: boolean; onClick: () => void; genre: GenreBouton; children: ReactNode }) {
  return (
    <button className={`bouton bouton-petit bouton-${genre}`} disabled={!actif} onClick={onClick}>
      {children}
    </button>
  )
}

// « 8 min », « 1 h 05 » : un temps assez long.
function minutes(secondes: number): string {
  const total = Math.round(secondes / 60)
  if (total < 60) return `${Math.max(1, total)} min`
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------

// Le marché : « Vendre la sélection » vend ce qu'on a choisi dans le sac.
export function PanneauMarche({ etat, jouer }: PropsPanneau) {
  // Les quantités choisies avec les jauges (par défaut : tout, sauf les objets gardés).
  const [choix, setChoix] = useState<Choix>({})
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const lot = lotChoisi(choix, etat.nonAVendre, piles)
  const gain = valeurDe(lot)

  // Une jauge mise à 0 : l'objet est « gardé » (le jeu s'en souvient pour la prochaine fois,
  // et le wagonnet le laisse aussi dans le coffre de la mine).
  function changer(bloc: IdBloc, valeur: number | 'max') {
    setChoix({ ...choix, [bloc]: valeur })
    const garde = etat.nonAVendre.includes(bloc)
    if ((valeur === 0) !== garde) jouer((e) => reglerVente(e, bloc, valeur !== 0))
  }

  // Toutes les jauges au maximum : plus aucun objet n'est gardé.
  function toutSelectionner() {
    setChoix({})
    jouer((e) => {
      for (const [bloc] of piles) reglerVente(e, bloc, true)
      return []
    })
  }

  // Sac vide (30/10) : le marché s'ouvre quand même, avec un message bien visible et les prix
  // de chaque minerai (on voit ce que vaudra son prochain sac).
  if (piles.length === 0) {
    return (
      <div className="liste-cartes">
        <div className="sac-vide-marche" role="status">
          <span className="sac-vide-icone" aria-hidden="true">
            🎒
          </span>
          <span>
            <strong>Ton sac est vide !</strong>
            <span className="discret">Remplis-le au coffre de la mine (bouton 🎒), puis reviens vendre ici.</span>
          </span>
        </div>
        <div className="ligne-achat">
          <strong>💰 Les prix du marché</strong>
          <ul className="prix-marche">
            {LISTE_BLOCS.map((bloc) => (
              <li key={bloc}>
                <span className={`mini-bloc bloc-${bloc} roche-pierre`} aria-hidden="true" />
                <span>{BLOCS[bloc].nom}</span>
                <strong>{BLOCS[bloc].prix} $</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
  return (
    <div className="liste-cartes">
      <Jauges
        piles={piles}
        choix={choix}
        gardes={etat.nonAVendre}
        onChanger={changer}
        prixUnitaire={(bloc) => BLOCS[bloc].prix}
        onToutSelectionner={toutSelectionner}
      />
      <button
        className="bouton bouton-vendre"
        data-tuto="vendre"
        disabled={gain === 0}
        onClick={() => {
          jouer((e) => vendreLot(e, lot))
          setChoix({}) // après la vente, les jauges reviennent à « tout » (sauf les objets gardés)
        }}
      >
        💰 Vendre la sélection {gain > 0 && `· +${gain.toLocaleString('fr-FR')} $`}
      </button>
      <p className="discret">Garde des minerais (curseur) pour une pioche, des rails, le générateur…</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

// Le forgeron : acheter, réparer et changer de pioche. Une meilleure pioche double plus souvent
// les minerais qu'on casse en cliquant.
// Une pioche au forgeron : sa durabilité, et ce qu'on peut faire (équiper, réparer, racheter).
function CartePioche({ etat, jouer, pioche }: PropsPanneau & { pioche: (typeof PIOCHES)[number] }) {
  const possedee = pioche.niveau in etat.pioches
  const equipee = pioche.niveau === etat.niveauPioche
  const prochaine = pioche.niveau === etat.meilleure + 1
  const usure = etat.pioches[pioche.niveau] ?? 0
  const cout = coutReparation(etat, pioche.niveau)
  return (
    <div className={`ligne-achat ${equipee ? 'equipee' : ''}`}>
      <div className="ligne-titre">
        <strong>
          {pioche.emoji} Pioche en {pioche.nom}
        </strong>
        {equipee && <span className="badge">Équipée</span>}
      </div>
      <span className="discret">
        {Math.round(pioche.doublement * 100)} % de chance de doubler un minerai · durabilité {pioche.durabilite} clics
      </span>

      {possedee && (
        <Barre
          valeur={pioche.durabilite - usure}
          max={pioche.durabilite}
          texte={usure >= pioche.durabilite ? 'Cassée : 2 clics par bloc' : `${pioche.durabilite - usure} / ${pioche.durabilite}`}
          couleur={usure >= pioche.durabilite ? 'rouge' : 'vert'}
        />
      )}

      {possedee && !equipee && (
        <div className="boutons">
          <Bouton actif genre="neutre" onClick={() => jouer((e) => equiper(e, pioche.niveau))}>
            Équiper
          </Bouton>
        </div>
      )}
      {/* Réparer : un peu d'argent et quelques minerais (selon l'usure). */}
      {possedee && usure > 0 && cout && (
        <Achat
          etat={etat}
          cout={cout}
          texte="🔧 Réparer"
          possible={peutReparer(etat, pioche.niveau)}
          onAcheter={() => jouer((e) => reparer(e, pioche.niveau))}
          genre="reparer"
        />
      )}
      {/* Débloquer ou racheter neuve : le prix à gauche, comme partout. */}
      {/* (29/10) La pioche suivante se débloque avec le niveau du joueur. */}
      {prochaine && verrou(etat, 'pioches', pioche.niveau) !== null ? (
        <span className="amelioration-verrou">
          🔒 Pioche en {pioche.nom} · {verrou(etat, 'pioches', pioche.niveau)}
        </span>
      ) : (prochaine || pioche.niveau > 0) && (
        <Achat
          etat={etat}
          cout={coutPioche(pioche.niveau)}
          texte={prochaine ? '🔓 Débloquer' : '🛒 Racheter neuve'}
          possible={peutAcheterPioche(etat, pioche.niveau)}
          onAcheter={() => jouer((e) => acheterPioche(e, pioche.niveau))}
        />
      )}
    </div>
  )
}

// Le forgeron (27/10 : plus simple) : la pioche en main et la prochaine à débloquer ; les autres
// pioches qu'on a déjà sont rangées dans « Autres pioches ».
export function PanneauPioches({ etat, jouer }: PropsPanneau) {
  const principales = PIOCHES.filter((p) => p.niveau === etat.niveauPioche || p.niveau === etat.meilleure + 1)
  const autres = PIOCHES.filter((p) => p.niveau in etat.pioches && p.niveau !== etat.niveauPioche && p.niveau !== etat.meilleure + 1)
  const aVenir = PIOCHES.filter((p) => p.niveau > etat.meilleure + 1).length
  return (
    <div className="liste-cartes">
      {principales.map((pioche) => (
        <CartePioche key={pioche.niveau} etat={etat} jouer={jouer} pioche={pioche} />
      ))}
      {aVenir > 0 && <span className="discret">🔒 Encore {aVenir} pioche{aVenir > 1 ? 's' : ''} à débloquer ensuite.</span>}
      {autres.length > 0 && (
        <details className="plus-d-infos">
          <summary>Autres pioches ({autres.length})</summary>
          <div className="liste-cartes">
            {autres.map((pioche) => (
              <CartePioche key={pioche.niveau} etat={etat} jouer={jouer} pioche={pioche} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

// Le bazar : les sacs à dos.
export function PanneauBazar({ etat, jouer }: PropsPanneau) {
  const prixSac = prixProchainSac(etat)
  const prochainSac = SACS[etat.niveauSac + 1]

  return (
    <div className="liste-cartes">
      <div className="ligne-achat">
        <strong>🎒 Sac à dos</strong>
        <span className="discret">Pour porter plus d'objets du coffre de la mine jusqu'au marché.</span>
        <Amelioration
          etat={etat}
          actuel={`${SACS[etat.niveauSac].taille} places`}
          niveau={etat.niveauSac + 1}
          niveauMax={SACS.length}
          suivant={prochainSac && prixSac !== null ? { cout: { argent: prixSac, materiaux: {} }, texte: `⬆ ${prochainSac.taille} places` } : null}
          verrou={verrou(etat, 'sacs', etat.niveauSac + 1)}
          possible={prixSac !== null && etat.argent >= prixSac}
          onAmeliorer={() => jouer(acheterSac)}
          genre="acheter"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

// La foreuse : elle fore toute seule tant qu'elle a du charbon, plus vite avec l'électricité.
export function PanneauForeuse({ etat, jouer, onReglerTrajet }: PropsPanneau) {
  const foreuse = etat.foreuse
  const enMarche = foreuseEnMarche(etat)
  const chariot = prochainNiveauChariot(etat)
  const charbon = disponible(etat, 'charbon')
  // (le réservoir de la foreuse a une taille : on ne peut pas en mettre plus)
  const place = placeCharbonForeuse(etat)
  const forage = prochainNiveauForage(etat)
  // Des onglets (27/10), pour que tout tienne sans défiler.
  const [onglet, setOnglet] = useState<'forage' | 'chariot' | 'ameliorer' | 'wagonnets'>('forage')
  const avecTrajets = liaisonsDepuis(etat, 'foreuse').length > 0
  const ameliorable = peutAmeliorerForage(etat) || peutAmeliorerChariot(etat)

  return (
    <div className="liste-cartes">
      <OngletsPanneau
        onglets={[
          { id: 'forage', titre: '⚙️ Forage', pastille: !enMarche && !chariotPlein(etat) ? '!' : null },
          { id: 'chariot', titre: `🛒 Chariot`, pastille: chariotPlein(etat) ? '!' : null },
          { id: 'ameliorer', titre: '⬆️ Améliorer', pastille: ameliorable ? '+' : null },
          ...(avecTrajets ? [{ id: 'wagonnets' as const, titre: '🚃 Wagons' }] : []),
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      {onglet === 'forage' && (
        <div className="ligne-achat">
          <div className="ligne-titre">
            <strong>État</strong>
            <span className={`badge ${enMarche ? 'badge-vert' : ''}`}>{enMarche ? 'En marche' : chariotPlein(etat) ? 'Chariot plein' : 'Plus de charbon'}</span>
          </div>
          <span className="discret">
            {vitesseForage(etat).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} bloc(s) par seconde
            {foreuseAlimentee(etat) ? ' (⚡ boostée par le générateur)' : ''} · {foreuse.blocsFores.toLocaleString('fr-FR')} blocs forés
          </span>
          <Barre
            valeur={secondesDeCharbon(etat)}
            max={Math.max(secondesDeCharbon(etat), charbonMaxForeuse(etat) * SECONDES_PAR_CHARBON)}
            texte={`Charbon : ${Math.ceil(secondesDeCharbon(etat) / SECONDES_PAR_CHARBON)} / ${charbonMaxForeuse(etat)} (${Math.ceil(secondesDeCharbon(etat))} s)`}
            couleur="or"
          />
          <div className="boutons">
            <span className="discret">1 charbon = {SECONDES_PAR_CHARBON} s · tu en as {charbon} (sac + coffre){place === 0 && " · réservoir plein"}</span>
            <Bouton actif={charbon >= 1 && place >= 1} genre="charbon" onClick={() => jouer((e) => remplirForeuse(e, 1))}>
              +1
            </Bouton>
            <Bouton actif={charbon >= 10 && place >= 10} genre="charbon" onClick={() => jouer((e) => remplirForeuse(e, 10))}>
              +10
            </Bouton>
            <Bouton actif={charbon >= 1 && place >= 1} genre="charbon" onClick={() => jouer((e) => remplirForeuse(e, Infinity))}>
              Tout
            </Bouton>
          </div>
          {rechargeAutoDisponible(etat) ? (
            <label className="case-option">
              <input type="checkbox" checked={foreuse.rechargeAuto} onChange={() => jouer(basculerRechargeAuto)} />
              Recharge automatique : elle brûle le charbon qu'elle remonte (en gardant une minute d'avance)
            </label>
          ) : (
            <span className="discret">🔒 Recharge automatique au charbon : débloquée au niveau {NIVEAU_RECHARGE_AUTO + 1} de forage.</span>
          )}
          {!foreuseAlimentee(etat) && <span className="discret">⚡ Dans le rayon du générateur allumé, elle fore plus vite.</span>}
        </div>
      )}

      {/* Le chariot (27/10) : la même interface que le coffre de la mine. Il ne se vend plus sur
          place : on le met dans son sac, ou un wagonnet Foreuse → Marché l'emporte. */}
      {onglet === 'chariot' && (
        <StockMinerais
          etat={etat}
          jouer={jouer}
          titre="🛒 Chariot"
          nomStock="chariot"
          contenu={foreuse.chariot}
          capacite={capaciteChariot(etat)}
          textePlein={`Plein (${nbDansChariot(etat)}) : la foreuse s’arrête !`}
          liaison="foreuse-marche"
          prendre={prendreDuChariot}
        />
      )}

      {onglet === 'ameliorer' && (
        <>
          <div className="ligne-achat">
            <strong>⚙️ Vitesse de forage</strong>
            <Amelioration
              etat={etat}
              actuel={`${NIVEAUX_FORAGE[foreuse.niveauVitesse].vitesse.toLocaleString('fr-FR')} bloc/s sans électricité · réservoir ${charbonMaxForeuse(etat)} charbons`}
              niveau={foreuse.niveauVitesse + 1}
              niveauMax={NIVEAUX_FORAGE.length}
              suivant={forage && { cout: forage.cout, texte: `⬆ ${forage.vitesse} bloc/s · ${forage.reservoir} charbons` }}
              verrou={verrou(etat, 'forage', foreuse.niveauVitesse + 1)}
              possible={peutAmeliorerForage(etat)}
              onAmeliorer={() => jouer(ameliorerForage)}
            />
          </div>

          <div className="ligne-achat">
            <strong>🛒 Taille du chariot</strong>
            <Amelioration
              etat={etat}
              actuel={`${capaciteChariot(etat).toLocaleString('fr-FR')} places · plein en ${minutes(secondesPourRemplir(etat))}`}
              niveau={foreuse.niveauChariot + 1}
              niveauMax={NIVEAUX_CHARIOT.length}
              suivant={chariot && { cout: chariot.cout, texte: `⬆ ${chariot.capacite.toLocaleString('fr-FR')} places (${minutes(secondesPourRemplir(etat, foreuse.niveauChariot + 1))})` }}
              verrou={verrou(etat, 'chariot', foreuse.niveauChariot + 1)}
              possible={peutAmeliorerChariot(etat)}
              onAmeliorer={() => jouer(ameliorerChariot)}
            />
          </div>
        </>
      )}
      {onglet === 'wagonnets' && <PanneauTrajets etat={etat} jouer={jouer} depart="foreuse" onReglerTrajet={onReglerTrajet} />}
    </div>
  )
}

// ---------------------------------------------------------------------------

// Le générateur : on le remplit de redstone, il électrifie tout ce qui est dans son rayon.
export function PanneauGenerateur({ etat, jouer }: PropsPanneau) {
  const g = etat.generateur
  const redstone = disponible(etat, 'redstone')
  const enMarche = generateurEnMarche(etat)
  const prochain = prochainNiveauGenerateur(etat)
  // Deux onglets (27/10) : le courant, et ce qu'il alimente avec son amélioration.
  const [onglet, setOnglet] = useState<'courant' | 'rayon'>('courant')
  return (
    <div className="liste-cartes">
      <OngletsPanneau
        onglets={[
          { id: 'courant', titre: '⚡ Courant', pastille: g.allume && !enMarche ? '!' : null },
          { id: 'rayon', titre: '🔌 Rayon et amélioration', pastille: prochain !== null && peutPayer(etat, prochain.cout) ? '+' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      {onglet === 'courant' && (
        <div className="ligne-achat">
          <div className="ligne-titre">
            <strong>⚡ Courant</strong>
            <span className={`badge ${enMarche ? 'badge-vert' : ''}`}>{enMarche ? 'Allumé' : !g.allume ? 'Éteint' : 'Plus de redstone'}</span>
          </div>
          <span className="discret">
            Rayon : {rayonGenerateur(etat)} cases (le cercle jaune sur la carte) · puissance ×{puissanceGenerateur(etat)}
          </span>
          <Barre
            valeur={g.carburant}
            max={Math.max(g.carburant, 10 * SECONDES_PAR_REDSTONE)}
            texte={`Redstone : ${minutes(g.carburant)}`}
            couleur="rouge"
          />
          <div className="boutons">
            <span className="discret">1 redstone = {SECONDES_PAR_REDSTONE} s · tu en as {redstone} (sac + coffre)</span>
            <Bouton actif={redstone >= 1} genre="charbon" onClick={() => jouer((e) => remplirGenerateur(e, 1))}>
              +1
            </Bouton>
            <Bouton actif={redstone >= 10} genre="charbon" onClick={() => jouer((e) => remplirGenerateur(e, 10))}>
              +10
            </Bouton>
            <Bouton actif={redstone >= 1} genre="charbon" onClick={() => jouer((e) => remplirGenerateur(e, Infinity))}>
              Tout
            </Bouton>
            <Bouton actif genre="neutre" onClick={() => jouer(basculerGenerateur)}>
              {g.allume ? '⏸ Éteindre' : '▶ Allumer'}
            </Bouton>
          </div>
          {puisageDisponible(etat) ? (
            <label className="case-option">
              <input type="checkbox" checked={g.puiseDansLeCoffre} onChange={() => jouer(basculerPuisage)} />
              Il se sert tout seul dans le coffre de la mine (en gardant 5 minutes d'avance)
            </label>
          ) : (
            <span className="discret">🔒 Au niveau {NIVEAU_GENERATEUR_AUTO + 1}, il se servira tout seul en redstone dans le coffre de la mine.</span>
          )}
        </div>
      )}

      {onglet === 'rayon' && (
        <>
          {/* Ce qui est branché : la ligne de rails et la foreuse. */}
          <div className="ligne-achat">
            <strong>🔌 Ce qu'il alimente</strong>
            <ul className="liste-simple">
              {etat.trajets.length === 0 && <li>🛤️ Rails : pas encore de trajet de wagonnet.</li>}
              {etat.trajets.map((t) => {
                const ligne = ligneDe(etat, t.liaison)
                const info = LIAISONS[t.liaison]
                return (
                  <li key={t.liaison}>
                    🛤️ {BATIMENTS[info.depart].nom} → {BATIMENTS[info.arrivee].nom} :{' '}
                    {!ligne
                      ? 'rails coupés.'
                      : trajetElectrique(etat, t.liaison)
                        ? '✔ électrique, le wagonnet roule tout seul !'
                        : casesDansLeRayon(etat, ligne)
                          ? 'dans le rayon, mais le générateur ne donne pas de courant.'
                          : '✖ une partie des rails est hors du rayon : rapproche le générateur (ou agrandis son rayon).'}
                  </li>
                )
              })}
              <li>
                ⚙️ Foreuse :{' '}
                {!batimentPose(etat.village, 'foreuse')
                  ? 'pas encore construite.'
                  : foreuseAlimentee(etat)
                    ? '✔ boostée !'
                    : batimentDansLeRayon(etat, 'foreuse')
                      ? 'dans le rayon, mais sans courant.'
                      : '✖ hors du rayon.'}
              </li>
            </ul>
          </div>

          <div className="ligne-achat">
            <strong>⬆ Améliorer</strong>
            <Amelioration
              etat={etat}
              actuel={`Rayon ${rayonGenerateur(etat)} cases · puissance ×${puissanceGenerateur(etat)}`}
              niveau={g.niveau + 1}
              niveauMax={NIVEAUX_GENERATEUR.length}
              suivant={prochain && { cout: prochain.cout, texte: `⬆ Rayon ${prochain.rayon} · ×${prochain.puissance}` }}
              verrou={verrou(etat, 'generateur', g.niveau + 1)}
              possible={prochain !== null && peutPayer(etat, prochain.cout)}
              onAmeliorer={() => jouer(ameliorerGenerateur)}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

export function PanneauSucces({ etat }: { etat: EtatJeu }) {
  return (
    <>
      <p className="discret">
        {etat.succes.length} / {SUCCES.length} succès débloqués.
      </p>
      <ul className="grille-succes">
        {SUCCES.map((s) => {
          const obtenu = etat.succes.includes(s.id)
          return (
            <li key={s.id} className={obtenu ? 'obtenu' : ''}>
              <span className="succes-emoji">{obtenu ? s.emoji : '🔒'}</span>
              <strong>{s.titre}</strong>
              <span className="discret">{s.description}</span>
            </li>
          )
        })}
      </ul>
    </>
  )
}
