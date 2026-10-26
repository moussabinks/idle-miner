// Les panneaux des deux ateliers (26/10, la grosse mise à jour des gemmes) :
//   - la FONDERIE (niveau 5 de la mine) fond le fer et l'or en lingots, en brûlant du charbon ;
//   - la JOAILLERIE (niveau 6) : ses joailliers taillent les gemmes en bijoux.
// Chaque panneau a trois onglets : le travail (ce que l'atelier accepte, « Apporter », le four ou
// les établis, les wagonnets), la réserve (ce qu'il a fabriqué, à vendre), et « Améliorer ».
// Aucune règle du jeu ici : on lit l'état et on appelle les actions de src/jeu/ateliers.ts.

import { useState } from 'react'
import {
  apporterAuAtelier,
  ameliorerAtelier,
  atelierDe,
  besoinCharbonFonderie,
  charbonMaxFonderie,
  fonderieEnMarche,
  gemmeEnCours,
  infoFonderie,
  infoJoaillerie,
  joailliers,
  joaillierAuTravail,
  joaillerieEnMarche,
  maxJoailliers,
  nbEntree,
  objetsAcceptes,
  peutAmeliorerAtelier,
  placeCharbonFonderie,
  placeEntree,
  placesAtelier,
  produitDe,
  remplirFonderie,
  sortiePleine,
  vendreSortie,
  vitesseFonderie,
  type IdAtelier,
} from '../jeu/ateliers'
import { BLOCS, LISTE_BLOCS, NIVEAUX_FONDERIE, NIVEAUX_JOAILLERIE, NIVEAUX_MINE, SECONDES_PAR_CHARBON_FONDERIE, type IdBloc } from '../jeu/donnees'
import { bijouxParMinute, prixEmbauche } from '../jeu/employes'
import { atelierAlimente } from '../jeu/generateur'
import { nombre, nomEmploye, t } from '../jeu/langue'
import { blocsDuNiveau } from '../jeu/mine'
import { disponible, garderDansLeCoffre, type EtatJeu } from '../jeu/mineur'
import { verrou } from '../jeu/niveaux'
import { analyseWagonnet } from '../jeu/production'
import { AlerteChariot } from './AlerteChariot'
import { Amelioration } from './Amelioration'
import { Barre } from './Barre'
import { useJeu } from './contexteJeu'
import { OngletsPanneau } from './OngletsPanneau'
import { PanneauTrajets } from './PanneauTrajets'
import { CarteEtat, type PropsPanneau } from './Panneaux'
import { StockMinerais } from './StockMinerais'

// « 8 min », « 1 h 05 » : le temps de four qui reste.
function minutes(secondes: number): string {
  const total = Math.round(secondes / 60)
  if (total < 60) return t('{n} min', { n: Math.max(1, total) })
  return t('{h} h {m}', { h: Math.floor(total / 60), m: String(total % 60).padStart(2, '0') })
}

// Le niveau de la mine où un minerai apparaît (pour « 🔒 Mine 7 » sur le diamant).
function niveauDuMinerai(bloc: IdBloc): number {
  return NIVEAUX_MINE.findIndex((n) => (n.poids[bloc] ?? 0) > 0) + 1
}

// Ce que le joueur peut apporter de ce minerai depuis le coffre (sans ce qu'il garde 📌).
function aApporter(etat: EtatJeu, id: IdAtelier, bloc: IdBloc): number {
  return Math.min(Math.max(0, disponible(etat, bloc) - garderDansLeCoffre(etat, bloc)), placeEntree(etat, id))
}

// Ce que l'atelier accepte : une ligne par minerai (« 🔩 Fer → ⬜ Lingot de fer »), combien en
// attendent à l'entrée, et « Apporter » (depuis le coffre de la mine). En dessous, ce qu'il refuse,
// grisé : on voit tout de suite quel minerai va où.
function CeQuIlAccepte({ id }: { id: IdAtelier }) {
  const { etat, jouer } = useJeu()
  const atelier = atelierDe(etat, id)
  const duNiveau = blocsDuNiveau(etat.niveauMine)
  const acceptes = objetsAcceptes(id)
  const refuses = duNiveau.filter((bloc) => !acceptes.includes(bloc) && !(id === 'fonderie' && bloc === 'charbon'))
  return (
    <>
      <h3 className="titre-section">{id === 'fonderie' ? t('Ce qu’elle fond') : t('Ce qu’ils taillent')}</h3>
      <Barre valeur={nbEntree(etat, id)} max={placesAtelier(etat, id)} texte={t('Entrée : {n} / {max}', { n: nombre(nbEntree(etat, id)), max: nombre(placesAtelier(etat, id)) })} couleur="or" />
      <div className="liste-lignes">
        {acceptes.map((bloc) => {
          const produit = produitDe(id, bloc)
          const debloque = duNiveau.includes(bloc)
          const n = aApporter(etat, id, bloc)
          return (
            <div key={bloc} className={`ligne-amelioration ligne-accepte ${debloque ? '' : 'ligne-verrouillee'}`}>
              <span className="ligne-accepte-icones" aria-hidden="true">
                {BLOCS[bloc].emoji}
                <span className="ligne-accepte-fleche">→</span>
                {produit ? BLOCS[produit].emoji : ''}
              </span>
              <span className="ligne-amelioration-texte">
                <span className="ligne-amelioration-nom">
                  {t(BLOCS[bloc].nom)} → {produit ? t(BLOCS[produit].nom) : ''}
                </span>
                <span className="ligne-amelioration-effet">
                  {produit && t('{a} $ → {b} $', { a: nombre(BLOCS[bloc].prix), b: nombre(BLOCS[produit].prix) })} · {t('{n} à l’entrée', { n: nombre(atelier.entree[bloc] ?? 0) })}
                </span>
              </span>
              {debloque ? (
                <button className="btn btn-jaune btn-petit" disabled={n <= 0} onClick={() => jouer((e) => apporterAuAtelier(e, id, bloc))}>
                  <span>📦 {t('Apporter')}</span>
                  {n > 0 && <span className="prix">{nombre(n)}</span>}
                </button>
              ) : (
                <span className="verrou">🔒 🕳️ {t('Mine {n}', { n: niveauDuMinerai(bloc) })}</span>
              )}
            </div>
          )
        })}
      </div>
      {refuses.length > 0 && (
        <p className="ligne-refuses">
          <span className="etiquette">✖ {t('Refusé ici')}</span>
          <span className="ligne-refuses-icones" aria-label={refuses.map((bloc) => t(BLOCS[bloc].nom)).join(', ')}>
            {refuses.map((bloc) => (
              <span key={bloc}>{BLOCS[bloc].emoji}</span>
            ))}
          </span>
        </p>
      )}
      <p className="discret">{t('« Apporter » prend dans le coffre de la mine (sauf ce que tu gardes 📌). Avec des rails, un wagonnet l’apporte tout seul.')}</p>
    </>
  )
}

// La réserve : ce que l'atelier a fabriqué, à vendre d'un clic (ou un wagonnet l'emmène au marché).
function Reserve({ id }: { id: IdAtelier }) {
  const { etat } = useJeu()
  const atelier = atelierDe(etat, id)
  const produits = LISTE_BLOCS.filter((bloc) => BLOCS[bloc].sorte === (id === 'fonderie' ? 'lingot' : 'bijou')).sort((a, b) => BLOCS[b].prix - BLOCS[a].prix)
  return (
    <>
      <StockMinerais
        titre={id === 'fonderie' ? `🟨 ${t('Lingots')}` : `💍 ${t('Bijoux')}`}
        contenu={atelier.sortie}
        capacite={placesAtelier(etat, id)}
        blocs={produits}
        vendreTout={(e) => vendreSortie(e, id)}
        vendre={(bloc) => (e) => vendreSortie(e, id, { [bloc]: atelierDe(e, id).sortie[bloc] ?? 0 })}
        aVendre={atelier.sortie}
        textePlein={id === 'fonderie' ? t('Plein : la fonderie s’arrête !') : t('Plein : les joailliers s’arrêtent !')}
      />
    </>
  )
}

type OngletAtelier = 'travail' | 'reserve' | 'ameliorer'

// ---------------------------------------------------------------------------
// La fonderie
// ---------------------------------------------------------------------------

export function PanneauFonderie({ onReglerTrajet, onAllerAuPersonnel }: PropsPanneau) {
  const { etat, jouer } = useJeu()
  const f = etat.fonderie
  const enMarche = fonderieEnMarche(etat)
  const plein = sortiePleine(etat, 'fonderie')
  const sansCharbon = besoinCharbonFonderie(etat)
  const [onglet, setOnglet] = useState<OngletAtelier>(plein ? 'reserve' : 'travail')
  const prochain = NIVEAUX_FONDERIE[f.niveau + 1] ?? null
  const info = infoFonderie(etat)
  const charbonDedans = Math.ceil(f.carburant / SECONDES_PAR_CHARBON_FONDERIE)
  const aMettre = Math.min(disponible(etat, 'charbon'), placeCharbonFonderie(etat))
  const etiquette = enMarche ? (atelierAlimente(etat, 'fonderie') ? `⚡ ${t('En marche')}` : t('En marche')) : plein ? t('Réserve pleine') : sansCharbon ? t('Plus de charbon') : t('Rien à fondre')

  return (
    <div className="panneau-bat">
      <OngletsPanneau
        onglets={[
          { id: 'travail', titre: `🔥 ${t('Four')}`, pastille: sansCharbon ? '!' : null },
          { id: 'reserve', titre: `🟨 ${t('Lingots')}`, pastille: plein ? '!' : null },
          { id: 'ameliorer', titre: `⬆️ ${t('Améliorer')}`, pastille: peutAmeliorerAtelier(etat, 'fonderie') ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      <AlerteChariot analyse={analyseWagonnet(etat, 'fonderie-marche')} batiment={t('la fonderie')} onAllerAuPersonnel={onAllerAuPersonnel} />

      {onglet === 'travail' && (
        <>
          <CarteEtat icone="🏭" titre={t('{n} lingots/s', { n: nombre(vitesseFonderie(etat), 2) })} etiquette={etiquette} ok={enMarche}>
            <span className="discret">{t('{n} lingots fondus', { n: nombre(f.fabriques) })}</span>
          </CarteEtat>
          <Barre
            valeur={charbonDedans}
            max={Math.max(charbonDedans, charbonMaxFonderie(etat))}
            texte={`${BLOCS.charbon.emoji} ${nombre(charbonDedans)} / ${nombre(charbonMaxFonderie(etat))} · ${minutes(f.carburant)}`}
            couleur="or"
          />
          <button className={`btn btn-jaune btn-large ${sansCharbon && aMettre > 0 ? 'btn-attention' : ''}`} disabled={aMettre <= 0} onClick={() => jouer(remplirFonderie)}>
            🔥 {t('Remplir le four')} {aMettre > 0 && `· ${nombre(aMettre)} ${BLOCS.charbon.emoji}`}
          </button>
          <p className="discret">{t('1 charbon = {n} secondes de four. Le four ne brûle que quand il fond.', { n: SECONDES_PAR_CHARBON_FONDERIE })}</p>
          {plein && (
            <button className="btn btn-bleu" onClick={() => setOnglet('reserve')}>
              🟨 {t('Réserve pleine : vendre les lingots')}
            </button>
          )}
          <CeQuIlAccepte id="fonderie" />
          <h3 className="titre-section">{t('Wagonnets')}</h3>
          <PanneauTrajets depart="fonderie" arrivee="fonderie" onReglerTrajet={onReglerTrajet} />
        </>
      )}

      {onglet === 'reserve' && <Reserve id="fonderie" />}

      {onglet === 'ameliorer' && (
        <Amelioration
          icone="🏭"
          titre={t('Fonderie')}
          niveau={f.niveau + 1}
          niveauMax={NIVEAUX_FONDERIE.length}
          effet={
            prochain ? (
              <>
                {t('{n} lingots/s', { n: nombre(info.vitesse, 1) })} → <strong>{t('{n} lingots/s', { n: nombre(prochain.vitesse, 1) })}</strong>
                <br />
                {t('{n} places', { n: info.stock })} → <strong>{t('{n} places', { n: prochain.stock })}</strong>
                <br />
                {t('Four')} {info.reservoir} → <strong>{prochain.reservoir}</strong> {BLOCS.charbon.emoji}
              </>
            ) : (
              t('{n} lingots/s', { n: nombre(info.vitesse, 1) })
            )
          }
          cout={prochain?.cout ?? null}
          verrou={verrou(etat, 'fonderie', f.niveau + 1)}
          possible={peutAmeliorerAtelier(etat, 'fonderie')}
          action={(e) => ameliorerAtelier(e, 'fonderie')}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// La joaillerie
// ---------------------------------------------------------------------------

// Les établis : un par place, avec son joaillier (ce qu'il taille, où il en est) ou « libre ».
function Etablis({ onAllerAuPersonnel }: { onAllerAuPersonnel?: () => void }) {
  const { etat } = useJeu()
  const liste = joailliers(etat)
  const libres = Math.max(0, maxJoailliers(etat) - liste.length)
  return (
    <>
      <h3 className="titre-section">{t('Établis {n} / {max}', { n: liste.length, max: maxJoailliers(etat) })}</h3>
      <div className="liste-lignes">
        {liste.map((e) => {
          const gemme = gemmeEnCours(e)
          const auTravail = joaillierAuTravail(e)
          return (
            <div key={e.nom} className={`ligne-amelioration ${e.tempsPaye > 0 ? '' : 'ligne-alerte'}`}>
              <span className="ligne-accepte-icones" aria-hidden="true">
                {gemme ? BLOCS[gemme].emoji : '💍'}
              </span>
              <span className="ligne-amelioration-texte">
                <span className="ligne-amelioration-nom">
                  {nomEmploye(e.nom)} <span className={`etiquette rarete-${e.rarete}`}>{t('{n} bijoux/min', { n: nombre(bijouxParMinute(etat, e), 1) })}</span>
                </span>
                {gemme && auTravail ? (
                  <Barre valeur={e.progression} max={1} texte={t('Taille : {nom}', { nom: t(BLOCS[gemme].nom).toLowerCase() })} couleur="vert" />
                ) : (
                  <span className="ligne-amelioration-effet">{e.tempsPaye <= 0 ? `😠 ${t('Pas payé')}` : !auTravail ? t('Il arrive à son établi.') : t('Il attend une gemme.')}</span>
                )}
              </span>
            </div>
          )
        })}
        {libres > 0 && (
          <div className="carte carte-creme appel-joaillier">
            <strong>
              💍 {libres > 1 ? t('{n} établis libres', { n: libres }) : t('1 établi libre')}
            </strong>
            <p className="discret">{t('Embauche un joaillier au Personnel : un joaillier rare taille plus vite.')}</p>
            {onAllerAuPersonnel && (
              <button className={`btn btn-bleu ${liste.length === 0 ? 'btn-attention' : ''}`} onClick={onAllerAuPersonnel}>
                👷 {t('Aller au Personnel')}
                {prixEmbauche(etat, 'joaillier') !== null && <span className="prix">{nombre(prixEmbauche(etat, 'joaillier') ?? 0)} $</span>}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export function PanneauJoaillerie({ onReglerTrajet, onAllerAuPersonnel }: PropsPanneau) {
  const { etat } = useJeu()
  const j = etat.joaillerie
  const plein = sortiePleine(etat, 'joaillerie')
  const enMarche = joaillerieEnMarche(etat)
  const personne = !joailliers(etat).some((e) => e.tempsPaye > 0)
  const [onglet, setOnglet] = useState<OngletAtelier>(plein ? 'reserve' : 'travail')
  const prochain = NIVEAUX_JOAILLERIE[j.niveau + 1] ?? null
  const info = infoJoaillerie(etat)
  const parMinute = joailliers(etat)
    .filter(joaillierAuTravail)
    .reduce((total, e) => total + bijouxParMinute(etat, e), 0)
  const etiquette = enMarche ? (atelierAlimente(etat, 'joaillerie') ? `⚡ ${t('Au travail')}` : t('Au travail')) : plein ? t('Réserve pleine') : personne ? t('Pas de joaillier') : t('Rien à tailler')

  return (
    <div className="panneau-bat">
      <OngletsPanneau
        onglets={[
          { id: 'travail', titre: `🔨 ${t('Établis')}`, pastille: personne ? '!' : null },
          { id: 'reserve', titre: `💍 ${t('Bijoux')}`, pastille: plein ? '!' : null },
          { id: 'ameliorer', titre: `⬆️ ${t('Améliorer')}`, pastille: peutAmeliorerAtelier(etat, 'joaillerie') ? '!' : null },
        ]}
        actif={onglet}
        onChoisir={setOnglet}
      />
      <AlerteChariot analyse={analyseWagonnet(etat, 'joaillerie-marche')} batiment={t('la joaillerie')} onAllerAuPersonnel={onAllerAuPersonnel} />

      {onglet === 'travail' && (
        <>
          <CarteEtat icone="💍" titre={t('{n} bijoux/min', { n: nombre(parMinute, 1) })} etiquette={etiquette} ok={enMarche}>
            <span className="discret">{t('{n} bijoux taillés', { n: nombre(j.fabriques) })}</span>
          </CarteEtat>
          {plein && (
            <button className="btn btn-bleu" onClick={() => setOnglet('reserve')}>
              💍 {t('Réserve pleine : vendre les bijoux')}
            </button>
          )}
          <Etablis onAllerAuPersonnel={onAllerAuPersonnel} />
          <CeQuIlAccepte id="joaillerie" />
          <h3 className="titre-section">{t('Wagonnets')}</h3>
          <PanneauTrajets depart="joaillerie" arrivee="joaillerie" onReglerTrajet={onReglerTrajet} />
        </>
      )}

      {onglet === 'reserve' && <Reserve id="joaillerie" />}

      {onglet === 'ameliorer' && (
        <Amelioration
          icone="🏪"
          titre={t('Joaillerie')}
          niveau={j.niveau + 1}
          niveauMax={NIVEAUX_JOAILLERIE.length}
          effet={
            prochain ? (
              <>
                {t('Établis')} {info.etablis} → <strong>{prochain.etablis}</strong>
                <br />
                {t('Outils')} ×{nombre(info.vitesse, 2)} → <strong>×{nombre(prochain.vitesse, 2)}</strong>
                <br />
                {t('{n} places', { n: info.stock })} → <strong>{t('{n} places', { n: prochain.stock })}</strong>
              </>
            ) : (
              `${t('Établis')} ${info.etablis} · ${t('Outils')} ×${nombre(info.vitesse, 2)}`
            )
          }
          cout={prochain?.cout ?? null}
          verrou={verrou(etat, 'joaillerie', j.niveau + 1)}
          possible={peutAmeliorerAtelier(etat, 'joaillerie')}
          action={(e) => ameliorerAtelier(e, 'joaillerie')}
        />
      )}
    </div>
  )
}
