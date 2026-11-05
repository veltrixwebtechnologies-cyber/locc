create table if not exists public.customer_delivery_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entrance_latitude double precision not null check (entrance_latitude between -90 and 90),
  entrance_longitude double precision not null check (entrance_longitude between -180 and 180),
  details jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.customer_delivery_locations enable row level security;
create policy "Customers read own delivery entrance" on public.customer_delivery_locations
  for select to authenticated using (auth.uid() = user_id);
create policy "Customers insert own delivery entrance" on public.customer_delivery_locations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Customers update own delivery entrance" on public.customer_delivery_locations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.customer_delivery_locations to authenticated;
