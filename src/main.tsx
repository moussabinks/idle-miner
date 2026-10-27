import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Les polices (25/10) : servies par le jeu lui-même (plus de Google Fonts : le jeu marche hors
// ligne et dans la page d'un autre site). Lilita One pour les titres, Nunito pour le texte.
import '@fontsource/lilita-one/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-900.css'
import './icones.css' // la police des icônes cartoon (avant tout le reste)
import './village.css' // le dessin du village (la carte, les bâtiments, les personnages)
import './styles/theme.css' // les briques du style : couleurs, boutons, fenêtres...
import './styles/jeu.css' // l'écran de jeu : le bandeau, les tâches, les boutons du bas
import './styles/mine.css' // la fenêtre de la mine
import './styles/gemmes.css' // les gemmes, la publicité, le cadeau du jour, les réglages
import './styles/batiments.css' // les panneaux des bâtiments, le Personnel, « Construire », les trajets
import './styles/accueil.css' // l'écran d'accueil : les mondes, le classement, le compte
import './styles/fenetres.css' // le tutoriel, la fête du niveau, les statistiques, le bilan, les gains
import './styles/paysage.css' // (27/10) le téléphone couché : fenêtres en panneau à droite (en dernier)
import App from './App.tsx'
import { enregistrerServiceWorker } from './installation'
import { initialiserLangue } from './langueNavigateur'
import { initialiserPortail } from './portail'

initialiserLangue()
void initialiserPortail()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Le jeu marche aussi hors ligne et s'installe comme une application (voir public/sw.js).
enregistrerServiceWorker()
