// (30/10, demandé par le propriétaire) Le nombre de visiteurs de megadigger.io, avec Vercel Web
// Analytics : les chiffres (visiteurs uniques, pages vues, pays, appareils) se lisent dans l'onglet
// « Analytics » du projet sur Vercel, qu'il faut avoir activé une fois (Analytics > Enable).
// Sans cookies : pas de bandeau à afficher. Seulement sur le vrai site (pas en local) et hors
// portail ; le petit script de Vercel n'est chargé qu'à ce moment-là, et s'il ne répond pas, le
// jeu marche quand même.

import { AVEC_STATISTIQUES } from './portail'

export function initialiserStatistiques(): void {
  if (!AVEC_STATISTIQUES || !import.meta.env.PROD) return
  import('@vercel/analytics')
    .then(({ inject }) => inject({ framework: 'vite' }))
    .catch(() => {})
}
