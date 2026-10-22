import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './icones.css' // la police des icônes cartoon (avant tout le reste)
import './index.css'
import './blocs.css'
import './effets.css'
import './accueil.css'
import './personnel.css'
import './village.css'
import './plein-ecran.css'
import './interface.css'
import App from './App.tsx'
import { enregistrerServiceWorker } from './installation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Le jeu marche aussi hors ligne et s'installe comme une application (voir public/sw.js).
enregistrerServiceWorker()
