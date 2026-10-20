// Les panneaux des stands du village (Marché, Forgeron, Bazar, Enchanteur,
// Foreuse) et le panneau des succès.
// Ils n'ont aucune règle du jeu : ils lisent l'état et appellent les actions de src/jeu.

import { useState, type ReactNode } from 'react'
import {
  BLOCS,
  ENCHANTEMENTS,
  LISTE_ENCHANTEMENTS,
  COUT_ACTIVATION_FOREUSE,
  NIVEAUX_CHARIOT,
  NIVEAUX_FORAGE,
  PIOCHES,
  PRESTIGE_FOREUSE,
  PRIX_SEAU,
  SECONDES_PAR_CHARBON,
  SACS,
  profondeurBedrock,
  profondeurMaxPioche,
  niveauMaxAuPrestige,
  type IdBloc,
} from '../jeu/donnees'
import {
  activerForeuse,
  ameliorerChariot,
  ameliorerForage,
  capaciteChariot,
  chariotPlein,
  foreuseDebloquee,
  foreuseEnMarche,
  nbDansChariot,
  peutActiverForeuse,
  prochainNiveauChariot,
  prochainNiveauForage,
  basculerChariot,
  chariotBloqueAuPrestige,
  cocherToutChariot,
  forageBloqueAuPrestige,
  niveauRechargeAuto,
  peutAmeliorerChariot,
  peutAmeliorerForage,
  secondesDeCharbon,
  basculerRechargeAuto,
  rechargeAutoDisponible,
  valeurAuChariot,
  remplirForeuse,
  selectionChariot,
  vendreChariot,
  viderChariotDansSac,
  vitesseForage,
} from '../jeu/foreuse'
import {
  aLaSurface,
  acheterPioche,
  acheterSac,
  acheterSeau,
  reglerVente,
  vendreLot,
  bonusVente,
  chiffreRomain,
  coutEnchantement,
  coutReparation,
  enchanter,
  enchantementBloqueAuPrestige,
  equiper,
  peutAcheterPioche,
  peutEnchanter,
  peutReparer,
  placeLibre,
  prixProchainSac,
  quantite,
  reparer,
  valeurDe,
  type EtatJeu,
} from '../jeu/mineur'
import { SUCCES } from '../jeu/succes'
import type { Action } from '../usePartie'
import { Achat, Amelioration } from './Amelioration'
import { Barre } from './Barre'
import { lotChoisi, type Choix } from '../choix'
import { Jauges } from './Jauges'

type PropsPanneau = {
  etat: EtatJeu
  jouer: (action: Action) => void
}

// Chaque sorte d'action a sa couleur (voir « Les couleurs des boutons » dans index.css).
export type GenreBouton = 'neutre' | 'acheter' | 'ameliorer' | 'reparer' | 'enchanter' | 'vendre' | 'sac' | 'charbon'

function Bouton({ actif, onClick, genre, children }: { actif: boolean; onClick: () => void; genre: GenreBouton; children: ReactNode }) {
  return (
    <button className={`bouton bouton-petit bouton-${genre}`} disabled={!actif} onClick={onClick}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------

// Le marché : « Vendre tout » vend tout le sac, sauf ce qu'on décoche.
export function PanneauMarche({ etat, jouer }: PropsPanneau) {
  // Les quantités choisies avec les jauges (par défaut : tout, sauf les objets gardés).
  const [choix, setChoix] = useState<Choix>({})
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const lot = lotChoisi(choix, etat.nonAVendre, piles)
  const gain = valeurDe(etat, lot)

  // Une jauge mise à 0 : l'objet est « gardé » (le jeu s'en souvient pour la prochaine fois).
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

  return (
    <div className="liste-cartes">
      <p className="discret">Choisis combien vendre de chaque objet (garde-en pour une pioche, un enchantement, l'ascenseur…).</p>
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Va creuser !</p>
      ) : (
        <Jauges
          piles={piles}
          choix={choix}
          gardes={etat.nonAVendre}
          onChanger={changer}
          prixUnitaire={(bloc) => BLOCS[bloc].prix * bonusVente(etat)}
          onToutSelectionner={toutSelectionner}
        />
      )}
      <button
        className="bouton bouton-vendre"
        disabled={gain === 0}
        onClick={() => {
          jouer((e) => vendreLot(e, lot))
          setChoix({}) // après la vente, les jauges reviennent à « tout » (sauf les objets gardés)
        }}
      >
        💰 Vendre la sélection {gain > 0 && `· +${gain.toLocaleString('fr-FR')} $`}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------

// Le forgeron. Au fond de la mine, on peut seulement changer de pioche.
export function PanneauPioches({ etat, jouer }: PropsPanneau) {
  const enVille = aLaSurface(etat)
  return (
    <div className="liste-cartes">
      {!enVille && <p className="discret">⬆️ Pour acheter ou réparer une pioche, remonte voir le forgeron à la surface.</p>}

      {PIOCHES.map((pioche) => {
        const possedee = pioche.niveau in etat.pioches
        const equipee = pioche.niveau === etat.niveauPioche
        const debloquee = pioche.niveau <= etat.meilleure
        const prochaine = pioche.niveau === etat.meilleure + 1
        const usure = etat.pioches[pioche.niveau] ?? 0
        const cout = coutReparation(etat, pioche.niveau)

        if (!debloquee && !prochaine) {
          return (
            <div key={pioche.niveau} className="ligne-achat verrouille">
              <strong>🔒 Pioche en {pioche.nom}</strong>
              <span className="discret">Débloque d'abord la pioche précédente.</span>
            </div>
          )
        }

        return (
          <div key={pioche.niveau} className={`ligne-achat ${equipee ? 'equipee' : ''}`}>
            <div className="ligne-titre">
              <strong>
                {pioche.emoji} Pioche en {pioche.nom}
              </strong>
              {equipee && <span className="badge">Équipée</span>}
            </div>
            <span className="discret">
              Vitesse x{pioche.vitesse} · jusqu'à -{profondeurMaxPioche(pioche.niveau, etat.prestige)} m · durabilité {pioche.durabilite}
            </span>

            {possedee && (
              <Barre
                valeur={pioche.durabilite - usure}
                max={pioche.durabilite}
                texte={usure >= pioche.durabilite ? 'Cassée' : `${pioche.durabilite - usure} / ${pioche.durabilite}`}
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
            {/* Réparer : de l'argent (selon l'usure) + 3 minerais de la pioche, le prix à gauche. */}
            {enVille && possedee && usure > 0 && cout && (
              <Achat
                etat={etat}
                cout={cout}
                texte="🔧 Réparer"
                possible={peutReparer(etat, pioche.niveau)}
                onAcheter={() => jouer((e) => reparer(e, pioche.niveau))}
                genre="reparer"
              />
            )}
            {/* Débloquer (avec les minerais demandés) ou racheter neuve : le prix à gauche, comme partout. */}
            {enVille && (
              <Achat
                etat={etat}
                cout={{ argent: pioche.prix, materiaux: prochaine ? pioche.materiaux : {} }}
                texte={prochaine ? '🔓 Débloquer' : '🛒 Racheter neuve'}
                possible={peutAcheterPioche(etat, pioche.niveau)}
                onAcheter={() => jouer((e) => acheterPioche(e, pioche.niveau))}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

// Le bazar : sacs à dos et seaux d'eau.
export function PanneauBazar({ etat, jouer }: PropsPanneau) {
  const prixSac = prixProchainSac(etat)
  const prochainSac = SACS[etat.niveauSac + 1]

  return (
    <div className="liste-cartes">
      <div className="ligne-achat">
        <strong>🎒 Sac à dos</strong>
        <Amelioration
          etat={etat}
          actuel={`${SACS[etat.niveauSac].taille} places`}
          niveau={etat.niveauSac + 1}
          niveauMax={SACS.length}
          suivant={prochainSac && prixSac !== null ? { cout: { argent: prixSac, materiaux: {} }, texte: `⬆ ${prochainSac.taille} places` } : null}
          possible={prixSac !== null && etat.argent >= prixSac && aLaSurface(etat)}
          onAmeliorer={() => jouer(acheterSac)}
          genre="acheter"
        />
      </div>

      <div className="ligne-achat">
        <strong>🪣 Seau d'eau</strong>
        <span className="discret">Transforme une lave en obsidienne (60 $) au lieu de brûler ton sac. Tu en as {etat.seaux}.</span>
        <Achat
          etat={etat}
          cout={{ argent: PRIX_SEAU, materiaux: {} }}
          texte="🪣 Acheter"
          possible={etat.argent >= PRIX_SEAU && aLaSurface(etat)}
          onAcheter={() => jouer(acheterSeau)}
        />
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------

// La foreuse : débloquée au prestige 1, activée une fois, puis nourrie au charbon.
export function PanneauForeuse({ etat, jouer }: PropsPanneau) {
  const foreuse = etat.foreuse

  if (!foreuseDebloquee(etat)) {
    return (
      <div className="liste-cartes">
        <div className="ligne-achat verrouille">
          <strong>🔒 Fermé par une barrière</strong>
          <span className="discret">
            Cet espace s'ouvre au prestige {PRESTIGE_FOREUSE}. Atteins la bedrock (-{profondeurBedrock(etat.prestige)} m) puis passe prestige pour y installer une foreuse
            qui creuse toute seule.
          </span>
        </div>
      </div>
    )
  }

  if (!foreuse.active) {
    return (
      <div className="liste-cartes">
        <div className="ligne-achat">
          <strong>Activer la foreuse</strong>
          <span className="discret">
            Une fois activée, elle le reste pour toujours (même après les prochains prestiges). Ensuite, elle creuse toute seule tant qu'elle a du
            charbon et remonte ce qu'elle trouve dans son chariot.
          </span>
          <Achat
            etat={etat}
            cout={COUT_ACTIVATION_FOREUSE}
            texte="⚙️ Activer"
            possible={peutActiverForeuse(etat) && aLaSurface(etat)}
            onAcheter={() => jouer(activerForeuse)}
            genre="ameliorer"
          />
        </div>
      </div>
    )
  }

  const enMarche = foreuseEnMarche(etat)
  const chariot = prochainNiveauChariot(etat)
  const charbon = quantite(etat, 'charbon')
  const contenu = (Object.entries(foreuse.chariot) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const forage = prochainNiveauForage(etat)
  const selection = selectionChariot(etat)
  const valeurSelection = valeurAuChariot(etat, selection)
  const nbSelection = Object.values(selection).reduce((total, n) => total + (n ?? 0), 0)

  return (
    <div className="liste-cartes">
      <div className="ligne-achat">
        <div className="ligne-titre">
          <strong>État</strong>
          <span className={`badge ${enMarche ? 'badge-vert' : ''}`}>
            {enMarche ? 'En marche' : chariotPlein(etat) ? 'Chariot plein' : 'Plus de charbon'}
          </span>
        </div>
        <span className="discret">
          Profondeur de forage : -{foreuse.profondeur} m · {vitesseForage(etat).toLocaleString('fr-FR')} bloc(s) par seconde ·{' '}
          {foreuse.blocsFores.toLocaleString('fr-FR')} blocs forés
        </span>
        <Barre
          valeur={secondesDeCharbon(etat)}
          max={Math.max(secondesDeCharbon(etat), 10 * SECONDES_PAR_CHARBON)}
          texte={`Charbon : ${Math.ceil(secondesDeCharbon(etat))} s`}
          couleur="or"
        />
        <div className="boutons">
          <span className="discret">1 charbon = {SECONDES_PAR_CHARBON} s · tu en as {charbon}</span>
          <Bouton actif={charbon >= 1} genre="charbon" onClick={() => jouer((e) => remplirForeuse(e, 1))}>
            +1
          </Bouton>
          <Bouton actif={charbon >= 10} genre="charbon" onClick={() => jouer((e) => remplirForeuse(e, 10))}>
            +10
          </Bouton>
          <Bouton actif={charbon >= 1} genre="charbon" onClick={() => jouer((e) => remplirForeuse(e, Infinity))}>
            Tout
          </Bouton>
        </div>
        {rechargeAutoDisponible(etat) ? (
          <label className="case-option">
            <input type="checkbox" checked={foreuse.rechargeAuto} onChange={() => jouer(basculerRechargeAuto)} />
            Recharge automatique : elle brûle le charbon qu'elle remonte (en gardant une minute d'avance)
          </label>
        ) : (
          <span className="discret">🔒 Recharge automatique au charbon : débloquée au niveau {niveauRechargeAuto(etat) + 1} de forage.</span>
        )}
      </div>

      <div className="ligne-achat">
        <strong>Chariot</strong>
        <Barre valeur={nbDansChariot(etat)} max={capaciteChariot(etat)} texte={`${nbDansChariot(etat)} / ${capaciteChariot(etat)}`} couleur="violet" />
        {contenu.length === 0 ? (
          <span className="discret">Le chariot est vide.</span>
        ) : (
          <>
            <div className="ligne-titre">
              <span className="discret">Coche ce que tu veux vendre ou mettre dans ton sac.</span>
              {/* Tout cocher d'un coup (ou tout décocher, si tout est déjà coché). */}
              <button
                className="bouton bouton-petit bouton-neutre"
                onClick={() => jouer((e) => cocherToutChariot(e, contenu.some(([id]) => foreuse.nonCoches.includes(id))))}
              >
                {contenu.some(([id]) => foreuse.nonCoches.includes(id)) ? '☑️ Tout sélectionner' : '☐ Tout désélectionner'}
              </button>
            </div>
            <ul className="liste-vente liste-chariot">
              {contenu.map(([id, nombre]) => {
                const coche = !foreuse.nonCoches.includes(id)
                return (
                  <li key={id} className={coche ? '' : 'garde'}>
                    <label>
                      <input type="checkbox" checked={coche} onChange={() => jouer((e) => basculerChariot(e, id))} />
                      <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
                      <span className="inventaire-nom">{BLOCS[id].nom}</span>
                      <span className="inventaire-nombre">×{nombre}</span>
                      <span className="inventaire-valeur">{valeurAuChariot(etat, { [id]: nombre })} $</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <div className="boutons">
          <Bouton actif={valeurSelection > 0} genre="vendre" onClick={() => jouer(vendreChariot)}>
            💰 Vendre la sélection{valeurSelection > 0 && ` · +${valeurSelection.toLocaleString('fr-FR')} $`}
          </Bouton>
          <Bouton actif={nbSelection > 0 && placeLibre(etat) > 0} genre="sac" onClick={() => jouer(viderChariotDansSac)}>
            🎒 Mettre dans le sac ({Math.min(nbSelection, placeLibre(etat))})
          </Bouton>
        </div>
      </div>

      {/* Une seule foreuse (20/10) : on améliore sa vitesse de forage, un niveau de plus à chaque prestige. */}
      <div className="ligne-achat">
        <strong>⚙️ Vitesse de forage</strong>
        <Amelioration
          etat={etat}
          actuel={`${vitesseForage(etat).toLocaleString('fr-FR')} bloc/s`}
          niveau={foreuse.niveauVitesse + 1}
          niveauMax={NIVEAUX_FORAGE.length}
          niveauPermis={niveauMaxAuPrestige('forage', etat.prestige) + 1}
          suivant={forage && { cout: forage.cout, texte: `⬆ ${forage.vitesse} bloc/s` }}
          bloqueAuPrestige={forageBloqueAuPrestige(etat)}
          possible={peutAmeliorerForage(etat)}
          onAmeliorer={() => jouer(ameliorerForage)}
        />
      </div>

      <div className="ligne-achat">
        <strong>🛒 Taille du chariot</strong>
        <Amelioration
          etat={etat}
          actuel={`${NIVEAUX_CHARIOT[foreuse.niveauChariot].capacite} places`}
          niveau={foreuse.niveauChariot + 1}
          niveauMax={NIVEAUX_CHARIOT.length}
          niveauPermis={niveauMaxAuPrestige('chariot', etat.prestige) + 1}
          suivant={chariot && { cout: chariot.cout, texte: `⬆ ${chariot.capacite} places` }}
          bloqueAuPrestige={chariotBloqueAuPrestige(etat)}
          possible={peutAmeliorerChariot(etat)}
          onAmeliorer={() => jouer(ameliorerChariot)}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function PanneauEnchanter({ etat, jouer }: PropsPanneau) {
  return (
    <div className="liste-cartes">
      <p className="discret">
        Les enchantements s'appliquent à toutes tes pioches et sont gardés au prestige. Leurs niveaux se débloquent petit à petit, prestige après
        prestige. Tu as {quantite(etat, 'lapis')} 🔷 lapis et {quantite(etat, 'emeraude')} 💚 émeraudes.
      </p>
      {LISTE_ENCHANTEMENTS.map((id) => {
        const e = ENCHANTEMENTS[id]
        const niveau = etat.enchantements[id]
        const cout = coutEnchantement(etat, id)
        return (
          <div key={id} className="ligne-achat">
            <strong>✨ {e.nom}</strong>
            <span className="discret">{e.description}</span>
            <Amelioration
              etat={etat}
              actuel={niveau === 0 ? 'Pas encore enchantée' : `${e.nom} ${chiffreRomain(niveau)}`}
              niveau={niveau}
              niveauMax={e.niveauMax}
              niveauPermis={niveauMaxAuPrestige(id, etat.prestige)}
              suivant={cout && { cout, texte: `✨ Enchanter ${chiffreRomain(niveau + 1)}` }}
              bloqueAuPrestige={enchantementBloqueAuPrestige(etat, id)}
              possible={peutEnchanter(etat, id)}
              onAmeliorer={() => jouer((x) => enchanter(x, id))}
              genre="enchanter"
            />
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------

export function PanneauSucces({ etat }: { etat: EtatJeu }) {
  return (
    <>
      <p className="discret">
        {etat.succes.length} / {SUCCES.length} succès débloqués (ils restent après un prestige).
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
