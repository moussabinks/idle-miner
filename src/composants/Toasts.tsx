// Les messages (25/10) : au plus 3 à la fois, en haut au milieu de l'écran, puis ils s'en vont.
import type { Toast } from '../usePartie'

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="messages" role="status" aria-live="polite">
      {toasts.slice(-3).map((m) => (
        <div key={m.id} className={`message ${m.succes ? 'message-succes' : ''}`}>
          {m.texte}
        </div>
      ))}
    </div>
  )
}
