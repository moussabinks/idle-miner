// Les missions, en haut à droite (27/10) : une à trois choses à faire, avec leur progression
// (« 🪨 12 / 25 »). La première est en grand. En touchant une mission, on va au bon bâtiment
// (ou on ouvre le menu Bâtiments). Quand une mission est accomplie, elle se coche avec un petit
// son avant de laisser la place à la suivante.
// Les règles (quelles missions montrer) sont dans src/jeu/missions.ts.

import { useEffect, useRef, useState } from 'react'
import type { IdBatiment } from '../jeu/donnees'
import type { EtatJeu } from '../jeu/mineur'
import { missions, type Mission } from '../jeu/missions'
import { nombreAbrege } from '../nombres'
import { sons } from '../sons'

type Props = {
  etat: EtatJeu
  onAllerAuStand: (stand: IdBatiment) => void
  onConstruire: () => void
  compact: boolean // un panneau est ouvert : on ne montre que la première mission
}

const DUREE_ACCOMPLIE = 1600 // ms

export function Missions({ etat, onAllerAuStand, onConstruire, compact }: Props) {
  const liste = missions(etat)
  // La mission accomplie à l'instant (celle du haut qui vient de disparaître).
  const [accomplie, setAccomplie] = useState<Mission | null>(null)
  const premiere = useRef<Mission | null>(liste[0] ?? null)
  const idPremiere = liste[0]?.id ?? null
  useEffect(() => {
    const avant = premiere.current
    premiere.current = liste[0] ?? null
    // (une urgence qui s'en va n'est pas une mission accomplie : elle était juste passée devant)
    if (!avant || avant.id === idPremiere || avant.id === 'salaires' || avant.id === 'coffre-plein') return
    if (liste.some((m) => m.id === avant.id)) return
    setAccomplie(avant)
    sons.succes()
  }, [idPremiere, liste])
  // La mission cochée s'en va au bout d'un moment.
  useEffect(() => {
    if (!accomplie) return
    const minuteur = window.setTimeout(() => setAccomplie(null), DUREE_ACCOMPLIE)
    return () => clearTimeout(minuteur)
  }, [accomplie])

  const affichees = compact ? liste.slice(0, 1) : liste
  return (
    <aside className={`missions ${compact ? 'missions-compactes' : ''}`} aria-label="Missions">
      {accomplie && (
        <div className="mission mission-accomplie" role="status">
          <span className="mission-icone">✔</span>
          <span className="mission-texte">{accomplie.texte}</span>
        </div>
      )}
      {affichees.map((m, i) => (
        <button
          key={m.id}
          className={`mission ${i === 0 ? 'mission-principale' : ''} ${m.pret ? 'mission-prete' : ''}`}
          onClick={() => (m.construction ? onConstruire() : m.stand && onAllerAuStand(m.stand))}
          disabled={!m.construction && m.stand === null}
          title={m.construction ? 'Ouvrir le menu Bâtiments' : m.stand ? 'Y aller' : ''}
        >
          <span className="mission-icone" aria-hidden="true">
            {m.icone}
          </span>
          <span className="mission-corps">
            <span className="mission-texte">{m.texte}</span>
            {m.progression && (
              <span className="mission-progression">
                <span className="mission-piste" aria-hidden="true">
                  <i style={{ width: `${Math.min(100, (m.progression.valeur / Math.max(1, m.progression.max)) * 100)}%` }} />
                </span>
                <span className="mission-compte">
                  {m.progression.icone} {nombreAbrege(m.progression.valeur)}/{nombreAbrege(m.progression.max)}
                </span>
              </span>
            )}
          </span>
          {m.pret && (
            <span className="mission-go" aria-hidden="true">
              ➜
            </span>
          )}
        </button>
      ))}
    </aside>
  )
}
