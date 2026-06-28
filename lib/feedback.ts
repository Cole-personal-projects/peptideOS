import { z } from 'zod/v4';

import { APP_VERSION } from '@/lib/app-metadata';

export const feedbackCategories = [
  'bug',
  'feature_request',
  'usability_issue',
  'data_issue',
  'performance',
  'lab_import',
  'sync_cloud',
  'account_beta',
  'comment',
  'other',
] as const;

export const feedbackSeverities = ['blocking', 'major', 'minor', 'nice_to_have'] as const;

export const feedbackSchema = z.object({
  category: z.enum(feedbackCategories),
  severity: z.enum(feedbackSeverities),
  screen: z.string().trim().max(120).optional().default(''),
  summary: z.string().trim().min(4).max(140),
  details: z.string().trim().min(8).max(4000),
  expected: z.string().trim().max(2000).optional().default(''),
  steps: z.string().trim().max(2000).optional().default(''),
  email: z.string().trim().email().max(254).optional().or(z.literal('')).default(''),
  includeDiagnostics: z.boolean().default(true),
  diagnostics: z
    .object({
      appVersion: z.string().max(40).optional(),
      route: z.string().max(180).optional(),
      userAgent: z.string().max(400).optional(),
      platform: z.string().max(120).optional(),
      viewport: z.string().max(40).optional(),
      timezone: z.string().max(80).optional(),
    })
    .optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackCategory = (typeof feedbackCategories)[number];
export type FeedbackSeverity = (typeof feedbackSeverities)[number];

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: 'bug',
  feature_request: 'feature',
  usability_issue: 'ux',
  data_issue: 'data',
  performance: 'performance',
  lab_import: 'labs',
  sync_cloud: 'sync',
  account_beta: 'beta',
  comment: 'comment',
  other: 'triage',
};

const categoryTitles: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  feature_request: 'Feature request',
  usability_issue: 'Usability issue',
  data_issue: 'Data issue',
  performance: 'Performance',
  lab_import: 'Lab import',
  sync_cloud: 'Sync/cloud',
  account_beta: 'Account/beta',
  comment: 'Comment',
  other: 'Other',
};

const severityTitles: Record<FeedbackSeverity, string> = {
  blocking: 'Blocking',
  major: 'Major',
  minor: 'Minor',
  nice_to_have: 'Nice to have',
};

export function feedbackCategoryLabel(category: FeedbackCategory) {
  return categoryTitles[category];
}

export function feedbackSeverityLabel(severity: FeedbackSeverity) {
  return severityTitles[severity];
}

export function buildFeedbackIssueTitle(feedback: FeedbackInput) {
  return `[${categoryTitles[feedback.category]}] ${feedback.summary}`;
}

export function buildFeedbackIssueLabels(feedback: FeedbackInput) {
  return [
    'feedback',
    categoryLabels[feedback.category],
    `severity:${feedback.severity.replaceAll('_', '-')}`,
  ];
}

export function buildFeedbackIssueBody(feedback: FeedbackInput) {
  const diagnostics = feedback.includeDiagnostics ? feedback.diagnostics : undefined;
  const lines = [
    '## Feedback',
    '',
    `- Category: ${categoryTitles[feedback.category]}`,
    `- Severity: ${severityTitles[feedback.severity]}`,
    `- Screen/route: ${feedback.screen || diagnostics?.route || 'Not provided'}`,
    `- Contact: ${feedback.email || 'Not provided'}`,
    `- App version: ${diagnostics?.appVersion || APP_VERSION}`,
    '',
    '## What happened',
    '',
    feedback.details,
  ];

  if (feedback.expected) lines.push('', '## Expected', '', feedback.expected);
  if (feedback.steps) lines.push('', '## Steps to reproduce', '', feedback.steps);

  if (diagnostics) {
    lines.push(
      '',
      '## Diagnostics',
      '',
      `- Route: ${diagnostics.route || 'Unknown'}`,
      `- Viewport: ${diagnostics.viewport || 'Unknown'}`,
      `- Platform: ${diagnostics.platform || 'Unknown'}`,
      `- Timezone: ${diagnostics.timezone || 'Unknown'}`,
      `- User agent: ${diagnostics.userAgent || 'Unknown'}`,
    );
  }

  lines.push(
    '',
    '## Privacy',
    '',
    'Submitted through the PeptideOS beta feedback form. No protocol, lab, inventory, signal, or health records are attached automatically.',
  );

  return lines.join('\n');
}

export function getFeedbackRepository() {
  const repo = process.env.FEEDBACK_GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || '';
  const [owner, name] = repo.split('/');
  if (!owner || !name) return null;
  return { owner, name };
}
