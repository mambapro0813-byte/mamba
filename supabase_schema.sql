-- AI TRADE cloud storage (one private JSON state per authenticated user)
create table if not exists public.ai_trade_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ai_trade_state enable row level security;

create policy "users can read own ai trade state"
on public.ai_trade_state for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own ai trade state"
on public.ai_trade_state for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own ai trade state"
on public.ai_trade_state for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists ai_trade_state_updated_at_idx on public.ai_trade_state(updated_at desc);
