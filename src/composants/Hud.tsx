// Le bandeau du haut : argent, profondeur, pioche, sac, torches...

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
import { Barre } from './Barre'

export function Hud({ etat }: { etat: EtatJeu }) {
  const pioche = piocheEquipee(etat)
  const cassee = estCassee(etat)
  const zone = zoneDe(etat.profondeur)
  const enVille = aLaSurface(etat)
  const auFront = auFond(etat)
  const enchantements = LISTE_ENCHANTEMENTS.filter((id) => etat.enchantements[id] > 0)

  return (
    <header className="hud">
      <div className="hud-case hud-argent">
        <span className="hud-titre">Argent</span>
        <strong>💵 {etat.argent.toLocaleString('fr-FR')} $</strong>
      </div>

      <div className="hud-case">
        <span className="hud-titre">{enVille ? `Front à -${etat.profondeur} m` : auFront ? zone.nom : "Sur l'échelle"}</span>
        <strong>{enVille ? '☀️ Village' : auFront ? `📏 -${etat.profondeur} m` : `🪜 -${Math.round(etat.position)} m`}</strong>
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
        {enchantements.length > 0 && (
          <span className="hud-enchants">
            {enchantements.map((id) => `${ENCHANTEMENTS[id].nom} ${chiffreRomain(etat.enchantements[id])}`).join(' · ')}
          </span>
        )}
      </div>

      <div className="hud-case hud-sac">
        <span className="hud-titre">🎒 Sac</span>
        <Barre valeur={nbDansSac(etat)} max={tailleSac(etat)} texte={`${nbDansSac(etat)} / ${tailleSac(etat)}`} couleur="or" />
      </div>

      <div className="hud-case hud-petits">
        <span title="Torches">🕯️ {etat.torches}</span>
        <span title="Seaux d'eau">🪣 {etat.seaux}</span>
        {etat.ascenseur.niveau > 0 && <span title="Niveau de l'ascenseur">🛗 {etat.ascenseur.niveau}</span>}
        {etat.prestige > 0 && <span title="Prestige (+25 % sur les ventes par niveau)">⭐ {etat.prestige}</span>}
      </div>
    </header>
  )
}
