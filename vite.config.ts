import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

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

// (27/10) La version CrazyGames n'est pas une application à installer : on retire de la page les
// lignes du manifeste et des icônes d'application, et du dossier final le service worker, le
// manifeste et ces icônes (ils ne serviraient à rien chez eux).
function sansApplication(dossier: string): Plugin {
  return {
    name: 'sans-application',
    transformIndexHtml(html) {
      return html
        .split('\n')
        .filter((ligne) => !/Application installable|rel="manifest"|apple-touch-icon|mobile-web-app|apple-mobile/.test(ligne))
        .join('\n')
    },
    closeBundle() {
      for (const fichier of ['sw.js', 'manifest.webmanifest', 'icones']) {
        rmSync(join(dossier, fichier), { recursive: true, force: true })
      }
    },
  }
}

// https://vite.dev/config/
// Deux versions du même jeu :
//   - npm run build             : le site megadigger.io (Vercel), dans dist/ ;
//   - npm run build:crazygames  : la version CrazyGames (mode « crazygames », qui lit
//     .env.crazygames : VITE_PORTAIL=crazygames), dans dist-crazygames/. Voir docs/crazygames.md.
export default defineConfig(({ mode }) => {
  const crazygames = mode === 'crazygames'
  const dossier = crazygames ? 'dist-crazygames' : 'dist'
  return {
    plugins: crazygames ? [react(), sansApplication(dossier)] : [react()],
    // (27/10) Sur CrazyGames, pas de comptes : enLigneAbsent.ts remplace enLigne.ts, et la
    // bibliothèque de Supabase n'est pas copiée dans le jeu.
    resolve: crazygames ? { alias: [{ find: /^(\.\.?\/)+enLigne$/, replacement: fileURLToPath(new URL('./src/enLigneAbsent.ts', import.meta.url)) }] } : {},
    // (25/10) Des chemins relatifs : le jeu marche aussi servi dans un sous-dossier (CrazyGames).
    base: './',
    build: { outDir: dossier },
    define: {
      __VERSION_JEU__: JSON.stringify(`${commitActuel()} · ${dateDuBuild}`),
    },
  }
})
