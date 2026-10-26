-- (26/10) Les villages qu'on peut visiter depuis le classement (bouton « Visiter »).
-- À coller une fois dans Supabase : SQL Editor > New query > Run
-- (après classement.sql).
--
-- Une ligne par joueur : son pseudo et la partie de son meilleur monde (celle qui a gagné le plus
-- d'argent), envoyée avec son score. Tout le monde peut LIRE les villages (même sans compte),
-- mais chacun ne peut écrire que SA ligne, avec SON pseudo.
-- Les sauvegardes complètes (table « sauvegardes ») restent privées.

create table if not exists public.villages (
  joueur uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null,
  -- Anti-abus minimal : une partie fait quelques dizaines de Ko ; au-delà de 500 Ko, refusé.
  partie jsonb not null check (pg_column_size(partie) < 500000),
  modifie_le timestamptz not null default now()
);

create unique index if not exists villages_pseudo_unique on public.villages (lower(pseudo));

grant select on public.villages to anon, authenticated;
grant insert, update on public.villages to authenticated;

alter table public.villages enable row level security;

drop policy if exists "Tout le monde lit les villages" on public.villages;
create policy "Tout le monde lit les villages" on public.villages
  for select to anon, authenticated
  using (true);

-- Le pseudo doit être celui du compte : l'adresse du compte est « pseudo@joueurs.idle-miner.app ».
drop policy if exists "Créer son village" on public.villages;
create policy "Créer son village" on public.villages
  for insert to authenticated
  with check (
    (select auth.uid()) = joueur
    and lower(pseudo) = split_part((select auth.jwt() ->> 'email'), '@', 1)
  );

drop policy if exists "Modifier son village" on public.villages;
create policy "Modifier son village" on public.villages
  for update to authenticated
  using ((select auth.uid()) = joueur)
  with check (
    (select auth.uid()) = joueur
    and lower(pseudo) = split_part((select auth.jwt() ->> 'email'), '@', 1)
  );

-- La date se met à jour toute seule.
create or replace function public.dater_village() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.modifie_le := now();
  return new;
end;
$$;

drop trigger if exists dater_village on public.villages;
create trigger dater_village before update on public.villages
  for each row execute function public.dater_village();
