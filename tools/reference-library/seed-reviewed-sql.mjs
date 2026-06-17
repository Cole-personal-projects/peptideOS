#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

if (!args.output) {
  fail('Missing required "--output <path>" argument.');
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const { createJiti } = require('jiti');
const jiti = createJiti(`${repoRoot}/`);

const { referenceCompounds } = jiti(`${repoRoot}/lib/reference-compounds/index.ts`);
const { buildBundledReferenceSnapshot } = jiti(`${repoRoot}/lib/reference-library-snapshot.ts`);
const { buildReferenceRegistrySeed } = jiti(`${repoRoot}/lib/reference-registry-seed.ts`);

const snapshot = buildBundledReferenceSnapshot(referenceCompounds);
const seed = buildReferenceRegistrySeed(snapshot);
const sql = buildSeedSql(seed);
const outputPath = resolve(process.cwd(), args.output);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sql, 'utf8');

console.log(`Wrote reviewed reference library seed SQL for ${seed.compounds.length} compounds to ${outputPath}`);

function buildSeedSql(seed) {
  const slugs = seed.compounds.map((compound) => compound.slug);
  const releaseVersion = seed.libraryRelease.release_version;
  const statements = [
    'begin;',
    `delete from public.reference_library_release_items where release_version = ${sqlString(releaseVersion)};`,
    `delete from public.reference_library_release_items where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_content_blocks where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_dose_presets where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_vial_presets where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_compound_citations where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_workflow_metadata where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_compound_forms where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_compound_categories where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    `delete from public.reference_compound_aliases where compound_id in (select id from public.reference_compounds where slug = any(${sqlTextArray(slugs)}));`,
    insertCitations(seed.citations),
    insertCompounds(seed.compounds),
    insertAliases(seed.aliases),
    insertCategories(seed.categories),
    insertForms(seed.forms),
    insertCompoundCitations(seed.compoundCitations),
    insertDosePresets(seed.dosePresets),
    insertVialPresets(seed.vialPresets),
    insertWorkflowMetadata(seed.workflowMetadata),
    insertContentBlocks(seed.contentBlocks),
    insertLibraryRelease(seed.libraryRelease),
    insertReleaseItems(seed.releaseItems),
    'commit;',
    '',
  ];

  return statements.filter(Boolean).join('\n\n');
}

function insertCitations(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_citations (id, source_type, title, url, publisher, published_year)',
    `values ${rows.map((row) => `(${[
      sqlString(row.id),
      sqlString(row.source_type),
      sqlString(row.title),
      sqlString(row.url),
      sqlString(row.publisher),
      sqlNullableNumber(row.published_year),
    ].join(', ')})`).join(',\n')}`,
    'on conflict (id) do update set',
    '  source_type = excluded.source_type,',
    '  title = excluded.title,',
    '  url = excluded.url,',
    '  publisher = excluded.publisher,',
    '  published_year = excluded.published_year;',
  ].join('\n');
}

function insertCompounds(rows) {
  return [
    'insert into public.reference_compounds (slug, canonical_name, summary, compound_type, default_route, default_dose_unit, concentration_mode, review_status, confidence_tier, source_notes)',
    `values ${rows.map((row) => `(${[
      sqlString(row.slug),
      sqlString(row.canonical_name),
      sqlString(row.summary),
      sqlString(row.compound_type),
      sqlString(row.default_route),
      sqlString(row.default_dose_unit),
      sqlString(row.concentration_mode),
      sqlString(row.review_status),
      sqlString(row.confidence_tier),
      sqlString(row.source_notes),
    ].join(', ')})`).join(',\n')}`,
    'on conflict (slug) do update set',
    '  canonical_name = excluded.canonical_name,',
    '  summary = excluded.summary,',
    '  compound_type = excluded.compound_type,',
    '  default_route = excluded.default_route,',
    '  default_dose_unit = excluded.default_dose_unit,',
    '  concentration_mode = excluded.concentration_mode,',
    '  review_status = excluded.review_status,',
    '  confidence_tier = excluded.confidence_tier,',
    '  source_notes = excluded.source_notes,',
    '  updated_at = now();',
  ].join('\n');
}

function insertAliases(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_compound_aliases (compound_id, alias, alias_type)',
    `values ${rows.map((row) => `(${compoundId(row.compound_slug)}, ${sqlString(row.alias)}, ${sqlString(row.alias_type)})`).join(',\n')}`,
    'on conflict (alias_normalized) do nothing;',
  ].join('\n');
}

function insertCategories(rows) {
  return [
    'insert into public.reference_compound_categories (compound_id, category, primary_category)',
    `values ${rows.map((row) => `(${compoundId(row.compound_slug)}, ${sqlString(row.category)}, ${sqlBoolean(row.primary_category)})`).join(',\n')};`,
  ].join('\n');
}

function insertForms(rows) {
  return [
    'insert into public.reference_compound_forms (compound_id, form_type, primary_unit, allowed_units, reconstitution_compatible, typical_vial_amounts, typical_bac_water_ml, container_type, form_notes)',
    `values ${rows.map((row) => `(${[
      compoundId(row.compound_slug),
      sqlString(row.form_type),
      sqlString(row.primary_unit),
      sqlTextArray(row.allowed_units),
      sqlBoolean(row.reconstitution_compatible),
      `${sqlString(JSON.stringify(row.typical_vial_amounts))}::jsonb`,
      sqlNumericArray(row.typical_bac_water_ml),
      sqlString(row.container_type),
      sqlString(row.form_notes),
    ].join(', ')})`).join(',\n')};`,
  ].join('\n');
}

function insertCompoundCitations(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_compound_citations (compound_id, citation_id, supports_field, note)',
    `values ${rows.map((row) => `(${compoundId(row.compound_slug)}, ${sqlString(row.citation_id)}, ${sqlString(row.supports_field)}, ${sqlString(row.note)})`).join(',\n')};`,
  ].join('\n');
}

function insertDosePresets(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_dose_presets (id, compound_id, label, value, unit, intent, source_note, citation_ids, sort_order)',
    `values ${rows.map((row) => `(${[
      sqlString(row.id),
      compoundId(row.compound_slug),
      sqlString(row.label),
      sqlNumber(row.value),
      sqlString(row.unit),
      sqlString(row.intent),
      sqlString(row.source_note),
      sqlTextArray(row.citation_ids),
      sqlNumber(row.sort_order),
    ].join(', ')})`).join(',\n')};`,
  ].join('\n');
}

function insertVialPresets(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_vial_presets (id, compound_id, label, total_amount_value, total_amount_unit, concentration_value, concentration_unit, volume_ml, source_note, citation_ids, sort_order)',
    `values ${rows.map((row) => `(${[
      sqlString(row.id),
      compoundId(row.compound_slug),
      sqlString(row.label),
      sqlNullableNumber(row.total_amount_value),
      sqlNullableString(row.total_amount_unit),
      sqlNullableNumber(row.concentration_value),
      sqlNullableString(row.concentration_unit),
      sqlNullableNumber(row.volume_ml),
      sqlString(row.source_note),
      sqlTextArray(row.citation_ids),
      sqlNumber(row.sort_order),
    ].join(', ')})`).join(',\n')};`,
  ].join('\n');
}

function insertWorkflowMetadata(rows) {
  return [
    'insert into public.reference_workflow_metadata (compound_id, can_log_dose, can_add_to_stack, can_reconstitute, can_track_inventory, workflow_notes)',
    `values ${rows.map((row) => `(${[
      compoundId(row.compound_slug),
      sqlBoolean(row.can_log_dose),
      sqlBoolean(row.can_add_to_stack),
      sqlBoolean(row.can_reconstitute),
      sqlBoolean(row.can_track_inventory),
      sqlString(row.workflow_notes),
    ].join(', ')})`).join(',\n')};`,
  ].join('\n');
}

function insertContentBlocks(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_content_blocks (id, compound_id, block_type, title, content, citation_ids, review_status, content_version)',
    `values ${rows.map((row) => `(${[
      sqlString(row.id),
      compoundId(row.compound_slug),
      sqlString(row.block_type),
      sqlString(row.title),
      `${sqlString(JSON.stringify(row.content))}::jsonb`,
      sqlTextArray(row.citation_ids),
      sqlString(row.review_status),
      sqlNumber(row.content_version),
    ].join(', ')})`).join(',\n')};`,
  ].join('\n');
}

function insertLibraryRelease(row) {
  return [
    'insert into public.reference_library_releases (release_version, release_notes, source_snapshot_version, published_by, published_at)',
    `values (${[
      sqlString(row.release_version),
      sqlString(row.release_notes),
      sqlString(row.source_snapshot_version),
      sqlString(row.published_by),
      sqlString(row.published_at),
    ].join(', ')})`,
    'on conflict (release_version) do update set',
    '  release_notes = excluded.release_notes,',
    '  source_snapshot_version = excluded.source_snapshot_version,',
    '  published_by = excluded.published_by,',
    '  published_at = excluded.published_at;',
  ].join('\n');
}

function insertReleaseItems(rows) {
  if (rows.length === 0) return '';
  return [
    'insert into public.reference_library_release_items (release_version, compound_id, content_block_id, sort_order)',
    `values ${rows.map((row) => `(${[
      sqlString(row.release_version),
      compoundId(row.compound_slug),
      sqlString(row.content_block_id),
      sqlNumber(row.sort_order),
    ].join(', ')})`).join(',\n')};`,
  ].join('\n');
}

function compoundId(slug) {
  return `(select id from public.reference_compounds where slug = ${sqlString(slug)})`;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNullableString(value) {
  return value === null || value === undefined ? 'null' : sqlString(value);
}

function sqlNumber(value) {
  return Number(value).toString();
}

function sqlNullableNumber(value) {
  return value === null || value === undefined ? 'null' : sqlNumber(value);
}

function sqlBoolean(value) {
  return value ? 'true' : 'false';
}

function sqlTextArray(values) {
  if (values.length === 0) return 'array[]::text[]';
  return `array[${values.map(sqlString).join(', ')}]::text[]`;
}

function sqlNumericArray(values) {
  if (values.length === 0) return 'array[]::numeric[]';
  return `array[${values.map(sqlNumber).join(', ')}]::numeric[]`;
}

function parseArgs(argv) {
  const parsed = {
    output: '',
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') continue;

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg === '--output') {
      parsed.output = requireValue(argv, index, arg);
      index += 1;
      continue;
    }

    fail(`Unknown argument "${arg}".`);
  }

  return parsed;
}

function requireValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    fail(`Missing value for "${flag}".`);
  }
  return value;
}

function fail(message) {
  console.error(message);
  console.error('');
  printUsage();
  process.exit(1);
}

function printUsage() {
  console.log([
    'Usage:',
    '  pnpm library:seed-reviewed-sql -- --output ./reference-library-seed.sql',
    '',
    'Options:',
    '  --output <path>  Write SQL that upserts the reviewed bundled registry into Supabase.',
  ].join('\n'));
}
