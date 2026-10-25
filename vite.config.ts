import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

// La version du jeu, affichée en petit sur l'écran d'accueil : le commit Git et la date du
// build. Elle permet de vérifier que Vercel a bien mis en ligne la dernière version.
function commitActuel(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'local'
  }
}

const dateDuBuild = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' })

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // (25/10) Des chemins relatifs : le jeu marche aussi servi dans un sous-dossier (CrazyGames).
  base: './',
  define: {
    __VERSION_JEU__: JSON.stringify(`${commitActuel()} · ${dateDuBuild}`),
  },
})
