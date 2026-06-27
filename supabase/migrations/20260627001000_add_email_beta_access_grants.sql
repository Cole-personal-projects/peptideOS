create table if not exists public.beta_email_access_grants (
  id uuid primary key default gen_random_uuid(),
  invite_code_id uuid references public.beta_invite_codes(id) on delete set null,
  email text not null unique,
  entitlement text not null default 'beta_access',
  active boolean not null default true,
  source text not null default 'invite_code',
  granted_at timestamptz not null default now(),
  last_seen_at timestamptz,
  constraint beta_email_access_grants_email_check check (position('@' in email) > 1),
  constraint beta_email_access_grants_entitlement_check check (entitlement ~ '^[a-z0-9_:-]+$')
);

create index if not exists beta_email_access_grants_email_active_idx
  on public.beta_email_access_grants(email, active);

alter table public.beta_email_access_grants enable row level security;

drop policy if exists "service_role manages beta email access grants" on public.beta_email_access_grants;
create policy "service_role manages beta email access grants"
  on public.beta_email_access_grants
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.redeem_beta_invite_by_email(
  invite_code text,
  redeemer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := lower(trim(invite_code));
  normalized_email text := lower(trim(redeemer_email));
  invite_row public.beta_invite_codes%rowtype;
  existing_grant public.beta_email_access_grants%rowtype;
  remaining integer := 0;
begin
  if normalized_code is null
    or length(normalized_code) < 4
    or normalized_email is null
    or position('@' in normalized_email) <= 1
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_request');
  end if;

  select *
    into existing_grant
  from public.beta_email_access_grants
  where email = normalized_email
    and entitlement = 'beta_access'
    and active = true
  limit 1;

  if found then
    update public.beta_email_access_grants
    set last_seen_at = now()
    where id = existing_grant.id;

    return jsonb_build_object(
      'ok', true,
      'entitlement', 'beta_access',
      'alreadyRedeemed', true,
      'remainingRedemptions', 0
    );
  end if;

  select *
    into invite_row
  from public.beta_invite_codes
  where code_hash = encode(digest(normalized_code, 'sha256'), 'hex')
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  if not invite_row.active then
    return jsonb_build_object('ok', false, 'reason', 'inactive_code');
  end if;

  if invite_row.expires_at is not null and invite_row.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired_code');
  end if;

  if invite_row.redeemed_count >= invite_row.max_redemptions then
    return jsonb_build_object('ok', false, 'reason', 'code_full');
  end if;

  insert into public.beta_email_access_grants (invite_code_id, email, entitlement, active, source, granted_at, last_seen_at)
  values (invite_row.id, normalized_email, 'beta_access', true, 'invite_code', now(), now());

  update public.beta_invite_codes
  set redeemed_count = redeemed_count + 1
  where id = invite_row.id
  returning max_redemptions - redeemed_count into remaining;

  return jsonb_build_object(
    'ok', true,
    'entitlement', 'beta_access',
    'alreadyRedeemed', false,
    'remainingRedemptions', greatest(remaining, 0)
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', true,
      'entitlement', 'beta_access',
      'alreadyRedeemed', true,
      'remainingRedemptions', 0
    );
end;
$$;

revoke all on function public.redeem_beta_invite_by_email(text, text) from public;
grant execute on function public.redeem_beta_invite_by_email(text, text) to service_role;
