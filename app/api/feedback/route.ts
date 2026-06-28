import { NextResponse } from 'next/server';

import {
  buildFeedbackIssueBody,
  buildFeedbackIssueLabels,
  buildFeedbackIssueTitle,
  feedbackSchema,
  getFeedbackRepository,
} from '@/lib/feedback';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid feedback payload.' }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Please complete the required feedback fields.' }, { status: 400 });
  }

  const title = buildFeedbackIssueTitle(parsed.data);
  const body = buildFeedbackIssueBody(parsed.data);
  const labels = buildFeedbackIssueLabels(parsed.data);
  const repository = getFeedbackRepository();
  const token = process.env.FEEDBACK_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

  if (!repository || !token) {
    console.info(
      'feedback-submission',
      JSON.stringify({
        title,
        labels,
        configured: false,
        receivedAt: new Date().toISOString(),
      }),
    );
    return NextResponse.json({
      ok: true,
      stored: false,
      message: 'Feedback received locally. GitHub issue creation is not configured yet.',
    });
  }

  const response = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.name}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PeptideOS-feedback',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(
      'feedback-github-error',
      JSON.stringify({
        status: response.status,
        title,
        labels,
        error: errorText.slice(0, 500),
      }),
    );
    return NextResponse.json({ ok: false, error: 'Feedback could not be submitted. Please try again.' }, { status: 502 });
  }

  const issue = (await response.json()) as { html_url?: string; number?: number };
  return NextResponse.json({
    ok: true,
    stored: true,
    issueUrl: issue.html_url,
    issueNumber: issue.number,
    message: 'Feedback sent.',
  });
}
