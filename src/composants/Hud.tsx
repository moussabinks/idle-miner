// Le bandeau du haut : argent, profondeur, pioche, sac, seaux...

import { LISTE_ENCHANTEMENTS, ENCHANTEMENTS, zoneDe } from '../jeu/donnees'
import {
  aLaSurface,
  auFond,
  chiffreRomain,
  durabiliteRestante,
  estCassee,
  nbDansSac,
  piocheEquipee,
  sacPlein,
  tailleSac,
  type EtatJeu,
} from '../jeu/mineur'
import { useState } from 'react'
import { revenuParSeconde } from '../jeu/revenu'
import { pointsDisponibles } from '../jeu/talents'
import { useCompteur } from '../useCompteur'
import { basculerMusique, musiqueActive } from '../ambiance'
import { basculerSon, sonActif } from '../sons'
import { Barre } from './Barre'

type Props = {
  etat: EtatJeu
  nbVentes: number // change à chaque vente, pour faire sauter le compteur d'argent
  enMinage: boolean // tu es en train de creuser (pour le calcul du $/s)
  onOuvrirArbre: () => void
}

// « 0,8 $/s », « 12 $/s », « 1 250 $/s » (négatif si les salaires coûtent plus que ce qui rentre).
function texteRevenu(parSeconde: number): string {
  const arrondi = Math.abs(parSeconde) < 10 ? Math.round(parSeconde * 10) / 10 : Math.round(parSeconde)
  return `${arrondi.toLocaleString('fr-FR')} $/s`
}

export function Hud({ etat, nbVentes, enMinage, onOuvrirArbre }: Props) {
  const [son, setSon] = useState(sonActif)
  const [musique, setMusique] = useState(musiqueActive)
  const points = pointsDisponibles(etat)
  const plein = sacPlein(etat)
  const pioche = piocheEquipee(etat)
  const cassee = estCassee(etat)
  const zone = zoneDe(etat.profondeur, etat.prestige)
  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const dansLaCabine = etat.ascenseur.passager
  const enchantements = LISTE_ENCHANTEMENTS.filter((id) => etat.enchantements[id] > 0)
  const revenu = revenuParSeconde(etat, enMinage)
  // Le compteur d'argent défile jusqu'à la nouvelle somme (plus satisfaisant qu'un saut).
  const argentAffiche = useCompteur(etat.argent)

  return (
    <header className="hud">
      <div className="hud-case hud-argent">
        <span
          className="hud-titre"
          title={`Argent généré par seconde (en moyenne) : toi ${texteRevenu(revenu.joueur)} · foreuse ${texteRevenu(revenu.foreuse)} · mineurs ${texteRevenu(revenu.mineurs)}`}
        >
          Argent <span className={`hud-revenu ${revenu.total > 0 ? 'hud-revenu-actif' : ''}`}>📈 {texteRevenu(revenu.total)}</span>
        </span>
        <strong key={nbVentes} className={nbVentes > 0 ? 'argent-saute' : ''}>
          💵 {argentAffiche.toLocaleString('fr-FR')} $
        </strong>
      </div>

      <div className="hud-case">
        <span className="hud-titre">
          {enVille ? `Mine : -${etat.profondeur} m` : auFront ? zone.nom : dansLaCabine ? "Dans l'ascenseur" : "Sur l'échelle"}
        </span>
        <strong key={auFront ? etat.profondeur : 'trajet'} className={auFront ? 'profondeur-saute' : ''}>
          {enVille ? '☀️ Village' : auFront ? `📏 -${etat.profondeur} m` : `${dansLaCabine ? '🛗' : '🪜'} -${Math.round(etat.position)} m`}
        </strong>
      </div>

      <div className="hud-case hud-pioche">
        <span className="hud-titre">
          {cassee ? '✋ Mains nues' : `${pioche.emoji} Pioche en ${pioche.nom}`}
        </span>
        <Barre
          valeur={durabiliteRestante(etat)}
          max={pioche.durabilite}
          texte={cassee ? 'Cassée !' : `${durabiliteRestante(etat)} / ${pioche.durabilite}`}
          couleur={cassee ? 'rouge' : 'vert'}
        />
        {/* Toujours présente (même vide) pour que le bandeau garde la même hauteur. */}
        <span className="hud-enchants">
          {enchantements.length > 0
            ? enchantements.map((id) => `${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])}`).join(' · ')
            : 'Aucun enchantement'}
        </span>
      </div>

      {/* Sac plein : la case clignote en rouge, pour qu'un nouveau joueur comprenne
          tout de suite pourquoi il ne peut plus creuser. */}
      <div className={`hud-case hud-sac ${plein ? 'hud-alerte' : ''}`}>
        <span className="hud-titre">{plein ? '🎒 Sac plein ! Vends ou envoie tes minerais' : '🎒 Sac'}</span>
        <Barre valeur={nbDansSac(etat)} max={tailleSac(etat)} texte={`${nbDansSac(etat)} / ${tailleSac(etat)}`} couleur={plein ? 'rouge' : 'or'} />
      </div>

      <div className="hud-case hud-petits">
        <span title="Seaux d'eau">🪣 {etat.seaux}</span>
        {etat.ascenseur.niveau > 0 && <span title="Niveau de l'ascenseur">🛗 {etat.ascenseur.niveau}</span>}
        {etat.prestige > 0 && (
          <button
            className={`hud-bouton ${points > 0 ? 'a-depenser' : ''}`}
            onClick={onOuvrirArbre}
            title={`Prestige ${etat.prestige} : ventes +${15 * etat.prestige} %, pioches +${10 * etat.prestige} % plus rapides. Clique pour ouvrir l'arbre de prestige.`}
          >
            ⭐ {etat.prestige}
            {points > 0 && ` · ${points} point${points > 1 ? 's' : ''} !`}
          </button>
        )}
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
