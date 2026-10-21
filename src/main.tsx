import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './blocs.css'
import './effets.css'
import './accueil.css'
import './personnel.css'
import './village.css'
import App from './App.tsx'
import { enregistrerServiceWorker } from './installation'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Le jeu marche aussi hors ligne et s'installe comme une application (voir public/sw.js).
enregistrerServiceWorker()
