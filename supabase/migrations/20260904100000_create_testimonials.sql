-- ============================================================
-- Table des témoignages vendeurs (page "Devenir Vendeur")
-- Idempotente : ré-exécutable sans doublon ni erreur.
-- ============================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business text not null,
  avatar_url text not null default '/placeholder-user.jpg',
  rating integer not null default 5 check (rating between 1 and 5),
  content text not null,
  sales_growth text not null default '+100%',
  duration text not null default '6 mois',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS : lecture publique des témoignages actifs uniquement.
-- La gestion (insert/update/delete) se fait via la clé service_role (bypass RLS).
alter table public.testimonials enable row level security;

drop policy if exists "lecture_publique_temoignages_actifs" on public.testimonials;
create policy "lecture_publique_temoignages_actifs"
  on public.testimonials for select
  to anon, authenticated
  using (is_active = true);

-- Trigger updated_at (fonction locale, migration autonome)
create or replace function public.set_testimonials_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_testimonials_updated_at on public.testimonials;
create trigger trg_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_testimonials_updated_at();

-- ============================================================
-- Seed : 6 témoignages réalistes (marché béninois / Afrique de l'Ouest)
-- Garde-fou : n'insère que si le nom n'existe pas déjà.
-- ============================================================
insert into public.testimonials (name, business, rating, content, sales_growth, duration, display_order)
select v.name, v.business, v.rating, v.content, v.sales_growth, v.duration, v.display_order
from (values
  ('Fatou Diallo', 'Mode Africaine', 5,
   'Probooster a transformé mon petit commerce en une entreprise florissante. Les outils sont incroyables !',
   '+300%', '6 mois', 1),
  ('Kouassi Jean', 'Tech Solutions', 5,
   'La plateforme est intuitive et le support client est exceptionnel. Je recommande vivement !',
   '+450%', '1 an', 2),
  ('Aminata Traoré', 'Artisanat Local', 5,
   'Grâce à Probooster, j''ai pu exporter mes produits dans toute l''Afrique de l''Ouest.',
   '+200%', '8 mois', 3),
  ('Rodrigue Ahouandjinou', 'Électronique Cotonou', 5,
   'En trois mois, ma boutique d''électronique a doublé son chiffre d''affaires. Le système de boosting met vraiment mes produits en avant auprès des acheteurs.',
   '+180%', '3 mois', 4),
  ('Grâce Hounkpatin', 'Cosmétiques Naturels', 5,
   'Les paiements mobile money et le suivi des livraisons intégrés m''ont fait gagner un temps fou. Je gère tout depuis mon téléphone, même mes stocks.',
   '+250%', '10 mois', 5),
  ('Ibrahim Bio', 'Stocks & Grossiste Parakou', 4,
   'Le parrainage et le système de points fidélisent mes clients. Je reçois des commandes de Cotonou et de Niamey que je n''aurais jamais eues autrement.',
   '+150%', '1 an', 6)
) as v(name, business, rating, content, sales_growth, duration, display_order)
where not exists (
  select 1 from public.testimonials t where t.name = v.name
);