// Les panneaux des stands du village (Marché, Forgeron, Bazar, Enchanteur,
// Foreuse) et le panneau des succès.
// Ils n'ont aucune règle du jeu : ils lisent l'état et appellent les actions de src/jeu.

import type { ReactNode } from 'react'
import {
  BLOCS,
  ENCHANTEMENTS,
  LISTE_ENCHANTEMENTS,
  COUT_ACTIVATION_FOREUSE,
  NIVEAUX_CHARIOT,
  NIVEAUX_FORAGE,
  NIVEAU_RECHARGE_AUTO,
  PIOCHES,
  PRESTIGE_FOREUSE,
  PRIX_SEAU,
  SECONDES_PAR_CHARBON,
  SACS,
  type Cout,
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
  peutPayer,
  prochainNiveauChariot,
  prochainNiveauForage,
  basculerChariot,
  basculerRechargeAuto,
  rechargeAutoDisponible,
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
  apercuVente,
  basculerVente,
  bonusVente,
  chiffreRomain,
  coutEnchantement,
  devisReparation,
  enchanter,
  equiper,
  peutAcheterPioche,
  peutEnchanter,
  peutReparer,
  placeLibre,
  prixProchainSac,
  quantite,
  reparer,
  valeurDe,
  vendre,
  type DevisReparation,
  type EtatJeu,
} from '../jeu/mineur'
import { SUCCES } from '../jeu/succes'
import type { Action } from '../usePartie'
import { Barre } from './Barre'

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

// Affiche « 3/4 💎 Diamant » en rouge s'il en manque.
function Materiau({ etat, bloc, nombre }: { etat: EtatJeu; bloc: IdBloc; nombre: number }) {
  const possede = quantite(etat, bloc)
  return (
    <span className={possede >= nombre ? 'ok' : 'manque'}>
      {Math.min(possede, nombre)}/{nombre} {BLOCS[bloc].emoji} {BLOCS[bloc].nom}
    </span>
  )
}

// « 2 Fer », « 48 $ » ou « 24 $ + 1 Fer » selon ce qu'il faut pour réparer.
function texteDevis(devis: DevisReparation): string {
  const morceaux: string[] = []
  if (devis.cout > 0) morceaux.push(`${devis.cout} $`)
  if (devis.dansLeSac > 0) morceaux.push(`${devis.dansLeSac} ${devis.materiau}`)
  return morceaux.join(' + ')
}

// ---------------------------------------------------------------------------

// Le marché : « Vendre tout » vend tout le sac, sauf ce qu'on décoche.
export function PanneauMarche({ etat, jouer }: PropsPanneau) {
  const gain = apercuVente(etat)
  // Les objets les plus précieux en premier.
  const piles = (Object.entries(etat.inventaire) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)

  return (
    <div className="liste-cartes">
      <p className="discret">Décoche ce que tu veux garder (pour une pioche, un enchantement, l'ascenseur…).</p>
      {piles.length === 0 ? (
        <p className="discret">Ton sac est vide. Va creuser !</p>
      ) : (
        <ul className="liste-vente">
          {piles.map(([id, nombre]) => {
            const aVendre = !etat.nonAVendre.includes(id)
            return (
              <li key={id} className={aVendre ? '' : 'garde'}>
                <label>
                  <input type="checkbox" checked={aVendre} onChange={() => jouer((e) => basculerVente(e, id))} />
                  <span className={`mini-bloc bloc-${id} roche-pierre`} aria-hidden="true" />
                  <span className="inventaire-nom">{BLOCS[id].nom}</span>
                  <span className="inventaire-nombre">×{nombre}</span>
                  <span className="inventaire-valeur">
                    {aVendre ? `${Math.round(nombre * BLOCS[id].prix * bonusVente(etat))} $` : '🔒 gardé'}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
      <button className="bouton bouton-vendre" disabled={gain === 0} onClick={() => jouer(vendre)}>
        💰 Vendre tout {gain > 0 && `· +${gain.toLocaleString('fr-FR')} $`}
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
        const devis = devisReparation(etat, pioche.niveau)

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
              Vitesse x{pioche.vitesse} · jusqu'à -{pioche.profMax} m · durabilité {pioche.durabilite}
            </span>

            {possedee && (
              <Barre
                valeur={pioche.durabilite - usure}
                max={pioche.durabilite}
                texte={usure >= pioche.durabilite ? 'Cassée' : `${pioche.durabilite - usure} / ${pioche.durabilite}`}
                couleur={usure >= pioche.durabilite ? 'rouge' : 'vert'}
              />
            )}

            {prochaine && Object.keys(pioche.materiaux).length > 0 && (
              <span className="materiaux">
                Il faut :{' '}
                {Object.entries(pioche.materiaux).map(([bloc, nombre]) => (
                  <Materiau key={bloc} etat={etat} bloc={bloc as IdBloc} nombre={nombre ?? 0} />
                ))}
              </span>
            )}

            <div className="boutons">
              {possedee && !equipee && (
                <Bouton actif genre="neutre" onClick={() => jouer((e) => equiper(e, pioche.niveau))}>
                  Équiper
                </Bouton>
              )}
              {enVille && possedee && usure > 0 && (
                <Bouton actif={peutReparer(etat, pioche.niveau)} genre="reparer" onClick={() => jouer((e) => reparer(e, pioche.niveau))}>
                  🔧 Réparer · {texteDevis(devis)}
                </Bouton>
              )}
              {enVille && (
                <Bouton actif={peutAcheterPioche(etat, pioche.niveau)} genre="acheter" onClick={() => jouer((e) => acheterPioche(e, pioche.niveau))}>
                  {prochaine ? '🔓 Débloquer' : '🛒 Racheter neuve'} · {pioche.prix.toLocaleString('fr-FR')} $
                </Bouton>
              )}
            </div>
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
        <strong>🎒 Sac plus grand</strong>
        <span className="discret">
          {prochainSac ? `${SACS[etat.niveauSac].taille} → ${prochainSac.taille} places` : `Tu as le plus grand sac (${SACS[etat.niveauSac].taille} places).`}
        </span>
        {prixSac !== null && (
          <div className="boutons">
            <Bouton actif={etat.argent >= prixSac} genre="acheter" onClick={() => jouer(acheterSac)}>
              Acheter · {prixSac.toLocaleString('fr-FR')} $
            </Bouton>
          </div>
        )}
      </div>

      <div className="ligne-achat">
        <strong>🪣 Seau d'eau</strong>
        <span className="discret">Transforme une lave en obsidienne (60 $) au lieu de brûler ton sac. Tu en as {etat.seaux}.</span>
        <div className="boutons">
          <Bouton actif={etat.argent >= PRIX_SEAU} genre="acheter" onClick={() => jouer(acheterSeau)}>
            Acheter · {PRIX_SEAU} $
          </Bouton>
        </div>
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------

// Le prix d'une amélioration : « 1 000 $ + 0/30 fer ».
function PrixCout({ etat, cout }: { etat: EtatJeu; cout: Cout }) {
  return (
    <span className="materiaux">
      {cout.argent !== undefined && <span className={etat.argent >= cout.argent ? 'ok' : 'manque'}>{cout.argent.toLocaleString('fr-FR')} $</span>}
      {Object.entries(cout.materiaux).map(([bloc, nombre]) => (
        <Materiau key={bloc} etat={etat} bloc={bloc as IdBloc} nombre={nombre ?? 0} />
      ))}
    </span>
  )
}

// La foreuse : débloquée au prestige 1, activée une fois, puis nourrie au charbon.
export function PanneauForeuse({ etat, jouer }: PropsPanneau) {
  const foreuse = etat.foreuse

  if (!foreuseDebloquee(etat)) {
    return (
      <div className="liste-cartes">
        <div className="ligne-achat verrouille">
          <strong>🔒 Fermé par une barrière</strong>
          <span className="discret">
            Cet espace s'ouvre au prestige {PRESTIGE_FOREUSE}. Atteins la bedrock (-128 m) puis passe prestige pour y installer une foreuse
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
          <div className="boutons">
            <PrixCout etat={etat} cout={COUT_ACTIVATION_FOREUSE} />
            <Bouton actif={peutActiverForeuse(etat)} genre="ameliorer" onClick={() => jouer(activerForeuse)}>
              Activer
            </Bouton>
          </div>
        </div>
      </div>
    )
  }

  const enMarche = foreuseEnMarche(etat)
  const forage = prochainNiveauForage(etat)
  const chariot = prochainNiveauChariot(etat)
  const charbon = quantite(etat, 'charbon')
  const contenu = (Object.entries(foreuse.chariot) as [IdBloc, number][]).sort(([a], [b]) => BLOCS[b].prix - BLOCS[a].prix)
  const selection = selectionChariot(etat)
  const valeurSelection = valeurDe(etat, selection)
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
          Profondeur de forage : -{foreuse.profondeur} m · {vitesseForage(etat)} bloc(s) par seconde · {foreuse.blocsFores.toLocaleString('fr-FR')} blocs
          forés
        </span>
        <Barre
          valeur={foreuse.carburant}
          max={Math.max(foreuse.carburant, 10 * SECONDES_PAR_CHARBON)}
          texte={`Charbon : ${Math.ceil(foreuse.carburant)} s`}
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
          <span className="discret">🔒 Recharge automatique au charbon : débloquée au niveau {NIVEAU_RECHARGE_AUTO + 1} de forage.</span>
        )}
      </div>

      <div className="ligne-achat">
        <strong>Chariot</strong>
        <Barre valeur={nbDansChariot(etat)} max={capaciteChariot(etat)} texte={`${nbDansChariot(etat)} / ${capaciteChariot(etat)}`} couleur="violet" />
        {contenu.length === 0 ? (
          <span className="discret">Le chariot est vide.</span>
        ) : (
          <>
            <span className="discret">Coche ce que tu veux vendre ou mettre dans ton sac.</span>
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
                      <span className="inventaire-valeur">{Math.round(nombre * BLOCS[id].prix * bonusVente(etat))} $</span>
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

      <div className="ligne-achat">
        <strong>Améliorations</strong>
        <div className="boutons">
          <span className="discret">Vitesse : {NIVEAUX_FORAGE[foreuse.niveauVitesse].vitesse} bloc/s</span>
          {forage ? (
            <>
              <PrixCout etat={etat} cout={forage.cout} />
              <Bouton actif={peutPayer(etat, forage.cout)} genre="ameliorer" onClick={() => jouer(ameliorerForage)}>
                → {forage.vitesse} bloc/s
              </Bouton>
            </>
          ) : (
            <span className="ok">max</span>
          )}
        </div>
        <div className="boutons">
          <span className="discret">Chariot : {NIVEAUX_CHARIOT[foreuse.niveauChariot].capacite} places</span>
          {chariot ? (
            <>
              <PrixCout etat={etat} cout={chariot.cout} />
              <Bouton actif={peutPayer(etat, chariot.cout)} genre="ameliorer" onClick={() => jouer(ameliorerChariot)}>
                → {chariot.capacite} places
              </Bouton>
            </>
          ) : (
            <span className="ok">max</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

export function PanneauEnchanter({ etat, jouer }: PropsPanneau) {
  return (
    <div className="liste-cartes">
      <p className="discret">
        Les enchantements s'appliquent à toutes tes pioches. Tu as {quantite(etat, 'lapis')} 🔷 lapis et {quantite(etat, 'emeraude')} 💚 émeraudes.
      </p>
      {LISTE_ENCHANTEMENTS.map((id) => {
        const e = ENCHANTEMENTS[id]
        const niveau = etat.enchantements[id]
        const cout = coutEnchantement(etat, id)
        return (
          <div key={id} className="ligne-achat">
            <div className="ligne-titre">
              <strong>✨ {e.nom}</strong>
              <span className="badge">
                {niveau === 0 ? 'Aucun' : chiffreRomain(niveau)} / {chiffreRomain(e.niveauMax)}
              </span>
            </div>
            <span className="discret">{e.description}</span>
            {cout === null ? (
              <span className="ok">Niveau max atteint !</span>
            ) : (
              <div className="boutons">
                <span className="materiaux">
                  <Materiau etat={etat} bloc="lapis" nombre={cout.lapis} />
                  <Materiau etat={etat} bloc="emeraude" nombre={cout.emeraudes} />
                </span>
                <Bouton actif={peutEnchanter(etat, id)} genre="enchanter" onClick={() => jouer((x) => enchanter(x, id))}>
                  Enchanter {chiffreRomain(niveau + 1)}
                </Bouton>
              </div>
            )}
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
