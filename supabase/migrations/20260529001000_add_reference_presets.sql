create table if not exists public.reference_dose_presets (
  id text primary key,
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  label text not null,
  value numeric not null,
  unit text not null,
  intent text not null,
  source_note text not null default '',
  citation_ids text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_dose_presets_no_recommendations check (intent <> 'recommendation')
);

create table if not exists public.reference_vial_presets (
  id text primary key,
  compound_id uuid not null references public.reference_compounds(id) on delete cascade,
  label text not null,
  total_amount_value numeric,
  total_amount_unit text,
  concentration_value numeric,
  concentration_unit text,
  volume_ml numeric,
  source_note text not null default '',
  citation_ids text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reference_dose_presets_compound_id_idx
  on public.reference_dose_presets(compound_id);

create index if not exists reference_vial_presets_compound_id_idx
  on public.reference_vial_presets(compound_id);

alter table public.reference_dose_presets enable row level security;
alter table public.reference_vial_presets enable row level security;

create policy "service_role manages reference dose presets"
  on public.reference_dose_presets
  for all
  to service_role
  using (true)
  with check (true);

create policy "service_role manages reference vial presets"
  on public.reference_vial_presets
  for all
  to service_role
  using (true)
  with check (true);
