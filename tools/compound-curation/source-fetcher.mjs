#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pubChemBase = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const dailyMedBase = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';

export function slugifyCompoundName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function yamlString(value) {
  const escaped = String(value).replaceAll('"', '\\"');
  return `"${escaped}"`;
}

function yamlList(items, indent = '        ') {
  if (!items.length) return `${indent}[]`;
  return items.map((item) => `${indent}- ${yamlString(item)}`).join('\n');
}

function currentYear() {
  return new Date().getFullYear();
}

export function buildPubChemUrls(query) {
  const encoded = encodeURIComponent(query);
  return {
    synonyms: `${pubChemBase}/compound/name/${encoded}/synonyms/JSON`,
    properties: `${pubChemBase}/compound/name/${encoded}/property/MolecularFormula,InChIKey/JSON`,
  };
}

export function buildDailyMedUrl(query) {
  return `${dailyMedBase}/spls.json?drug_name=${encodeURIComponent(query)}`;
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }
  return response.json();
}

export async function fetchPubChemFacts(query, fetchImpl = fetch) {
  const urls = buildPubChemUrls(query);
  const [synonymsJson, propertiesJson] = await Promise.all([
    fetchJson(fetchImpl, urls.synonyms),
    fetchJson(fetchImpl, urls.properties),
  ]);
  const information = synonymsJson.InformationList?.Information?.[0] ?? {};
  const properties = propertiesJson.PropertyTable?.Properties?.[0] ?? {};
  const cid = information.CID ?? properties.CID;
  const synonyms = (information.Synonym ?? []).slice(0, 12);

  return {
    id: 'pubchem',
    title: `PubChem compound summary${cid ? ` CID ${cid}` : ''}`,
    url: cid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}` : `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(query)}`,
    source: 'PubChem',
    year: currentYear(),
    facts: {
      identity: [
        cid ? `PubChem CID: ${cid}` : undefined,
        properties.MolecularFormula ? `Molecular formula: ${properties.MolecularFormula}` : undefined,
        properties.InChIKey ? `InChIKey: ${properties.InChIKey}` : undefined,
      ].filter(Boolean),
      aliases: synonyms,
    },
  };
}

export async function fetchDailyMedFacts(query, fetchImpl = fetch) {
  const json = await fetchJson(fetchImpl, buildDailyMedUrl(query));
  const candidates = json.data ?? [];

  return {
    id: 'dailymed',
    title: `DailyMed label candidates for ${query}`,
    url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(query)}`,
    source: 'DailyMed',
    year: currentYear(),
    facts: {
      labels: candidates.slice(0, 8).map((candidate) => {
        const title = candidate.title ?? candidate.spl_title ?? 'Untitled label';
        const setId = candidate.setid ?? candidate.set_id;
        return setId ? `${title} (${setId})` : title;
      }),
    },
  };
}

export function buildSourceFactsDocument({ compoundId, query, sources }) {
  const renderedSources = sources.map((source) => {
    const identity = source.facts.identity ?? [];
    const aliases = source.facts.aliases ?? [];
    const labels = source.facts.labels ?? [];

    return [
      `  - id: ${source.id}`,
      `    title: ${yamlString(source.title)}`,
      `    url: ${source.url}`,
      `    source: ${source.source}`,
      `    year: ${source.year}`,
      '    facts:',
      '      identity:',
      yamlList(identity),
      '      aliases:',
      yamlList(aliases),
      '      labelCandidates:',
      yamlList(labels),
    ].join('\n');
  }).join('\n');

  return [
    `compoundId: ${compoundId}`,
    `query: ${yamlString(query)}`,
    'status: sourced-facts-unreviewed',
    'reviewGate: human-review-required',
    'sources:',
    renderedSources || '  []',
    'unresolved:',
    '  - "Verify identity, route, unit, concentration mode, storage, and citation suitability before drafting app copy."',
    '  - "Do not promote this file directly to a reviewed reference compound."',
    '',
  ].join('\n');
}

function parseArgs(argv) {
  const args = new Map();
  const tokens = argv.filter((token) => token !== '--');
  for (let index = 0; index < tokens.length; index += 2) {
    args.set(tokens[index], tokens[index + 1]);
  }
  return args;
}

export async function runCli(
  argv = process.argv.slice(2),
  fetchImpl = fetch,
  fsImpl = { mkdir, writeFile }
) {
  const args = parseArgs(argv);
  const query = args.get('--compound') ?? args.get('--query');
  if (!query) {
    throw new Error('Usage: node tools/compound-curation/source-fetcher.mjs --compound "Compound Name" [--id compound-id] [--out path]');
  }

  const compoundId = args.get('--id') ?? slugifyCompoundName(query);
  const out = args.get('--out') ?? `tools/compound-curation/sourced/${compoundId}.source-facts.yml`;
  const sources = [];
  const unresolved = [];

  try {
    sources.push(await fetchPubChemFacts(query, fetchImpl));
  } catch (error) {
    unresolved.push(`PubChem lookup failed: ${error.message}`);
  }

  try {
    sources.push(await fetchDailyMedFacts(query, fetchImpl));
  } catch (error) {
    unresolved.push(`DailyMed lookup failed: ${error.message}`);
  }

  const document = buildSourceFactsDocument({ compoundId, query, sources });
  const finalDocument = unresolved.length
    ? document.replace('unresolved:\n', `unresolved:\n${yamlList(unresolved, '  ')}\n`)
    : document;

  await fsImpl.mkdir(dirname(out), { recursive: true });
  await fsImpl.writeFile(out, finalDocument, 'utf8');
  return { out, sources: sources.length, unresolved };
}

const entrypoint = fileURLToPath(import.meta.url);
if (process.argv[1] === entrypoint) {
  runCli().then(({ out, sources }) => {
    console.log(`Wrote ${out} with ${sources} source group(s). Human review required.`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
