alter table public.reference_compound_forms
  add column if not exists typical_vial_amounts jsonb not null default '[]'::jsonb,
  add column if not exists typical_bac_water_ml numeric[] not null default '{}';

alter table public.reference_compound_forms
  add constraint reference_compound_forms_typical_vial_amounts_array
  check (jsonb_typeof(typical_vial_amounts) = 'array')
  not valid;

alter table public.reference_compound_forms
  validate constraint reference_compound_forms_typical_vial_amounts_array;
