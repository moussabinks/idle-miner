// Les panneaux des bâtiments du village (Marché, Forgeron, Foreuse, Générateur) et le panneau des
// succès (refaits le 25/10, avec le nouveau style). Le panneau de la mine est dans
// PanneauMine.tsx, celui du Personnel dans PanneauEmployes.tsx.
// Ils n'ont aucune règle du jeu : ils lisent l'état et appellent les actions de src/jeu.

import { useState, type ReactNode } from 'react'
import { BATIMENTS, BLOCS, LIAISONS, LISTE_BLOCS, LISTE_LIAISONS, NIVEAUX_CHARIOT, NIVEAUX_FORAGE, NIVEAUX_GENERATEUR, PIOCHES, SECONDES_PAR_CHARBON, type IdBloc, type IdLiaison } from '../jeu/donnees'
import {
  ameliorerChariot,
  ameliorerForage,
  capaciteChariot,
  charbonMaxForeuse,
  chariotPlein,
  foreuseEnMarche,
  peutAmeliorerChariot,
  peutAmeliorerForage,
  placeCharbonForeuse,
  prochainNiveauChariot,
  prochainNiveauForage,
  remplirForeuse,
  secondesDeCharbon,
  vendreChariot,
  vitesseForage,
} from '../jeu/foreuse'
import {
  ameliorerGenerateur,
  basculerGenerateur,
  batimentDansLeRayon,
  casesDansLeRayon,
  foreuseAlimentee,
  generateurEnMarche,
  multiplicateurGenerateur,
  placeRedstoneGenerateur,
  prochainNiveauGenerateur,
  rayonGenerateur,
  remplirGenerateur,
  reserveMaxGenerateur,
  texteBonusGenerateur,
} from '../jeu/generateur'
import { atelierPose, objetsAcceptes, produitDe } from '../jeu/ateliers'
import { nombre, t } from '../jeu/langue'
import { blocsDuNiveau } from '../jeu/mine'
import { acheterPioche, coutPioche, coutReparation, disponible, equiper, peutAcheterPioche, peutPayer, peutReparer, reparer, valeurDe, type EtatJeu } from '../jeu/mineur'
import { railsDebloques, verrou } from '../jeu/niveaux'
import { analyseWagonnet } from '../jeu/production'
import { SUCCES } from '../jeu/succes'
import { batimentPose } from '../jeu/village'
import { ligneDe, trajetElectrique } from '../jeu/wagonnet'
import type { Action } from '../usePartie'
import { montrerRayon, rayonToujoursVisible } from '../rayonGenerateur'
import { AlerteChariot } from './AlerteChariot'
import { Interrupteur } from './Interrupteur'
import { Amelioration, BoutonsAchat } from './Amelioration'
import { Barre } from './Barre'
import { useJeu } from './contexteJeu'
import { OngletsPanneau } from './OngletsPanneau'
import { PanneauTrajets } from './PanneauTrajets'
import { StockMinerais } from './StockMinerais'

export type PropsPanneau = {
  etat: EtatJeu
  jouer: (action: Action) => void
  onReglerTrajet?: (liaisons: IdLiaison[]) => void // ouvre la fenêtre des trajets (27/10)
  onAllerAuPersonnel?: () => void // (23/10) va au Personnel (agrandir le chariot d'un pousseur)
  onConstruireRails?: () => void // (25/10) commence à poser des rails (le marché sans rails)
}

// « 8 min », « 1 h 05 » : un temps assez long.
function minutes(secondes: number): string {
  const total = Math.round(secondes / 60)
  if (total < 60) return t('{n} min', { n: Math.max(1, total) })
  return t('{h} h {m}', { h: Math.floor(total / 60), m: String(total % 60).padStart(2, '0') })
}

// Le bonus du générateur en ce moment : « + 30 % ».
function boostGenerateur(etat: EtatJeu): string {
  return texteBonusGenerateur(multiplicateurGenerateur(etat) - 1)
}

// Une carte d'état, en haut d'un panneau : une grosse icône, ce qui se passe, et une étiquette.
export function CarteEtat({ icone, titre, etiquette, ok, children }: { icone: string; titre: string; etiquette: string; ok: boolean; children?: ReactNode }) {
  return (
    <div className="carte carte-etat">
      <span className="carte-etat-icone" aria-hidden="true">
        {icone}
      </span>
      <div className="carte-etat-texte">
        <span className="carte-etat-titre">
          <strong>{titre}</strong>
          <span className={`etiquette ${ok ? 'etiquette-vert' : 'etiquette-rose'}`}>{etiquette}</span>
        </span>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Le marché : depuis le 25/10, on vend le coffre directement à la mine. Le marché sert à
// l'automatisation : les wagonnets qui y arrivent vendent tout seuls.
// ---------------------------------------------------------------------------

const VERS_LE_MARCHE = LISTE_LIAISONS.filter((l) => LIAISONS[l].arrivee === 'marche')

// Ce lingot (ou ce bijou) sort d'un atelier construit, d'un minerai qu'on trouve déjà dans la mine.
function produitDUnAtelier(etat: EtatJeu, bloc: IdBloc): boolean {
  const duNiveau = blocsDuNiveau(etat.niveauMine)
  return (['fonderie', 'joaillerie'] as const).some((id) => atelierPose(etat, id) && objetsAcceptes(id).some((minerai) => duNiveau.includes(minerai) && produitDe(id, minerai) === bloc))
}

export function PanneauMarche({ onReglerTrajet, onConstruireRails }: PropsPanneau) {
  const { etat } = useJeu()
  const avecRails = VERS_LE_MARCHE.some((l) => ligneDe(etat, l) !== null)
  return (
    <div className="panneau-bat">
      <div className="carte carte-creme marche-total">
        <span className="marche-total-icone" aria-hidden="true">
          💰
        </span>
        <span className="marche-total-texte">
          <span className="discret">{t('Vendu par les wagonnets')}</span>
          <strong>{nombre(Math.floor(etat.stats.argentWagonnet))} $</strong>
        </span>
      </div>

      {/* Pas encore de rails : le marché ne sert à rien. On le dit, avec le bouton pour en poser. */}
      {!avecRails && (
        <div className="carte appel-rails">
          <strong>🛤️ {t('Relie la mine au marché avec des rails')}</strong>
          <p className="discret">{t('Un wagonnet y vendra le coffre de la mine tout seul, même quand tu ne joues pas.')}</p>
          {!railsDebloques(etat) ? (
            <span className="verrou">🔒 ⭐ 2</span>
          ) : (
            onConstruireRails && (
              <button className="btn btn-vert btn-large" onClick={onConstruireRails}>
                🛤️ {t('Poser des rails')}
              </button>
            )
          )}
        </div>
      )}

      {avecRails && (
        <>
          <h3 className="titre-section">{t('Wagonnets vers le marché')}</h3>
          <PanneauTrajets arrivee="marche" onReglerTrajet={onReglerTrajet} />
        </>
      )}

      {/* (25/10) Les prix du marché : ce que rapporte chaque minerai (avant, dans la mine). */}
      <h3 className="titre-section">{t('Prix du marché')}</h3>
      <ul className="prix-marche">
        {/* (26/10) avec les lingots et les bijoux, une fois la fonderie ou la joaillerie construite */}
        {LISTE_BLOCS.filter((bloc) => bloc === 'pierre' || blocsDuNiveau(etat.niveauMine).includes(bloc) || produitDUnAtelier(etat, bloc))
          .sort((a, b) => BLOCS[b].prix - BLOCS[a].prix)
          .map((bloc) => (
            <li key={bloc} className="etiquette prix-marche-ligne">
              <span aria-hidden="true">{BLOCS[bloc].emoji}</span> {t(BLOCS[bloc].nom)} <strong>{t('{prix} $', { prix: nombre(valeurDe({ [bloc]: 1 }, etat)) })}</strong>
            </li>
          ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Le forgeron (refait le 25/10) : la pioche en main (la réparer), la suivante (l'acheter), et
// celles qu'on a déjà (les reprendre). Une meilleure pioche double plus souvent les minerais
// qu'on casse en cliquant.
// ---------------------------------------------------------------------------

// « Fortune 20 % » : la chance de doubler un minerai.
function fortune(niveau: number): string {
  return t('Fortune {n} %', { n: Math.round(PIOCHES[niveau].doublement * 100) })
}

// La pioche en main : sa durabilité, et « Réparer » si elle est usée.
function PiocheEnMain() {
  const { etat } = useJeu()
  const pioche = PIOCHES[etat.niveauPioche]
  const usure = etat.pioches[pioche.niveau] ?? 0
  const reste = Math.max(0, pioche.durabilite - usure)
  const cassee = reste <= 0
  const cout = coutReparation(etat, pioche.niveau)
  return (
    <div className={`ligne-amelioration ligne-pioche ${cassee ? 'ligne-alerte' : ''}`}>
      <span className="pioche-icone" aria-hidden="true">
        {pioche.emoji}
      </span>
      <div className="ligne-amelioration-texte">
        <span className="ligne-amelioration-nom">
          {t('Pioche en {nom}', { nom: t(pioche.nom) })} <span className="etiquette etiquette-jaune">{fortune(pioche.niveau)}</span>
        </span>
        <Barre valeur={reste} max={pioche.durabilite} texte={cassee ? t('Cassée : 2 clics par bloc') : `${nombre(reste)} / ${nombre(pioche.durabilite)}`} couleur={cassee || reste < pioche.durabilite * 0.15 ? 'rouge' : 'vert'} />
      </div>
      {cout ? (
        <BoutonsAchat etat={etat} cout={cout} possible={peutReparer(etat, pioche.niveau)} action={(e) => reparer(e, pioche.niveau)} texte={`🔧 ${t('Réparer')}`} />
      ) : (
        <span className="etiquette etiquette-vert">✔ {t('Neuve')}</span>
      )}
    </div>
  )
}

export function PanneauPioches(_props: PropsPanneau) {
  const { etat, jouer } = useJeu()
  const suivante = PIOCHES[etat.meilleure + 1] ?? null
  const autres = PIOCHES.filter((p) => p.niveau in etat.pioches && p.niveau !== etat.niveauPioche)
  const verrouSuivante = suivante ? verrou(etat, 'pioches', suivante.niveau) : null
  return (
    <div className="panneau-bat">
      <h3 className="titre-section">{t('Ta pioche')}</h3>
      <PiocheEnMain />

      <h3 className="titre-section">{t('Nouvelle pioche')}</h3>
      <Amelioration
        icone={suivante?.emoji ?? PIOCHES[etat.meilleure].emoji}
        titre={suivante ? t('Pioche en {nom}', { nom: t(suivante.nom) }) : t('Pioche en {nom}', { nom: t(PIOCHES[etat.meilleure].nom) })}
        niveau={etat.meilleure + 1}
        niveauMax={PIOCHES.length}
        effet={
          suivante ? (
            <>
              {fortune(etat.meilleure)} → <strong>{fortune(suivante.niveau)}</strong>
            </>
          ) : (
            t('La meilleure pioche du jeu !')
          )
        }
        cout={suivante ? coutPioche(suivante.niveau) : null}
        verrou={verrouSuivante}
        possible={suivante !== null && peutAcheterPioche(etat, suivante.niveau)}
        action={(e) => (suivante ? acheterPioche(e, suivante.niveau) : [])}
        texte={t('Acheter')}
      />
      <p className="discret">{t('Fortune : la chance de doubler un minerai quand tu casses un bloc.')}</p>

      {autres.length > 0 && (
        <>
          <h3 className="titre-section">{t('Tes autres pioches')}</h3>
          <div className="liste-lignes">
            {autres.map((p) => {
              const reste = Math.max(0, p.durabilite - (etat.pioches[p.niveau] ?? 0))
              return (
                <div key={p.niveau} className="ligne-amelioration">
                  <span className="pioche-icone" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <span className="ligne-amelioration-texte">
                    <span className="ligne-amelioration-nom">{t('Pioche en {nom}', { nom: t(p.nom) })}</span>
                    <span className="ligne-amelioration-effet">
                      {fortune(p.niveau)} · {reste > 0 ? `${nombre(reste)} / ${nombre(p.durabilite)}` : t('cassée')}
                    </span>
                  </span>
                  <button className="btn btn-bleu btn-petit" onClick={() => jouer((e) => equiper(e, p.niveau))}>
                    {t('Prendre')}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// La foreuse : elle fore toute seule tant qu'elle a du charbon (pris dans le coffre de la mine),
// plus vite avec l'électricité. Son chariot se vend d'un clic.
// ---------------------------------------------------------------------------

type OngletForeuse = 'forage' | 'chariot' | 'ameliorer'

export function PanneauForeuse({ onReglerTrajet, onAllerAuPersonnel }: PropsPanneau) {
  const { etat, jouer } = useJeu()
  const foreuse = etat.foreuse
  const enMarche = foreuseEnMarche(etat)
  const plein = chariotPlein(etat)
  const [onglet, setOnglet] = useState<OngletForeuse>(plein ? 'chariot' : 'forage')
  const forage = prochainNiveauForage(etat)
  const chariot = prochainNiveauChariot(etat)
  const verrouForage = verrou(etat, 'forage', foreuse.niveauVitesse + 1)
  const verrouChariot = verrou(etat, 'chariot', foreuse.niveauChariot + 1)
  // Le charbon : ce qu'il y a dans le réservoir, ce qu'on peut y mettre (coffre de la mine).
  const charbonDedans = Math.ceil(secondesDeCharbon(etat) / SECONDES_PAR_CHARBON)
  const aMettre = Math.min(disponible(etat, 'charbon'), placeCharbonForeuse(etat))
  const blocs = [...new Set([...blocsDuNiveau(etat.niveauMine), ...(Object.keys(foreuse.chariot) as IdBloc[])])].sort((a, b) => BLOCS[b].prix - BLOCS[a].prix)

  return (
    <div className="panneau-bat">
      <OngletsPanneau
        onglets={[
          { id: 'forage', titre: `🔥 ${t('Charbon')}`, pastille: !enMarche && !plein ? '!' : null },
          { id: 'chariot', titre: `🛒 ${t('Chariot')}`, pastille: plein ? '!' : null },
          { id: 'ameliorer', titre: `⬆️ ${t('Améliorer')}`, pastille: peutAmeliorerForage(etat) || peutAmeliorerChariot(etat) ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      {/* (23/10) Le chariot du pousseur Foreuse → Marché ne suit pas ce qu'elle fore. */}
      <AlerteChariot analyse={analyseWagonnet(etat, 'foreuse-marche')} batiment={t('la foreuse')} onAllerAuPersonnel={onAllerAuPersonnel} />

      {onglet === 'forage' && (
        <>
          <CarteEtat
            icone="⚙️"
            titre={t('{n} blocs/s', { n: nombre(vitesseForage(etat), 2) })}
            etiquette={enMarche ? (foreuseAlimentee(etat) ? `⚡ ${t('En marche')}` : t('En marche')) : plein ? t('Chariot plein') : t('Plus de charbon')}
            ok={enMarche}
          >
            <span className="discret">{t('{n} blocs forés', { n: nombre(foreuse.blocsFores) })}</span>
          </CarteEtat>
          <Barre
            valeur={charbonDedans}
            max={Math.max(charbonDedans, charbonMaxForeuse(etat))}
            texte={`${BLOCS.charbon.emoji} ${nombre(charbonDedans)} / ${nombre(charbonMaxForeuse(etat))} · ${minutes(secondesDeCharbon(etat))}`}
            couleur="or"
          />
          <button className={`btn btn-jaune btn-large ${!enMarche && !plein && aMettre > 0 ? 'btn-attention' : ''}`} disabled={aMettre <= 0} onClick={() => jouer((e) => remplirForeuse(e, Infinity))}>
            🔥 {t('Remplir')} {aMettre > 0 && `· ${nombre(aMettre)} ${BLOCS.charbon.emoji}`}
          </button>
          <p className="discret">
            {placeCharbonForeuse(etat) === 0
              ? t('Réservoir plein.')
              : disponible(etat, 'charbon') === 0
                ? t('Plus de charbon dans le coffre de la mine.')
                : t('Le charbon est pris dans le coffre de la mine.')}
          </p>
          {plein && (
            <button className="btn btn-bleu" onClick={() => setOnglet('chariot')}>
              🛒 {t('Chariot plein : le vendre')}
            </button>
          )}
          <h3 className="titre-section">{t('Wagonnets')}</h3>
          <PanneauTrajets depart="foreuse" arrivee="foreuse" onReglerTrajet={onReglerTrajet} />
        </>
      )}

      {onglet === 'chariot' && (
        <StockMinerais
          titre={`🛒 ${t('Chariot')}`}
          contenu={foreuse.chariot}
          capacite={capaciteChariot(etat)}
          blocs={blocs}
          vendreTout={(e) => vendreChariot(e)}
          vendre={(bloc) => (e) => vendreChariot(e, { [bloc]: e.foreuse.chariot[bloc] ?? 0 })}
          aVendre={foreuse.chariot}
          textePlein={t('Plein : la foreuse s’arrête !')}
        />
      )}

      {onglet === 'ameliorer' && (
        <div className="liste-lignes">
          <Amelioration
            icone="⚙️"
            titre={t('Forage')}
            niveau={foreuse.niveauVitesse + 1}
            niveauMax={NIVEAUX_FORAGE.length}
            effet={
              forage ? (
                <>
                  {t('{n} blocs/s', { n: nombre(NIVEAUX_FORAGE[foreuse.niveauVitesse].vitesse, 1) })} → <strong>{t('{n} blocs/s', { n: nombre(forage.vitesse, 1) })}</strong>
                  <br />
                  {t('Réservoir')} {charbonMaxForeuse(etat)} → <strong>{forage.reservoir}</strong> {BLOCS.charbon.emoji}
                </>
              ) : (
                t('{n} blocs/s', { n: nombre(NIVEAUX_FORAGE[foreuse.niveauVitesse].vitesse, 1) })
              )
            }
            cout={forage?.cout ?? null}
            verrou={verrouForage}
            possible={peutAmeliorerForage(etat)}
            action={ameliorerForage}
          />
          <Amelioration
            icone="🛒"
            titre={t('Chariot')}
            niveau={foreuse.niveauChariot + 1}
            niveauMax={NIVEAUX_CHARIOT.length}
            effet={
              chariot ? (
                <>
                  {t('{n} places', { n: nombre(capaciteChariot(etat)) })} → <strong>{t('{n} places', { n: nombre(chariot.capacite) })}</strong>
                </>
              ) : (
                t('{n} places', { n: nombre(capaciteChariot(etat)) })
              )
            }
            cout={chariot?.cout ?? null}
            verrou={verrouChariot}
            possible={peutAmeliorerChariot(etat)}
            action={ameliorerChariot}
          />
        </div>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------
// Le générateur : on le remplit de redstone (du coffre de la mine), il accélère tout ce qui est
// dans son rayon (l'ascenseur de la mine, les wagonnets, la foreuse).
// ---------------------------------------------------------------------------

// Ce que le générateur alimente : une ligne par chose, avec ✔ ou ce qui ne va pas.
function Alimentes() {
  const { etat } = useJeu()
  const lignes: { cle: string; nom: string; ok: boolean; texte: string }[] = []
  lignes.push({
    cle: 'mine',
    nom: `${BATIMENTS.puits.emoji} ${t('Ascenseur de la mine')}`,
    ok: batimentDansLeRayon(etat, 'puits'),
    texte: batimentDansLeRayon(etat, 'puits') ? t('dans le rayon') : t('hors du rayon'),
  })
  if (batimentPose(etat.village, 'foreuse')) {
    lignes.push({ cle: 'foreuse', nom: `${BATIMENTS.foreuse.emoji} ${t('Foreuse')}`, ok: batimentDansLeRayon(etat, 'foreuse'), texte: batimentDansLeRayon(etat, 'foreuse') ? t('dans le rayon') : t('hors du rayon') })
  }
  // (26/10) Les ateliers : ils vont plus vite dans le rayon.
  for (const id of ['fonderie', 'joaillerie'] as const) {
    if (!batimentPose(etat.village, id)) continue
    const dedans = batimentDansLeRayon(etat, id)
    lignes.push({ cle: id, nom: `${BATIMENTS[id].emoji} ${t(BATIMENTS[id].nom)}`, ok: dedans, texte: dedans ? t('dans le rayon') : t('hors du rayon') })
  }
  for (const trajet of etat.trajets) {
    const ligne = ligneDe(etat, trajet.liaison)
    const dedans = ligne !== null && casesDansLeRayon(etat, ligne)
    const info = LIAISONS[trajet.liaison]
    lignes.push({
      cle: trajet.liaison,
      nom: `🛤️ ${t(BATIMENTS[info.depart].nom)} → ${t(BATIMENTS[info.arrivee].nom)}`,
      ok: trajetElectrique(etat, trajet.liaison) || dedans,
      texte: dedans ? t('dans le rayon') : t('rails hors du rayon'),
    })
  }
  return (
    <ul className="liste-alimentes">
      {lignes.map((l) => (
        <li key={l.cle}>
          <span>{l.nom}</span>
          <span className={`etiquette ${l.ok ? 'etiquette-vert' : ''}`}>
            {l.ok ? '✔' : '✖'} {l.texte}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function PanneauGenerateur(_props: PropsPanneau) {
  const { etat, jouer } = useJeu()
  const g = etat.generateur
  const enMarche = generateurEnMarche(etat)
  const prochain = prochainNiveauGenerateur(etat)
  const verrouGenerateur = verrou(etat, 'generateur', g.niveau + 1)
  const aMettre = Math.min(disponible(etat, 'redstone'), placeRedstoneGenerateur(etat))
  const [onglet, setOnglet] = useState<'courant' | 'ameliorer'>('courant')
  const [rayonVisible, setRayonVisible] = useState(rayonToujoursVisible)
  return (
    <div className="panneau-bat">
      <OngletsPanneau
        onglets={[
          { id: 'courant', titre: `⚡ ${t('Courant')}`, pastille: g.allume && !enMarche ? '!' : null },
          { id: 'ameliorer', titre: `⬆️ ${t('Améliorer')}`, pastille: prochain !== null && verrouGenerateur === null && peutPayer(etat, prochain.cout) ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />

      {onglet === 'courant' && (
        <>
          <CarteEtat icone="⚡" titre={t('{bonus} de vitesse', { bonus: boostGenerateur(etat) })} etiquette={enMarche ? t('Allumé') : !g.allume ? t('Éteint') : t('Plus de redstone')} ok={enMarche}>
            <span className="discret">{t('Rayon : {n} cases (le cercle jaune sur la carte)', { n: rayonGenerateur(etat) })}</span>
          </CarteEtat>
          {/* (26/10) Garder le cercle du rayon sur la carte, même le panneau fermé. */}
          <Interrupteur
            allume={rayonVisible}
            texte={t('Afficher le rayon sur la carte')}
            onBasculer={() => {
              montrerRayon(!rayonVisible)
              setRayonVisible(!rayonVisible)
            }}
          />
          <Barre valeur={g.carburant} max={Math.max(g.carburant, reserveMaxGenerateur(etat))} texte={`${BLOCS.redstone.emoji} ${minutes(g.carburant)} / ${minutes(reserveMaxGenerateur(etat))}`} couleur="rouge" />
          <div className="rangee">
            <button className={`btn btn-jaune rangee-grand ${g.allume && !enMarche && aMettre > 0 ? 'btn-attention' : ''}`} disabled={aMettre <= 0} onClick={() => jouer((e) => remplirGenerateur(e, Infinity))}>
              {BLOCS.redstone.emoji} {t('Remplir')} {aMettre > 0 && `· ${nombre(aMettre)}`}
            </button>
            <button className="btn btn-blanc" onClick={() => jouer(basculerGenerateur)}>
              {g.allume ? `⏸ ${t('Éteindre')}` : `▶ ${t('Allumer')}`}
            </button>
          </div>
          {disponible(etat, 'redstone') === 0 && <p className="discret">{t('Plus de redstone dans le coffre de la mine.')}</p>}

          <h3 className="titre-section">{t('Ce qu’il accélère')}</h3>
          <Alimentes />
          {ligneDe(etat, 'mine-generateur') === null && <p className="carte carte-creme astuce">💡 {t('Relie-le à la mine par des rails : un wagonnet lui apportera la redstone.')}</p>}
        </>
      )}

      {onglet === 'ameliorer' && (
        <Amelioration
          icone="⚡"
          titre={t('Générateur')}
          niveau={g.niveau + 1}
          niveauMax={NIVEAUX_GENERATEUR.length}
          effet={
            prochain ? (
              <>
                {t('Rayon')} {rayonGenerateur(etat)} → <strong>{t('{n} cases', { n: prochain.rayon })}</strong>
                <br />
                {t('Vitesse')} {boostGenerateur(etat)} → <strong>{texteBonusGenerateur(prochain.bonus)}</strong>
                <br />
                {t('Réserve')} {minutes(reserveMaxGenerateur(etat))} → <strong>{t('{n} min', { n: prochain.reserveMinutes })}</strong>
              </>
            ) : (
              `${t('Rayon {n}', { n: rayonGenerateur(etat) })} · ${boostGenerateur(etat)}`
            )
          }
          cout={prochain?.cout ?? null}
          verrou={verrouGenerateur}
          possible={prochain !== null && verrouGenerateur === null && peutPayer(etat, prochain.cout)}
          action={ameliorerGenerateur}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Les succès : une tuile par succès, en couleur quand il est obtenu.
// ---------------------------------------------------------------------------

export function PanneauSucces({ etat }: { etat: EtatJeu }) {
  const obtenus = SUCCES.filter((s) => etat.succes.includes(s.id)).length
  return (
    <div className="panneau-bat">
      <Barre valeur={obtenus} max={SUCCES.length} texte={t('{n} / {max} succès', { n: obtenus, max: SUCCES.length })} couleur="or" />
      <ul className="grille-succes">
        {SUCCES.map((s) => {
          const obtenu = etat.succes.includes(s.id)
          return (
            <li key={s.id} className={`carte succes ${obtenu ? 'succes-obtenu' : ''}`}>
              <span className="succes-icone" aria-hidden="true">
                {obtenu ? s.emoji : '🔒'}
              </span>
              <strong>{t(s.titre)}</strong>
              <span className="discret">{t(s.description)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

