-- (23/10) Le classement se fait à l'argent EN POCHE (il peut baisser quand on achète).
-- À coller une fois dans Supabase : SQL Editor > New query > Run.
--
-- Avant, le serveur gardait toujours le PLUS d'argent jamais envoyé (le trigger
-- garder_meilleur_score) : l'argent en poche n'aurait jamais pu baisser. Maintenant, la ligne
-- prend simplement la valeur envoyée par le jeu (le meilleur monde du joueur, toutes les 5 minutes).
-- Le niveau de la mine aussi (voir classement-niveau-mine.sql). Seule la date se met à jour toute seule.
--
-- Aucune table n'est créée : les règles de sécurité (RLS) de classement.sql restent les mêmes.

create or replace function public.garder_meilleur_score() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;
