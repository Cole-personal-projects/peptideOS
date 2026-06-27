create extension if not exists pgcrypto;

create table if not exists public.beta_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text not null default 'Beta invite',
  max_redemptions integer not null,
  redeemed_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text not null default '',
  constraint beta_invite_codes_hash_format check (code_hash ~ '^[a-f0-9]{64}$'),
  constraint beta_invite_codes_max_redemptions_check check (max_redemptions between 1 and 1000),
  constraint beta_invite_codes_redeemed_count_check check (redeemed_count >= 0 and redeemed_count <= max_redemptions)
);

create table if not exists public.beta_invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  invite_code_id uuid not null references public.beta_invite_codes(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  redeemed_at timestamptz not null default now(),
  constraint beta_invite_redemptions_email_check check (position('@' in email) > 1),
  constraint beta_invite_redemptions_invite_user_key unique (invite_code_id, user_id),
  constraint beta_invite_redemptions_user_key unique (user_id)
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement text not null,
  active boolean not null default true,
  source text not null default 'manual',
  source_id uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_entitlements_entitlement_check check (entitlement ~ '^[a-z0-9_:-]+$'),
  constraint user_entitlements_window_check check (ends_at is null or ends_at > starts_at),
  constraint user_entitlements_user_entitlement_key unique (user_id, entitlement)
);

create index if not exists beta_invite_redemptions_invite_idx
  on public.beta_invite_redemptions(invite_code_id, redeemed_at desc);

create index if not exists user_entitlements_user_active_idx
  on public.user_entitlements(user_id, active, entitlement);

alter table public.beta_invite_codes enable row level security;
alter table public.beta_invite_redemptions enable row level security;
alter table public.user_entitlements enable row level security;

create policy "service_role manages beta invite codes"
  on public.beta_invite_codes for all to service_role
  using (true) with check (true);

create policy "service_role manages beta invite redemptions"
  on public.beta_invite_redemptions for all to service_role
  using (true) with check (true);

create policy "service_role manages user entitlements"
  on public.user_entitlements for all to service_role
  using (true) with check (true);

create policy "users read own entitlements"
  on public.user_entitlements for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.redeem_beta_invite(
  invite_code text,
  redeemer_user_id uuid,
  redeemer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := lower(trim(invite_code));
  invite_row public.beta_invite_codes%rowtype;
  already_redeemed boolean := false;
  remaining integer := 0;
begin
  if normalized_code is null or length(normalized_code) < 4 or redeemer_user_id is null or position('@' in redeemer_email) <= 1 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_request');
  end if;

  select *
    into invite_row
    from public.beta_invite_codes
   where code_hash = encode(digest(normalized_code, 'sha256'), 'hex')
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  if not invite_row.active then
    return jsonb_build_object('ok', false, 'reason', 'inactive_code');
  end if;

  if invite_row.expires_at is not null and invite_row.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired_code');
  end if;

  select exists (
    select 1
      from public.beta_invite_redemptions
     where invite_code_id = invite_row.id
       and user_id = redeemer_user_id
  ) into already_redeemed;

  if already_redeemed then
    insert into public.user_entitlements (user_id, entitlement, active, source, source_id, starts_at, ends_at)
    values (redeemer_user_id, 'beta_access', true, 'invite_code', invite_row.id, now(), null)
    on conflict (user_id, entitlement)
    do update set
      active = true,
      source = excluded.source,
      source_id = excluded.source_id,
      ends_at = null,
      updated_at = now();

    remaining := greatest(invite_row.max_redemptions - invite_row.redeemed_count, 0);
    return jsonb_build_object(
      'ok', true,
      'entitlement', 'beta_access',
      'alreadyRedeemed', true,
      'remainingRedemptions', remaining
    );
  end if;

  if invite_row.redeemed_count >= invite_row.max_redemptions then
    return jsonb_build_object('ok', false, 'reason', 'code_full');
  end if;

  insert into public.beta_invite_redemptions (invite_code_id, user_id, email)
  values (invite_row.id, redeemer_user_id, lower(trim(redeemer_email)));

  update public.beta_invite_codes
     set redeemed_count = redeemed_count + 1
   where id = invite_row.id
   returning max_redemptions - redeemed_count into remaining;

  insert into public.user_entitlements (user_id, entitlement, active, source, source_id, starts_at, ends_at)
  values (redeemer_user_id, 'beta_access', true, 'invite_code', invite_row.id, now(), null)
  on conflict (user_id, entitlement)
  do update set
    active = true,
    source = excluded.source,
    source_id = excluded.source_id,
    starts_at = least(public.user_entitlements.starts_at, excluded.starts_at),
    ends_at = null,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'entitlement', 'beta_access',
    'alreadyRedeemed', false,
    'remainingRedemptions', greatest(remaining, 0)
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'code_full');
end;
$$;

revoke all on function public.redeem_beta_invite(text, uuid, text) from public;
grant execute on function public.redeem_beta_invite(text, uuid, text) to service_role;
