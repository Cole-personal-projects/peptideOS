create table if not exists public.app_user_sync_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null,
  record_id text not null,
  payload jsonb not null,
  schema_version integer not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, collection, record_id),
  constraint app_user_sync_records_collection_check check (
    collection in (
      'vials',
      'inventory_batches',
      'doses',
      'stacks',
      'schedules',
      'schedule_logs',
      'reconstitution_calculations',
      'signal_check_ins',
      'user_compounds',
      'settings'
    )
  ),
  constraint app_user_sync_records_record_id_not_blank check (length(trim(record_id)) > 0),
  constraint app_user_sync_records_payload_object check (jsonb_typeof(payload) = 'object')
);

create index if not exists app_user_sync_records_user_updated_at_idx
  on public.app_user_sync_records(user_id, updated_at desc);

create index if not exists app_user_sync_records_user_collection_idx
  on public.app_user_sync_records(user_id, collection);

alter table public.app_user_sync_records enable row level security;

create policy "users read their own sync records"
  on public.app_user_sync_records
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users insert their own sync records"
  on public.app_user_sync_records
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update their own sync records"
  on public.app_user_sync_records
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete their own sync records"
  on public.app_user_sync_records
  for delete
  to authenticated
  using (auth.uid() = user_id);
