#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (!next || next.startsWith('--')) {
    args.set(key, 'true');
  } else {
    args.set(key, next);
    index += 1;
  }
}

const rawCode = args.get('code') ?? generateCode();
const code = normalizeCode(rawCode);
const label = args.get('label') ?? 'PeptideOS private beta';
const maxRedemptions = Number.parseInt(args.get('max') ?? '10', 10);
const expiresAt = args.get('expires-at') ?? null;

if (!Number.isInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 1000) {
  throw new Error('--max must be an integer from 1 to 1000.');
}

const codeHash = createHash('sha256').update(code.toLowerCase()).digest('hex');

console.log(`Invite code: ${code}`);
console.log(`Max redemptions: ${maxRedemptions}`);
console.log('');
console.log('SQL to run in Supabase SQL editor:');
console.log('');
console.log(`insert into public.beta_invite_codes (code_hash, label, max_redemptions, expires_at, created_by)
values (
  '${codeHash}',
  ${sqlString(label)},
  ${maxRedemptions},
  ${expiresAt ? sqlString(expiresAt) + '::timestamptz' : 'null'},
  'local-generator'
)
on conflict (code_hash) do update set
  label = excluded.label,
  max_redemptions = excluded.max_redemptions,
  expires_at = excluded.expires_at,
  active = true;`);

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(15);
  let value = 'POS';
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return `${value.slice(0, 3)}-${value.slice(3, 8)}-${value.slice(8, 13)}-${value.slice(13, 18)}`;
}

function normalizeCode(value) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}
