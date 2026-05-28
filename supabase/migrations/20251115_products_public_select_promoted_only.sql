alter table if exists public.products enable row level security;

create policy "products_public_select_promoted_only"
  on public.products
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.promotions p
      where p.status = 'active'
        and now() >= p.start_date
        and now() <= p.end_date
        and products.id = any(p.applicable_products)
    )
  );
