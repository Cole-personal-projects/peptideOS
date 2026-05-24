import { describe, expect, test } from 'vitest';
import * as fetcher from './source-fetcher.mjs';

describe('compound source fetcher', () => {
  test('builds official PubChem and DailyMed lookup URLs', () => {
    expect(fetcher.buildPubChemUrls('Testosterone Cypionate')).toEqual({
      synonyms: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Testosterone%20Cypionate/synonyms/JSON',
      properties: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Testosterone%20Cypionate/property/MolecularFormula,InChIKey/JSON',
    });
    expect(fetcher.buildDailyMedUrl('Testosterone Cypionate')).toBe(
      'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=Testosterone%20Cypionate'
    );
  });

  test('normalizes fetched facts into an unreviewed source-facts document', () => {
    const document = fetcher.buildSourceFactsDocument({
      compoundId: 'testosterone-cypionate',
      query: 'Testosterone Cypionate',
      sources: [
        {
          id: 'pubchem',
          title: 'PubChem compound summary CID 441404',
          url: 'https://pubchem.ncbi.nlm.nih.gov/compound/441404',
          source: 'PubChem',
          year: 2026,
          facts: {
            identity: ['PubChem CID: 441404', 'Molecular formula: C27H40O3'],
            aliases: ['Depo-Testosterone'],
          },
        },
        {
          id: 'dailymed',
          title: 'DailyMed label candidates for Testosterone Cypionate',
          url: 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=Testosterone%20Cypionate',
          source: 'DailyMed',
          year: 2026,
          facts: {
            labels: ['TESTOSTERONE CYPIONATE injection, solution (set-id)'],
          },
        },
      ],
    });

    expect(document).toContain('status: sourced-facts-unreviewed');
    expect(document).toContain('reviewGate: human-review-required');
    expect(document).toContain('PubChem CID: 441404');
    expect(document).toContain('TESTOSTERONE CYPIONATE injection, solution');
    expect(document).toContain('Do not promote this file directly to a reviewed reference compound.');
  });

  test('fetches PubChem and DailyMed with injectable fetch for deterministic tests', async () => {
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/synonyms/')) {
        return new Response(JSON.stringify({
          InformationList: { Information: [{ CID: 441404, Synonym: ['Testosterone Cypionate'] }] },
        }));
      }
      if (url.includes('/property/')) {
        return new Response(JSON.stringify({
          PropertyTable: { Properties: [{ CID: 441404, MolecularFormula: 'C27H40O3', InChIKey: 'HPFVBGJFAYZEBE-UHFFFAOYSA-N' }] },
        }));
      }
      return new Response(JSON.stringify({
        data: [{ title: 'TESTOSTERONE CYPIONATE injection, solution', setid: 'example-setid' }],
      }));
    };

    await expect(fetcher.fetchPubChemFacts('Testosterone Cypionate', fetchImpl)).resolves.toMatchObject({
      source: 'PubChem',
      facts: {
        identity: expect.arrayContaining(['PubChem CID: 441404']),
        aliases: ['Testosterone Cypionate'],
      },
    });
    await expect(fetcher.fetchDailyMedFacts('Testosterone Cypionate', fetchImpl)).resolves.toMatchObject({
      source: 'DailyMed',
      facts: {
        labels: ['TESTOSTERONE CYPIONATE injection, solution (example-setid)'],
      },
    });
  });

  test('runs from npm-style argv while keeping output unreviewed', async () => {
    const writes: Record<string, string> = {};
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('/synonyms/')) {
        return new Response(JSON.stringify({
          InformationList: { Information: [{ CID: 1, Synonym: ['Example'] }] },
        }));
      }
      if (url.includes('/property/')) {
        return new Response(JSON.stringify({
          PropertyTable: { Properties: [{ CID: 1, MolecularFormula: 'H2O' }] },
        }));
      }
      return new Response(JSON.stringify({ data: [] }));
    };

    const result = await fetcher.runCli(['--', '--compound', 'Example Compound', '--out', '/tmp/example.yml'], fetchImpl, {
      mkdir: async () => undefined,
      writeFile: async (path: unknown, body: unknown) => {
        writes[String(path)] = String(body);
      },
    });

    expect(result).toMatchObject({ out: '/tmp/example.yml', sources: 2 });
    expect(writes['/tmp/example.yml']).toContain('status: sourced-facts-unreviewed');
  });
});
