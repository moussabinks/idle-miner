// La configuration des tests (Vitest) : celle de Vite, sans les fichiers archivés (archives/ :
// le prestige et l'enchanteur, gardés au cas où, mais plus branchés au jeu).
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import configVite from './vite.config.ts'

export default mergeConfig(configVite, defineConfig({ test: { exclude: [...configDefaults.exclude, 'archives/**'] } }))
