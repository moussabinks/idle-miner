// Le bandeau du haut : argent, mine (niveau et coffre), pioche, sac...

import { useState } from 'react'
import { infoNiveauMine } from '../jeu/mine'
import { railsAlimentes } from '../jeu/generateur'
import { capaciteCoffre, coffrePlein, durabiliteRestante, estCassee, nbDansCoffre, nbDansSac, piocheEnMain, sacPlein, tailleSac, type EtatJeu } from '../jeu/mineur'
import { revenuParSeconde } from '../jeu/revenu'
import { useCompteur } from '../useCompteur'
import { basculerMusique, musiqueActive } from '../ambiance'
import { basculerSon, sonActif } from '../sons'
import { Barre } from './Barre'

type Props = {
  etat: EtatJeu
  nbVentes: number // change à chaque vente, pour faire sauter le compteur d'argent
}

// « 0,8 $/s », « 12 $/s », « 1 250 $/s » (négatif si les salaires coûtent plus que ce qui rentre).
function texteRevenu(parSeconde: number): string {
  const arrondi = Math.abs(parSeconde) < 10 ? Math.round(parSeconde * 10) / 10 : Math.round(parSeconde)
  return `${arrondi.toLocaleString('fr-FR')} $/s`
}

export function Hud({ etat, nbVentes }: Props) {
  const [son, setSon] = useState(sonActif)
  const [musique, setMusique] = useState(musiqueActive)
  const plein = sacPlein(etat)
  const coffreRempli = coffrePlein(etat)
  const pioche = piocheEnMain(etat)
  const cassee = estCassee(etat)
  const niveau = infoNiveauMine(etat.niveauMine)
  const revenu = revenuParSeconde(etat)
  // Le compteur d'argent défile jusqu'à la nouvelle somme (plus satisfaisant qu'un saut).
  const argentAffiche = useCompteur(Math.floor(etat.argent))

  return (
    <header className="hud">
      <div className="hud-case hud-argent">
        <span
          className="hud-titre"
          title={`Ce que ta mine produit par seconde (en moyenne, à vendre) : mine ${texteRevenu(revenu.mine)} · mineurs ${texteRevenu(revenu.mineurs)} · foreuse ${texteRevenu(revenu.foreuse)}`}
        >
          Argent <span className={`hud-revenu ${revenu.total > 0 ? 'hud-revenu-actif' : ''}`}>📈 {texteRevenu(revenu.total)}</span>
        </span>
        <strong key={nbVentes} className={nbVentes > 0 ? 'argent-saute' : ''}>
          💵 {argentAffiche.toLocaleString('fr-FR')} $
        </strong>
      </div>

      {/* La mine : son niveau, et le coffre (il clignote quand il est plein : la mine s'arrête). */}
      <div className={`hud-case hud-sac ${coffreRempli ? 'hud-alerte' : ''}`}>
        <span className="hud-titre">{coffreRempli ? '📦 Coffre plein ! Va vendre' : `🕳️ Mine niv. ${etat.niveauMine} · ${niveau.nom}`}</span>
        <Barre
          valeur={nbDansCoffre(etat)}
          max={capaciteCoffre(etat)}
          texte={`📦 ${nbDansCoffre(etat)} / ${capaciteCoffre(etat)}`}
          couleur={coffreRempli ? 'rouge' : 'or'}
        />
      </div>

      <div className="hud-case hud-pioche">
        <span className="hud-titre">{cassee ? '💥 Pioche cassée (2 clics par bloc)' : `${pioche.emoji} Pioche en ${pioche.nom}`}</span>
        <Barre
          valeur={durabiliteRestante(etat)}
          max={pioche.durabilite}
          texte={cassee ? 'Cassée !' : `${durabiliteRestante(etat)} / ${pioche.durabilite}`}
          couleur={cassee ? 'rouge' : 'vert'}
        />
      </div>

      {/* Sac plein : la case clignote en rouge. */}
      <div className={`hud-case hud-sac ${plein ? 'hud-alerte' : ''}`}>
        <span className="hud-titre">{plein ? '🎒 Sac plein ! Va vendre au marché' : '🎒 Sac'}</span>
        <Barre valeur={nbDansSac(etat)} max={tailleSac(etat)} texte={`${nbDansSac(etat)} / ${tailleSac(etat)}`} couleur={plein ? 'rouge' : 'or'} />
      </div>

      <div className="hud-case hud-petits">
        {etat.employes.length > 0 && <span title="Tes mineurs">👷 {etat.employes.length}</span>}
        {railsAlimentes(etat) && <span title="Les rails sont électriques : le wagonnet roule tout seul">⚡</span>}
        <button className="hud-bouton" onClick={() => setSon(basculerSon())} title={son ? 'Couper le son' : 'Remettre le son'} aria-label={son ? 'Couper le son' : 'Remettre le son'}>
          {son ? '🔊' : '🔇'}
        </button>
        <button
          className={`hud-bouton ${musique ? '' : 'hud-bouton-coupe'}`}
          onClick={() => setMusique(basculerMusique())}
          title={musique ? 'Couper la musique et les ambiances' : 'Remettre la musique et les ambiances'}
          aria-label={musique ? 'Couper la musique et les ambiances' : 'Remettre la musique et les ambiances'}
        >
          🎵
        </button>
      </div>
    </header>
  )
}
