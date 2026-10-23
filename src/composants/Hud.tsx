// Le bandeau du haut, compact (23/10) : une rangée de petites cases arrondies, une par info utile.
//   ⭐ le niveau du joueur et son XP (29/10) ;
//   💵 l'argent et ce que la mine produit par seconde ;
//   📦 le coffre de la mine (avec le niveau de la mine en petit badge) ;
//   ⛏️ la pioche (sa durabilité) ;
//   🎒 le sac ;
//   et, s'il y en a, les mineurs et l'éclair des rails électriques.
// Le détail de chaque case est dans son info-bulle. Une case clignote en rouge quand il faut
// agir (coffre plein, pioche cassée, sac plein).

import { infoNiveauMine } from '../jeu/mine'
import { railsAlimentes } from '../jeu/wagonnet'
import { nbSansSalaire } from '../jeu/employes'
import { capaciteCoffre, coffrePlein, durabiliteRestante, estCassee, nbDansCoffre, nbDansSac, piocheEnMain, sacPlein, tailleSac, type EtatJeu } from '../jeu/mineur'
import { progressionNiveau, prochainDeblocage } from '../jeu/niveaux'
import { revenuParSeconde } from '../jeu/revenu'
import { useCompteur } from '../useCompteur'

type Props = {
  etat: EtatJeu
  nbVentes: number // change à chaque vente, pour faire sauter le compteur d'argent
  onOuvrirBilan?: () => void // (23/10) toucher l'argent ouvre le bilan (gains et salaires par minute)
}

// « 0,8/s », « 12/s », « 1 250/s ».
function texteRevenu(parSeconde: number): string {
  const arrondi = Math.abs(parSeconde) < 10 ? Math.round(parSeconde * 10) / 10 : Math.round(parSeconde)
  return `${arrondi > 0 ? '+' : ''}${arrondi.toLocaleString('fr-FR')}/s`
}

// « 950 », « 12,5 k », « 3,2 M » : les grands nombres en court.
function nombreCourt(n: number): string {
  const valeur = Math.floor(n)
  if (valeur < 10_000) return valeur.toLocaleString('fr-FR')
  if (valeur < 1_000_000) return `${(valeur / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`
  return `${(valeur / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M`
}

// Une petite jauge sous une valeur.
// « teinte » (30/10, la pioche) : la couleur va du rouge (0) au vert (120) selon ce qu'il reste.
function JaugeMini({ valeur, max, couleur, teinte }: { valeur: number; max: number; couleur: 'or' | 'vert' | 'rouge' | 'bleu' | 'violet'; teinte?: number }) {
  const pourcentage = max > 0 ? Math.min(100, (valeur / max) * 100) : 0
  const style = teinte === undefined ? { width: `${pourcentage}%` } : { width: `${pourcentage}%`, background: `hsl(${teinte} 78% 50%)` }
  return (
    <span className="jauge-mini" aria-hidden="true">
      <i className={`jauge-mini-${couleur}`} style={style} />
    </span>
  )
}

export function Hud({ etat, nbVentes, onOuvrirBilan }: Props) {
  const plein = sacPlein(etat)
  const coffreRempli = coffrePlein(etat)
  const pioche = piocheEnMain(etat)
  const cassee = estCassee(etat)
  const niveau = infoNiveauMine(etat.niveauMine)
  const revenu = revenuParSeconde(etat)
  const sansSalaire = nbSansSalaire(etat)
  // Le compteur d'argent défile jusqu'à la nouvelle somme (plus satisfaisant qu'un saut).
  const argentAffiche = useCompteur(Math.floor(etat.argent))

  const niveauJoueur = progressionNiveau(etat)
  const deblocage = prochainDeblocage(etat)

  return (
    <header className="bandeau">
      <div
        className="info-bandeau bandeau-niveau"
        title={`Niveau ${niveauJoueur.niveau}${niveauJoueur.pourSuivant ? ` · ${niveauJoueur.xp.toLocaleString('fr-FR')} / ${niveauJoueur.pourSuivant.toLocaleString('fr-FR')} XP pour le niveau ${niveauJoueur.niveau + 1}` : ' (maximum)'}${deblocage ? ` · au niveau ${deblocage.niveau} : ${deblocage.choses.join(', ')}` : ''}. Gagne de l'XP en cassant des blocs, en construisant, en posant des rails, en embauchant et en améliorant.`}
      >
        <span className="bandeau-icone">
          ⭐<b key={niveauJoueur.niveau} className="bandeau-badge badge-niveau">{niveauJoueur.niveau}</b>
        </span>
        <span className="bandeau-valeurs">
          <small>{niveauJoueur.pourSuivant ? `${niveauJoueur.xp}/${niveauJoueur.pourSuivant}` : 'Max'}</small>
          <JaugeMini valeur={niveauJoueur.xp} max={niveauJoueur.pourSuivant ?? 1} couleur="violet" />
        </span>
      </div>

      {/* (23/10) Un bouton : le toucher ouvre le bilan (ce qu'on gagne et ce qu'on paie). */}
      <button
        type="button"
        className="info-bandeau bandeau-argent bandeau-bouton"
        onClick={onOuvrirBilan}
        title={`Touche pour voir ton bilan · ce que ta mine produit par seconde (en moyenne, à vendre) : mine ${texteRevenu(revenu.mine)} · mineurs ${texteRevenu(revenu.mineurs)} · foreuse ${texteRevenu(revenu.foreuse)}`}
      >
        <span className="bandeau-icone">💵</span>
        <span className="bandeau-valeurs">
          <strong key={nbVentes} className={nbVentes > 0 ? 'argent-saute' : ''}>
            {nombreCourt(argentAffiche)} $
          </strong>
          <small className={revenu.total > 0 ? 'revenu-positif' : 'revenu-nul'}>{texteRevenu(revenu.total)}</small>
        </span>
        <span className="bandeau-loupe" aria-hidden="true">
          ›
        </span>
      </button>

      <div
        className={`info-bandeau ${coffreRempli ? 'bandeau-alerte' : ''}`}
        title={`Mine niveau ${etat.niveauMine} (${niveau.nom}) · coffre ${nbDansCoffre(etat)} / ${capaciteCoffre(etat)}${coffreRempli ? ' : plein, la mine s’arrête !' : ''}`}
      >
        <span className="bandeau-icone">
          📦<b className="bandeau-badge">{etat.niveauMine}</b>
        </span>
        <span className="bandeau-valeurs">
          <small>
            {nbDansCoffre(etat)}/{capaciteCoffre(etat)}
          </small>
          <JaugeMini valeur={nbDansCoffre(etat)} max={capaciteCoffre(etat)} couleur={coffreRempli ? 'rouge' : 'or'} />
        </span>
      </div>

      {/* (23/10) Cassée : la case tremble à chaque clic (la clé change), pour prévenir. */}
      <div
        key={cassee ? etat.stats.blocsCasses * 2 + etat.clics : 'pioche'}
        className={`info-bandeau ${cassee || durabiliteRestante(etat) < pioche.durabilite * 0.15 ? 'bandeau-alerte' : ''} ${cassee ? 'bandeau-pioche-cassee' : ''}`}
        title={cassee ? `Pioche en ${pioche.nom} cassée : 2 clics par bloc, fais-la réparer au forgeron` : `Pioche en ${pioche.nom} : ${Math.round(pioche.doublement * 100)} % de doubler un minerai`}
      >
        <span className="bandeau-icone">{cassee ? '💥' : '⛏️'}</span>
        <span className="bandeau-valeurs">
          <small>{cassee ? 'Cassée' : `${durabiliteRestante(etat)}/${pioche.durabilite}`}</small>
          <JaugeMini valeur={durabiliteRestante(etat)} max={pioche.durabilite} couleur={cassee ? 'rouge' : 'vert'} teinte={Math.round((durabiliteRestante(etat) / pioche.durabilite) * 120)} />
        </span>
      </div>

      <div className={`info-bandeau ${plein ? 'bandeau-alerte' : ''}`} title={plein ? 'Sac plein : va vendre au marché !' : 'Ton sac à dos'}>
        <span className="bandeau-icone">🎒</span>
        <span className="bandeau-valeurs">
          <small>
            {nbDansSac(etat)}/{tailleSac(etat)}
          </small>
          <JaugeMini valeur={nbDansSac(etat)} max={tailleSac(etat)} couleur={plein ? 'rouge' : 'bleu'} />
        </span>
      </div>

      {(etat.employes.length > 0 || railsAlimentes(etat)) && (
        <div className={`info-bandeau bandeau-petite ${sansSalaire > 0 ? 'bandeau-alerte' : ''}`} title={sansSalaire > 0 ? `${sansSalaire} mineur(s) sans salaire !` : 'Tes mineurs, et ⚡ si les rails sont électriques'}>
          {etat.employes.length > 0 && (
            <span>
              {sansSalaire > 0 ? '😠' : '👷'}
              <strong>{etat.employes.length}</strong>
            </span>
          )}
          {railsAlimentes(etat) && <span className="eclair-actif">⚡</span>}
        </div>
      )}
    </header>
  )
}
