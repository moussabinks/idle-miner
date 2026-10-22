-- La remise à zéro du classement (26/10), après le passage à la mine automatique (22/10).
-- À coller une fois dans Supabase : SQL Editor > New query > Run.
--
-- Avant le 22/10, la colonne « prestige » contenait le prestige (jusqu'à 500) ; depuis, elle
-- contient le niveau de la mine (1 à 5). Le serveur garde toujours le MEILLEUR score (voir le
-- trigger garder_meilleur_score dans classement.sql) : les anciens prestiges ne redescendraient
-- donc jamais. On efface toutes les lignes : chaque joueur retrouve la sienne, avec ses vrais
-- scores, à sa prochaine sauvegarde en ligne (le jeu l'envoie tout seul).
--
-- Aucune table n'est créée ni modifiée : les règles de sécurité (RLS) de classement.sql restent
-- les mêmes. (Le SQL Editor a le droit de supprimer ; un joueur, lui, ne peut jamais le faire.)

delete from public.classement;
