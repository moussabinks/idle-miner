-- La base de données Supabase d'Idle Miner.
-- À coller une fois dans Supabase : SQL Editor > New query > Run.
--
-- Une ligne par joueur : tous ses mondes (la même chose que dans le localStorage),
-- et l'heure du dernier envoi. Les comptes eux-mêmes sont gérés par Supabase (auth.users).

create table if not exists public.sauvegardes (
  joueur uuid primary key references auth.users (id) on delete cascade,
  parties jsonb not null,
  envoyee_le bigint not null,          -- l'heure de l'envoi, en millisecondes (Date.now() du jeu)
  modifiee_le timestamptz not null default now()
);

-- Les joueurs connectés peuvent utiliser la table (les règles ci-dessous limitent à leur ligne).
grant select, insert, update on public.sauvegardes to authenticated;

-- Sécurité : sans ces règles, n'importe qui pourrait lire ou écraser les mondes des autres.
-- Chaque joueur connecté ne voit et ne modifie que SA ligne.
alter table public.sauvegardes enable row level security;

drop policy if exists "Lire sa sauvegarde" on public.sauvegardes;
create policy "Lire sa sauvegarde" on public.sauvegardes
  for select to authenticated
  using ((select auth.uid()) = joueur);

drop policy if exists "Créer sa sauvegarde" on public.sauvegardes;
create policy "Créer sa sauvegarde" on public.sauvegardes
  for insert to authenticated
  with check ((select auth.uid()) = joueur);

drop policy if exists "Modifier sa sauvegarde" on public.sauvegardes;
create policy "Modifier sa sauvegarde" on public.sauvegardes
  for update to authenticated
  using ((select auth.uid()) = joueur)
  with check ((select auth.uid()) = joueur);

-- La date de modification se met à jour toute seule.
create or replace function public.dater_sauvegarde() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.modifiee_le := now();
  return new;
end;
$$;

drop trigger if exists dater_sauvegarde on public.sauvegardes;
create trigger dater_sauvegarde before update on public.sauvegardes
  for each row execute function public.dater_sauvegarde();
