// La configuration des tests (Vitest) : celle de Vite, sans les fichiers archivés (archives/ :
// le prestige et l'enchanteur, gardés au cas où, mais plus branchés au jeu).
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import configVite from './vite.config.ts'

// (27/10) La config de Vite est une fonction (une version par « mode ») : on prend la normale.
export default mergeConfig(configVite({ command: 'serve', mode: 'test' }), defineConfig({ test: { exclude: [...configDefaults.exclude, 'archives/**'] } }))
