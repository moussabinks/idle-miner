// Le chemin d'un fichier du dossier public/ (images, sons...).
// Le jeu peut être servi ailleurs qu'à la racine du site (sur CrazyGames, il est dans un sous-dossier) :
// on ne doit donc jamais écrire « /images/... » directement, mais cheminPublic('images/...').
// (import.meta.env.BASE_URL vaut « ./ » : voir « base » dans vite.config.ts.)
export function cheminPublic(chemin: string): string {
  return import.meta.env.BASE_URL + chemin.replace(/^\//, '')
}
