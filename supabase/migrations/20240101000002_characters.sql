-- ============================================================
-- characters table
-- ============================================================
create table if not exists public.characters (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  origin_story_id     uuid references public.stories(id) on delete set null,
  name                text not null,
  emoji               text not null default '✨',
  physical_description text,
  personality_trait   text,
  poetic_detail       text,
  origin_family       text,
  appearances         integer not null default 1,
  created_at          timestamptz not null default now()
);

-- Indexes
create index if not exists characters_user_id_idx on public.characters(user_id);
create index if not exists characters_origin_story_idx on public.characters(origin_story_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.characters enable row level security;

-- Users can only see their own characters
create policy "characters_select_own"
  on public.characters
  for select
  using (auth.uid() = user_id);

-- Users can only insert their own characters
create policy "characters_insert_own"
  on public.characters
  for insert
  with check (auth.uid() = user_id);

-- Users can only update their own characters
create policy "characters_update_own"
  on public.characters
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own characters
create policy "characters_delete_own"
  on public.characters
  for delete
  using (auth.uid() = user_id);
