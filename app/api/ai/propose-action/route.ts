import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import type { AssistantActionProposal } from '@/lib/assistant-actions';

export const runtime = 'nodejs';

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
});

const parsedProposalSchema = z.object({
  message: z.string().describe('Short user-facing confirmation or clarification message.'),
  signalCheckIn: z.object({
    energy: z.number().nullable().describe('Energy score from 0 to 10 if the user stated it, otherwise null.'),
    sleepHours: z.number().nullable().describe('Sleep duration in hours if the user stated it, otherwise null.'),
    notes: z.string().nullable().describe('User-stated observations that are not the energy or sleep values.'),
  }).nullable().describe('Structured Signal check-in data, or null when the user did not ask to capture Signal data.'),
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildActionProposal(parsed: z.infer<typeof parsedProposalSchema>, now = new Date()): AssistantActionProposal {
  if (!parsed.signalCheckIn) {
    return { message: parsed.message, action: null };
  }

  const energy = parsed.signalCheckIn.energy;
  const sleepHours = parsed.signalCheckIn.sleepHours;
  if (energy === null && sleepHours === null) {
    return { message: parsed.message, action: null };
  }

  return {
    message: parsed.message || 'I will add this Signal check-in.',
    action: {
      id: `assistant-action-${now.getTime()}`,
      type: 'add_signal_check_in',
      payload: {
        checkedAt: now.toISOString(),
        energy: clamp(energy ?? 5, 0, 10),
        sleepHours: clamp(sleepHours ?? 0, 0, 24),
        notes: parsed.signalCheckIn.notes?.trim() ?? '',
      },
    },
  };
}

const SYSTEM_PROMPT = [
  'You convert user chat into proposed PeptideOS app actions.',
  '',
  'Supported action:',
  '- Add a Signal check-in with energy, sleep, and notes.',
  '',
  'Rules:',
  '- This is a logging tool, not a medical advisor.',
  '- Only structure what the user stated. Never give medical advice or recommendations.',
  '- If the user gives energy, treat it as a 0-10 score.',
  '- If the user gives sleep, convert it to hours.',
  '- Put subjective observations in notes.',
  '- If the user did not provide Signal check-in data, set signalCheckIn to null and explain what you can capture.',
].join('\n');

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI assistant is not configured. Set the ANTHROPIC_API_KEY environment variable on the server.' },
      { status: 503 },
    );
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: body.message }],
      output_config: {
        format: zodOutputFormat(parsedProposalSchema),
      },
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return NextResponse.json(
        { error: 'The assistant could not parse that message. Try rephrasing it.' },
        { status: 422 },
      );
    }

    return NextResponse.json(buildActionProposal(response.parsed_output));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'AI assistant is busy. Try again in a moment.' }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'AI assistant API key is invalid.' }, { status: 503 });
    }
    console.error('propose-action failed', error);
    return NextResponse.json({ error: 'AI assistant request failed. Try again.' }, { status: 502 });
  }
}
