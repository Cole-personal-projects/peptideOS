create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reference_review_status') then
    create type public.reference_review_status as enum (
      'candidate',
      'draft',
      'needs_review',
      'reviewed',
      'deprecated'
    );
  end if;
end $$;

create table if not exists public.reference_compounds (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  canonical_name text not null,
  summary text not null default '',
  compound_type text not null,
  default_route text not null,
  default_dose_unit text not null,
  concentration_mode text not null,
  review_status public.reference_review_status not null default 'candidate',
  confidence_tier text not null default 'limited',
  source_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_compounds_slug_key unique (slug),
  constraint reference_compounds_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint reference_compounds_confidence_tier_check check (confidence_tier in ('limited', 'moderate', 'strong'))
);

create table if not exists public.reference_compound_aliases (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  alias text not null,
  alias_normalized text generated always as (lower(trim(alias))) stored,
  alias_type text not null default 'synonym',
  created_at timestamptz not null default now(),
  constraint reference_compound_aliases_alias_key unique (alias_normalized),
  constraint reference_compound_aliases_alias_not_blank check (length(trim(alias)) > 0)
);

create table if not exists public.reference_compound_categories (
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  category text not null,
  primary_category boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (compound_id, category)
);

create table if not exists public.reference_compound_forms (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  form_type text not null,
  primary_unit text not null,
  allowed_units text[] not null default '{}',
  reconstitution_compatible boolean not null default false,
  container_type text not null default 'other',
  form_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_citations (
  id text primary key,
  source_type text not null,
  title text not null,
  url text not null,
  publisher text not null default '',
  published_year integer,
  accessed_at date not null default current_date,
  created_at timestamptz not null default now(),
  constraint reference_citations_url_https check (url ~ '^https://')
);

create table if not exists public.reference_compound_citations (
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  citation_id text not null references public.reference_citations(id) on delete restrict,
  supports_field text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key (compound_id, citation_id, supports_field)
);

create table if not exists public.reference_workflow_metadata (
  compound_id uuid primary key references public.reference_compounds(id) on delete cascade,
  can_log_dose boolean not null default true,
  can_add_to_stack boolean not null default true,
  can_reconstitute boolean not null default false,
  can_track_inventory boolean not null default true,
  workflow_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_curation_events (
  id uuid primary key default gen_random_uuid(),
  compound_id uuid references public.reference_compounds(id) on delete cascade,
  event_type text not null,
  actor text not null default '',
  notes text not null default '',
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reference_compounds_review_status_idx
  on public.reference_compounds(review_status);

create index if not exists reference_compound_categories_category_idx
  on public.reference_compound_categories(category);

create index if not exists reference_compound_forms_compound_id_idx
  on public.reference_compound_forms(compound_id);

create index if not exists reference_compound_citations_citation_id_idx
  on public.reference_compound_citations(citation_id);

alter table public.reference_compounds enable row level security;
alter table public.reference_compound_aliases enable row level security;
alter table public.reference_compound_categories enable row level security;
alter table public.reference_compound_forms enable row level security;
alter table public.reference_citations enable row level security;
alter table public.reference_compound_citations enable row level security;
alter table public.reference_workflow_metadata enable row level security;
alter table public.reference_curation_events enable row level security;

create policy "service_role manages reference compounds"
  on public.reference_compounds
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference aliases"
  on public.reference_compound_aliases
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference categories"
  on public.reference_compound_categories
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference forms"
  on public.reference_compound_forms
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference citations"
  on public.reference_citations
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference citation links"
  on public.reference_compound_citations
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference workflow metadata"
  on public.reference_workflow_metadata
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference curation events"
  on public.reference_curation_events
  for all
  to service_role
  using (true)
  with check (true);
