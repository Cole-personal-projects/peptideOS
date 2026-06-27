create extension if not exists pgcrypto with schema extensions;

create or replace function public.redeem_beta_invite(
  invite_code text,
  redeemer_user_id uuid,
  redeemer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_code text := lower(trim(invite_code));
  invite_row public.beta_invite_codes%rowtype;
  already_redeemed boolean := false;
  remaining integer := 0;
begin
  if normalized_code is null
    or length(normalized_code) < 4
    or redeemer_user_id is null
    or position('@' in redeemer_email) <= 1
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_request');
  end if;

  select *
    into invite_row
  from public.beta_invite_codes
  where code_hash = encode(extensions.digest(normalized_code, 'sha256'), 'hex')
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

  insert into public.beta_invite_redemptions (invite_code_id, user_id, email, redeemed_at)
  values (invite_row.id, redeemer_user_id, lower(trim(redeemer_email)), now());

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
    ends_at = null,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'entitlement', 'beta_access',
    'alreadyRedeemed', false,
    'remainingRedemptions', greatest(remaining, 0)
  );
end;
$$;

create or replace function public.redeem_beta_invite_by_email(
  invite_code text,
  redeemer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
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
  where code_hash = encode(extensions.digest(normalized_code, 'sha256'), 'hex')
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

revoke all on function public.redeem_beta_invite(text, uuid, text) from public;
grant execute on function public.redeem_beta_invite(text, uuid, text) to service_role;

revoke all on function public.redeem_beta_invite_by_email(text, text) from public;
grant execute on function public.redeem_beta_invite_by_email(text, text) to service_role;
