-- (23/10) Le classement se fait à l'argent gagné ; le niveau de la mine est seulement affiché.
-- À coller une fois dans Supabase : SQL Editor > New query > Run (facultatif : le jeu marche
-- sans, mais les vieilles lignes n'affichent pas leur niveau de mine).
--
-- Avant, le serveur gardait toujours le PLUS GRAND « prestige » : un joueur qui avait un ancien
-- prestige (plus de 5, avant la mine automatique du 22/10) y restait bloqué pour toujours, et le
-- jeu le cachait du classement. Maintenant :
--   - l'argent garde toujours le meilleur score (comme avant) ;
--   - la colonne « prestige » prend simplement le niveau de mine envoyé par le jeu (le meilleur
--     des mondes du joueur) ;
--   - les anciens prestiges sont remis à 0 : chaque joueur retrouve son vrai niveau de mine à sa
--     prochaine sauvegarde en ligne.
--
-- Aucune table n'est créée : les règles de sécurité (RLS) de classement.sql restent les mêmes.

create or replace function public.garder_meilleur_score() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.argent := greatest(new.argent, old.argent);
  new.modifie_le := now();
  return new;
end;
$$;

-- (sans le déclencheur : la date de ces lignes ne bouge pas, les joueurs qui n'ont pas rejoué
-- depuis le 22/10 restent hors du classement)
alter table public.classement disable trigger garder_meilleur_score;
-- (26/10 : la mine a 7 niveaux ; avant, « > 5 »)
update public.classement set prestige = 0 where prestige > 7;
alter table public.classement enable trigger garder_meilleur_score;
