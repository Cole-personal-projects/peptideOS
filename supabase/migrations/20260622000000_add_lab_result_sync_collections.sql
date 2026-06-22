alter table public.app_user_sync_records
  drop constraint if exists app_user_sync_records_collection_check;

alter table public.app_user_sync_records
  add constraint app_user_sync_records_collection_check check (collection in (
    'vials',
    'inventory_batches',
    'doses',
    'stacks',
    'schedules',
    'schedule_logs',
    'reconstitution_calculations',
    'signal_check_ins',
    'lab_reports',
    'lab_results',
    'lab_import_audits',
    'user_compounds',
    'settings'
  ));
