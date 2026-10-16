// Les notifications qui apparaissent en bas de l'écran.

import type { Toast } from '../usePartie'

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.succes ? 'toast-succes' : ''}`}>
          {t.texte}
        </div>
      ))}
    </div>
  )
}
