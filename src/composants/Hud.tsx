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
  tailleSac,
  vitesse,
  type EtatJeu,
} from '../jeu/mineur'
import { useState } from 'react'
import { pointsDisponibles } from '../jeu/talents'
import { basculerSon, sonActif } from '../sons'
import { Barre } from './Barre'

type Props = {
  etat: EtatJeu
  nbVentes: number // change à chaque vente, pour faire sauter le compteur d'argent
  onOuvrirArbre: () => void
}

export function Hud({ etat, nbVentes, onOuvrirArbre }: Props) {
  const [son, setSon] = useState(sonActif)
  const points = pointsDisponibles(etat)
  const pioche = piocheEquipee(etat)
  const cassee = estCassee(etat)
  const zone = zoneDe(etat.profondeur)
  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const dansLaCabine = etat.ascenseur.passager
  const enchantements = LISTE_ENCHANTEMENTS.filter((id) => etat.enchantements[id] > 0)

  return (
    <header className="hud">
      <div className="hud-case hud-argent">
        <span className="hud-titre">Argent</span>
        <strong key={nbVentes} className={nbVentes > 0 ? 'argent-saute' : ''}>
          💵 {etat.argent.toLocaleString('fr-FR')} $
        </strong>
      </div>

      <div className="hud-case">
        <span className="hud-titre">
          {enVille ? `Front à -${etat.profondeur} m` : auFront ? zone.nom : dansLaCabine ? "Dans l'ascenseur" : "Sur l'échelle"}
        </span>
        <strong>
          {enVille ? '☀️ Village' : auFront ? `📏 -${etat.profondeur} m` : `${dansLaCabine ? '🛗' : '🪜'} -${Math.round(etat.position)} m`}
        </strong>
      </div>

      <div className="hud-case hud-pioche">
        <span className="hud-titre">
          {cassee ? '✋ Mains nues' : `${pioche.emoji} Pioche en ${pioche.nom}`} · x{vitesse(etat).toLocaleString('fr-FR')}
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

      <div className="hud-case hud-sac">
        <span className="hud-titre">🎒 Sac</span>
        <Barre valeur={nbDansSac(etat)} max={tailleSac(etat)} texte={`${nbDansSac(etat)} / ${tailleSac(etat)}`} couleur="or" />
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
      </div>
    </header>
  )
}
