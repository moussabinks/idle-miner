// Les tâches, en haut à droite (27/10) : une à trois choses à faire, avec leur progression
// (« 🪨 12 / 25 ») et un bouton d'action. En touchant une tâche, on va au bon bâtiment (ou on
// ouvre le menu Bâtiments). Quand une tâche est accomplie, elle se coche avec un petit son avant
// de laisser la place à la suivante.
// (25/10) Repliable : sur téléphone, on ne voit que la première ; un clic sur le titre déplie.
// Les règles (quelles tâches montrer) sont dans src/jeu/missions.ts.

import { useEffect, useRef, useState } from 'react'
import type { IdBatiment } from '../jeu/donnees'
import { t } from '../jeu/langue'
import type { EtatJeu } from '../jeu/mineur'
import { ID_URGENCES, missions, type Mission } from '../jeu/missions'
import { nombreAbrege } from '../nombres'
import { sons } from '../sons'

type Props = {
  etat: EtatJeu
  onAllerAuStand: (stand: IdBatiment) => void
  onConstruire: () => void
}

const DUREE_ACCOMPLIE = 1600 // ms

export function Missions({ etat, onAllerAuStand, onConstruire }: Props) {
  // (30/10) Les tâches déjà affichées gardent leur place jusqu'à ce qu'elles soient faites.
  const [avant, setAvant] = useState<string[]>([])
  const liste = missions(etat, avant)
  // (on retient la liste affichée pendant le rendu, comme le conseille React)
  if (liste.map((m) => m.id).join('|') !== avant.join('|')) setAvant(liste.map((m) => m.id))
  const [depliees, setDepliees] = useState(true)

  // La tâche accomplie à l'instant (celle du haut qui vient de disparaître).
  const [accomplie, setAccomplie] = useState<Mission | null>(null)
  const premiere = useRef<Mission | null>(liste[0] ?? null)
  const idPremiere = liste[0]?.id ?? null
  useEffect(() => {
    const ancienne = premiere.current
    premiere.current = liste[0] ?? null
    // (une urgence qui s'en va n'est pas une tâche accomplie : elle était juste passée devant)
    if (!ancienne || ancienne.id === idPremiere || ID_URGENCES.includes(ancienne.id)) return
    if (liste.some((m) => m.id === ancienne.id)) return
    setAccomplie(ancienne)
    sons.succes()
  }, [idPremiere, liste])

  useEffect(() => {
    if (!accomplie) return
    const minuteur = window.setTimeout(() => setAccomplie(null), DUREE_ACCOMPLIE)
    return () => clearTimeout(minuteur)
  }, [accomplie])

  if (liste.length === 0 && !accomplie) return null
  return (
    <aside className={`taches ${depliees ? '' : 'taches-repliees'}`} aria-label={t('Tâches')}>
      <button className="taches-titre" onClick={() => setDepliees(!depliees)} aria-expanded={depliees}>
        <span>☑️ {t('Tâches')}</span>
        <span className="taches-fleche" aria-hidden="true">
          {depliees ? '▴' : '▾'}
        </span>
      </button>
      {accomplie && (
        <div className="tache tache-faite" role="status">
          <span className="tache-case" aria-hidden="true">
            ✔
          </span>
          <span className="tache-texte">{accomplie.texte}</span>
        </div>
      )}
      {liste.map((m, i) => {
        const possible = m.construction || m.stand !== null
        return (
          <div key={m.id} className={`tache ${i > 0 ? 'tache-suivante' : ''} ${m.pret ? 'tache-prete' : ''} ${ID_URGENCES.includes(m.id) ? 'tache-urgente' : ''}`}>
            <span className="tache-icone" aria-hidden="true">
              {m.icone}
            </span>
            <span className="tache-corps">
              <span className="tache-texte">{m.texte}</span>
              {m.elements && (
                <span className="tache-elements">
                  {m.elements.map((el) => (
                    <span key={el.nom} className={`tache-element ${el.valeur >= el.max ? 'fait' : ''}`}>
                      <span className="jauge" aria-hidden="true">
                        <i style={{ width: `${Math.min(100, (el.valeur / Math.max(1, el.max)) * 100)}%` }} />
                      </span>
                      <span className="tache-compte">
                        {/* (25/10) L'icône reste quand c'est fait (avant : ✔ à sa place, on ne savait plus de quoi on parlait) */}
                        {el.icone} {nombreAbrege(el.valeur)}/{nombreAbrege(el.max)}
                        {el.valeur >= el.max && <span className="tache-coche"> ✔</span>}
                      </span>
                    </span>
                  ))}
                </span>
              )}
              {m.progression && (
                <span className="tache-element">
                  <span className="jauge" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, (m.progression.valeur / Math.max(1, m.progression.max)) * 100)}%` }} />
                  </span>
                  <span className="tache-compte">
                    {m.progression.icone} {nombreAbrege(m.progression.valeur)}/{nombreAbrege(m.progression.max)}
                  </span>
                </span>
              )}
            </span>
            {possible && (
              <button className={`btn btn-petit ${m.pret ? 'btn-jaune' : 'btn-bleu'}`} onClick={() => (m.construction ? onConstruire() : m.stand && onAllerAuStand(m.stand))}>
                {m.pret ? t('Go !') : t('Voir')}
              </button>
            )}
          </div>
        )
      })}
    </aside>
  )
}
