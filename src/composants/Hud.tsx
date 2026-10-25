// Le bandeau du haut (25/10, nouveau style) : des pastilles sombres au gros contour, comme le
// « portefeuille » du jeu d'inspiration. Seulement l'essentiel, et chaque case apparaît quand
// elle sert (le nouveau joueur ne voit que l'argent et le coffre) :
//   ⭐ le niveau du joueur et son XP ;
//   💵 l'argent et ce que tout produit par seconde (le toucher ouvre le bilan) ;
//   💎 les gemmes (le toucher ouvre la boutique des gemmes) ;
//   📦 le coffre de la mine, avec le niveau de la mine (le palier) ;
//   👷 les employés et le prochain salaire (ou le manager), quand on en a ;
//   et dessous, les bonus de la boutique en cours, avec leur temps.

import { BOOSTS, LISTE_BOOSTS, secondesBoost } from '../jeu/gemmes'
import { nombre, t } from '../jeu/langue'
import { managerEndormi, managerPaieLesSalaires, nbSansSalaire, secondesAvantSommeil, tempsPayeMin } from '../jeu/employes'
import { capaciteCoffre, coffrePlein, nbDansCoffre, type EtatJeu } from '../jeu/mineur'
import { progressionNiveau } from '../jeu/niveaux'
import { revenuParSeconde } from '../jeu/revenu'
import { etapeTutoriel } from '../jeu/tutoriel'
import { minutesSecondes, nombreAbrege } from '../nombres'
import { useCompteur } from '../useCompteur'

type Props = {
  etat: EtatJeu
  nbVentes: number // change à chaque vente, pour faire sauter le compteur d'argent
  onOuvrirBilan: () => void
  onOuvrirBoutique: () => void
}

// « +0,8/s », « +12/s ».
function texteRevenu(parSeconde: number): string {
  const arrondi = Math.abs(parSeconde) < 10 ? Math.round(parSeconde * 10) / 10 : Math.round(parSeconde)
  return `${arrondi > 0 ? '+' : ''}${nombre(arrondi, 1)}/s`
}

export function Hud({ etat, nbVentes, onOuvrirBilan, onOuvrirBoutique }: Props) {
  const argentAffiche = useCompteur(Math.floor(etat.argent))
  const niveau = progressionNiveau(etat)
  const revenu = revenuParSeconde(etat)
  const plein = coffrePlein(etat)
  const coffre = nbDansCoffre(etat)
  const capacite = capaciteCoffre(etat)
  const sansSalaire = nbSansSalaire(etat)
  const dort = managerEndormi(etat)
  const manager = managerPaieLesSalaires(etat)
  // Les gemmes n'apparaissent qu'après le tutoriel (le nouveau joueur a assez à regarder).
  const avecGemmes = etapeTutoriel(etat) === null || etat.gemmes > 0
  const boosts = LISTE_BOOSTS.filter((id) => secondesBoost(etat, id) > 0)

  return (
    <header className="hud">
      <div className="hud-ligne">
        <div className="hud-case hud-niveau" title={t('Niveau {n} · gagne de l’XP en creusant, en construisant et en améliorant', { n: niveau.niveau })}>
          <span className="hud-medaille">{niveau.niveau}</span>
          <span className="jauge jauge-violet hud-jauge" aria-hidden="true">
            <i style={{ width: `${niveau.pourSuivant ? Math.min(100, (niveau.xp / niveau.pourSuivant) * 100) : 100}%` }} />
          </span>
        </div>

        <button type="button" className="hud-case hud-bouton" onClick={onOuvrirBilan} title={t('Ton bilan : ce que tu gagnes et ce que tu paies')}>
          <span className="hud-icone" aria-hidden="true">
            💵
          </span>
          <span className="hud-valeurs">
            <strong key={nbVentes} className={nbVentes > 0 ? 'hud-saute' : ''}>
              {nombreAbrege(argentAffiche)} $
            </strong>
            <small className={revenu.total > 0 ? 'hud-positif' : ''}>{texteRevenu(revenu.total)}</small>
          </span>
        </button>

        {avecGemmes && (
          <button type="button" className="hud-case hud-bouton hud-gemmes" onClick={onOuvrirBoutique} title={t('Tes gemmes : la boutique')}>
            <span className="hud-icone" aria-hidden="true">
              💎
            </span>
            <strong>{nombre(etat.gemmes)}</strong>
            <span className="hud-plus" aria-hidden="true">
              +
            </span>
          </button>
        )}

        <div className={`hud-case ${plein ? 'hud-alerte' : ''}`} title={t('Le coffre de la mine (mine niveau {n})', { n: etat.niveauMine })}>
          <span className="hud-icone" aria-hidden="true">
            📦<b className="hud-badge">{etat.niveauMine}</b>
          </span>
          <span className="hud-valeurs">
            <small>
              {nombreAbrege(coffre)}/{nombreAbrege(capacite)}
            </small>
            <span className={`jauge ${plein ? 'jauge-rose' : 'jauge-jaune'} hud-jauge`} aria-hidden="true">
              <i style={{ width: `${Math.min(100, (coffre / Math.max(1, capacite)) * 100)}%` }} />
            </span>
          </span>
        </div>

        {etat.employes.length > 0 && (
          <div
            className={`hud-case ${sansSalaire > 0 || dort ? 'hud-alerte' : ''}`}
            title={sansSalaire > 0 ? t('Des employés attendent leur salaire !') : dort ? t('Ton manager dort : réveille-le au Personnel') : manager ? t('Le manager paie les salaires') : t('Prochain salaire à payer')}
          >
            <span className="hud-icone" aria-hidden="true">
              {sansSalaire > 0 ? '😠' : '👷'}
            </span>
            <strong>{etat.employes.length}</strong>
            <small className="hud-minuteur">{dort ? '💤' : sansSalaire > 0 ? t('Payer !') : `${manager ? '💼' : '⏳'} ${minutesSecondes(manager ? secondesAvantSommeil(etat) : tempsPayeMin(etat))}`}</small>
          </div>
        )}
      </div>

      {boosts.length > 0 && (
        <div className="hud-ligne hud-boosts">
          {boosts.map((id) => (
            <span key={id} className="etiquette etiquette-violet" title={BOOSTS[id].description}>
              {BOOSTS[id].emoji} {t(BOOSTS[id].nom)} · {minutesSecondes(secondesBoost(etat, id))}
            </span>
          ))}
        </div>
      )}
    </header>
  )
}
