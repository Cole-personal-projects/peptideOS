import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_LAB_ANALYSIS_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';

const labReportSchema = z.object({
  id: z.string(),
  drawDate: z.string(),
  resultedDate: z.string().optional(),
  sourceLabel: z.string().optional(),
  panelName: z.string().optional(),
  notes: z.string(),
});

const labResultSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  testName: z.string(),
  normalizedKey: z.string(),
  assayMethod: z.string().optional(),
  value: z.string(),
  numericValue: z.number().optional(),
  unit: z.string(),
  referenceRange: z.object({
    text: z.string(),
    low: z.number().optional(),
    high: z.number().optional(),
  }).optional(),
  flag: z.enum(['low', 'high', 'normal', 'critical', 'unknown']),
  panelName: z.string().optional(),
});

const protocolContextSchema = z.object({
  drawDate: z.string(),
  activeStacks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    day: z.number(),
  })),
  recentCompletedLogs: z.number(),
  recentSkippedOrMissedLogs: z.number(),
  latestSignal: z.object({
    checkedAt: z.string(),
    energy: z.number(),
    sleepHours: z.number(),
    notes: z.string(),
  }).optional(),
});

const requestSchema = z.object({
  labReports: z.array(labReportSchema).max(25),
  labResults: z.array(labResultSchema).max(500),
  protocolContexts: z.array(protocolContextSchema).max(25),
  stacks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    startDate: z.string(),
    durationDays: z.number(),
  })).max(50),
});

const responseSchema = z.object({
  message: z.string(),
  cards: z.array(z.object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    severity: z.enum(['info', 'watch', 'caveat']),
  })).min(1).max(8),
});

const SYSTEM_PROMPT = [
  'You are Peppi, the PeptideOS operations assistant.',
  'Analyze structured lab results against local PeptideOS protocol records.',
  'Use careful temporal language: "tracked alongside", "may relate temporally", "cannot determine cause from app records".',
  'Mention assay or unit caveats when relevant, especially if estradiol LC/MS/MS and standard immunoassay could be mixed.',
  'Do not diagnose, recommend treatment, recommend dose changes, tell the user to start/stop anything, or claim any protocol is safe or unsafe.',
  'Return concise structured cards. Include clinician-discussion questions when helpful.',
].join('\n');

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Peppi lab analysis is not configured. Set ANTHROPIC_API_KEY on the server.' },
      { status: 503 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid lab analysis request.' }, { status: 400 });
  }

  if (body.labReports.length === 0 || body.labResults.length === 0) {
    return NextResponse.json({ error: 'Import labs before asking Peppi to analyze them.' }, { status: 422 });
  }

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            labReports: body.labReports,
            labResults: body.labResults,
            protocolContexts: body.protocolContexts,
            stacks: body.stacks,
          }),
        },
      ],
      output_config: {
        format: zodOutputFormat(responseSchema),
      },
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return NextResponse.json({ error: 'Peppi could not analyze those labs.' }, { status: 422 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Peppi is busy. Try again in a moment.' }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Peppi API key is invalid.' }, { status: 503 });
    }
    console.error('analyze-labs failed', error);
    return NextResponse.json({ error: 'Peppi lab analysis failed. Try again.' }, { status: 502 });
  }
}
