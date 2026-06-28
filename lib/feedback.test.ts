import { describe, expect, test } from 'vitest';

import {
  buildFeedbackIssueBody,
  buildFeedbackIssueLabels,
  buildFeedbackIssueTitle,
  feedbackSchema,
  getFeedbackRepository,
} from './feedback';

describe('feedback helpers', () => {
  test('validates required summary and detail fields', () => {
    const parsed = feedbackSchema.safeParse({
      category: 'bug',
      severity: 'major',
      summary: 'Save fails',
      details: 'The save button stays disabled after entering all required values.',
      includeDiagnostics: true,
    });

    expect(parsed.success).toBe(true);
  });

  test('maps category and severity into issue labels', () => {
    const feedback = feedbackSchema.parse({
      category: 'lab_import',
      severity: 'blocking',
      summary: 'PDF import fails',
      details: 'The PDF import accepts the file but never opens review.',
    });

    expect(buildFeedbackIssueTitle(feedback)).toBe('[Lab import] PDF import fails');
    expect(buildFeedbackIssueLabels(feedback)).toEqual(['feedback', 'labs', 'severity:blocking']);
  });

  test('builds privacy-aware issue body with diagnostics but no attached app records', () => {
    const feedback = feedbackSchema.parse({
      category: 'sync_cloud',
      severity: 'minor',
      screen: '/more/settings',
      summary: 'Sync copy confusing',
      details: 'The status text does not make it clear which device last saved.',
      expected: 'Show the latest cloud save time and source device.',
      steps: 'Open Settings. Tap Cloud sync.',
      email: 'tester@example.com',
      includeDiagnostics: true,
      diagnostics: {
        appVersion: '0.4',
        route: '/more/settings',
        viewport: '390x844',
        platform: 'iPhone',
        timezone: 'America/Los_Angeles',
        userAgent: 'Mobile Safari',
      },
    });

    const body = buildFeedbackIssueBody(feedback);

    expect(body).toContain('- Category: Sync/cloud');
    expect(body).toContain('- Severity: Minor');
    expect(body).toContain('- App version: 0.4');
    expect(body).toContain('- User agent: Mobile Safari');
    expect(body).toContain('No protocol, lab, inventory, signal, or health records are attached automatically.');
  });

  test('reads repository from explicit feedback env first', () => {
    const originalFeedbackRepo = process.env.FEEDBACK_GITHUB_REPOSITORY;
    const originalGithubRepo = process.env.GITHUB_REPOSITORY;
    process.env.FEEDBACK_GITHUB_REPOSITORY = 'owner/feedback-repo';
    process.env.GITHUB_REPOSITORY = 'owner/app-repo';

    expect(getFeedbackRepository()).toEqual({ owner: 'owner', name: 'feedback-repo' });

    process.env.FEEDBACK_GITHUB_REPOSITORY = originalFeedbackRepo;
    process.env.GITHUB_REPOSITORY = originalGithubRepo;
  });
});
