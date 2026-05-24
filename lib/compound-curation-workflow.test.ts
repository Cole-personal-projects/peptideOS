import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import packageJson from '../package.json';

const root = process.cwd();
const curationPath = (...parts: string[]) => join(root, 'tools', 'compound-curation', ...parts);

describe('compound curation workflow scaffold', () => {
  test('documents the agent-forward curation pipeline and human review gate', () => {
    const readme = readFileSync(curationPath('README.md'), 'utf8');

    expect(readme).toContain('candidate -> sourced facts -> normalized draft -> safety review -> validation -> human approval -> reviewed entry');
    expect(readme).toContain('No generated facts ship without human review');
    expect(readme).toContain('Source fetcher output is always `sourced-facts-unreviewed`');
    expect(readme).toContain('Do not copy third-party database descriptions');
  });

  test('provides templates for candidates, sourced facts, and normalized drafts', () => {
    expect(existsSync(curationPath('candidates', 'candidate.template.yml'))).toBe(true);
    expect(existsSync(curationPath('sourced', 'source-facts.template.yml'))).toBe(true);
    expect(existsSync(curationPath('drafts', 'reference-compound.template.ts'))).toBe(true);
    expect(existsSync(curationPath('reviewed', '.gitkeep'))).toBe(true);
  });

  test('exposes a focused validation command for reference compounds', () => {
    expect(packageJson.scripts['compound:validate']).toBe('vitest run lib/reference-compounds.test.ts');
    expect(packageJson.scripts['compound:fetch-sources']).toBe('node tools/compound-curation/source-fetcher.mjs');
  });
});
