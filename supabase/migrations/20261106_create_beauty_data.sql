create table if not exists public.beauty_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.beauty_data enable row level security;
revoke all on public.beauty_data from anon, authenticated;
grant select, insert, update, delete on public.beauty_data to authenticated;

create policy "Users can read their own beauty data"
  on public.beauty_data for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own beauty data"
  on public.beauty_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own beauty data"
  on public.beauty_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own beauty data"
  on public.beauty_data for delete to authenticated
  using ((select auth.uid()) = user_id);
