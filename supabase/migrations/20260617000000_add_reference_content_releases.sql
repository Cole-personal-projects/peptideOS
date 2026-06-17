create table if not exists public.reference_content_blocks (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  block_type text not null,
  title text not null default '',
  content jsonb not null default '{}'::jsonb,
  citation_ids text[] not null default '{}',
  review_status public.reference_review_status not null default 'draft',
  content_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_content_blocks_block_type_not_blank check (length(trim(block_type)) > 0),
  constraint reference_content_blocks_content_version_positive check (content_version > 0)
);

create table if not exists public.reference_library_releases (
  release_version text primary key,
  release_notes text not null default '',
  source_snapshot_version text not null default '',
  published_by text not null default '',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint reference_library_releases_version_format check (release_version ~ '^[0-9]{4}\.[0-9]{2}\.[0-9]+(-[a-z0-9-]+)?$')
);

create table if not exists public.reference_library_release_items (
  release_version text not null references public.reference_library_releases(release_version) on delete cascade,
  compound_id uuid not null references public.reference_compounds(id) on delete restrict,
  content_block_id uuid not null references public.reference_content_blocks(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (release_version, compound_id, content_block_id)
);

create index if not exists reference_content_blocks_compound_id_idx
  on public.reference_content_blocks(compound_id);

create index if not exists reference_content_blocks_review_status_idx
  on public.reference_content_blocks(review_status);

create index if not exists reference_library_release_items_compound_id_idx
  on public.reference_library_release_items(compound_id);

alter table public.reference_content_blocks enable row level security;
alter table public.reference_library_releases enable row level security;
alter table public.reference_library_release_items enable row level security;

create policy "service_role manages reference content blocks"
  on public.reference_content_blocks
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference library releases"
  on public.reference_library_releases
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference release items"
  on public.reference_library_release_items
  for all
  to service_role
  using (true)
  with check (true);
