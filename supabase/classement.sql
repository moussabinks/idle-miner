-- Le classement (leaderboard) d'Idle Miner.
-- À coller une fois dans Supabase : SQL Editor > New query > Run
-- (après schema.sql, qui crée la table des sauvegardes).
--
-- Une ligne par joueur : son pseudo, son meilleur prestige et le plus d'argent gagné.
-- Tout le monde peut LIRE le classement (même sans compte), mais chacun ne peut écrire
-- que SA ligne, avec SON pseudo.

create table if not exists public.classement (
  joueur uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  -- Anti-triche minimal : des scores impossibles sont refusés.
  prestige integer not null default 0 check (prestige between 0 and 500),
  argent bigint not null default 0 check (argent between 0 and 1000000000000000),
  modifie_le timestamptz not null default now()
);

-- Deux joueurs ne peuvent pas avoir le même pseudo (« Noah » et « noah » compris).
create unique index if not exists classement_pseudo_unique on public.classement (lower(pseudo));
-- Pour trier vite.
create index if not exists classement_par_prestige on public.classement (prestige desc, argent desc);
create index if not exists classement_par_argent on public.classement (argent desc, prestige desc);

grant select on public.classement to anon, authenticated;
grant insert, update on public.classement to authenticated;

alter table public.classement enable row level security;

drop policy if exists "Tout le monde lit le classement" on public.classement;
create policy "Tout le monde lit le classement" on public.classement
  for select to anon, authenticated
  using (true);

-- Le pseudo doit être celui du compte : l'adresse du compte est « pseudo@joueurs.idle-miner.app ».
drop policy if exists "Créer sa ligne" on public.classement;
create policy "Créer sa ligne" on public.classement
  for insert to authenticated
  with check (
    (select auth.uid()) = joueur
    and lower(pseudo) = split_part((select auth.jwt() ->> 'email'), '@', 1)
  );

drop policy if exists "Modifier sa ligne" on public.classement;
create policy "Modifier sa ligne" on public.classement
  for update to authenticated
  using ((select auth.uid()) = joueur)
  with check (
    (select auth.uid()) = joueur
    and lower(pseudo) = split_part((select auth.jwt() ->> 'email'), '@', 1)
  );

-- On garde toujours le MEILLEUR score : supprimer son meilleur monde ne fait pas
-- descendre au classement. La date se met aussi à jour toute seule.
create or replace function public.garder_meilleur_score() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.prestige := greatest(new.prestige, old.prestige);
  new.argent := greatest(new.argent, old.argent);
  new.modifie_le := now();
  return new;
end;
$$;

drop trigger if exists garder_meilleur_score on public.classement;
create trigger garder_meilleur_score before update on public.classement
  for each row execute function public.garder_meilleur_score();
