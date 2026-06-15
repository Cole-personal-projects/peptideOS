import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import type { AssistantActionProposal } from '@/lib/assistant-actions';
import {
  buildProtocolSystemPrompt,
  parsedProtocolSchema,
  parsedProtocolToStackDraft,
  type ProtocolCompoundInput,
} from '@/lib/ai-protocol';

export const runtime = 'nodejs';

const protocolCompoundSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultRoute: z.enum(['subq', 'im', 'intranasal', 'oral', 'topical']),
  supportedRoutes: z.array(z.enum(['subq', 'im', 'intranasal', 'oral', 'topical'])),
  defaultDoseUnit: z.enum(['mcg', 'mg', 'iu']),
});

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  compounds: z.array(protocolCompoundSchema).min(1).max(500).optional(),
});

const parsedProposalSchema = z.object({
  message: z.string().describe('Short user-facing confirmation or clarification message.'),
  signalCheckIn: z.object({
    energy: z.number().nullable().describe('Energy score from 0 to 10 if the user stated it, otherwise null.'),
    sleepHours: z.number().nullable().describe('Sleep duration in hours if the user stated it, otherwise null.'),
    notes: z.string().nullable().describe('User-stated observations that are not the energy or sleep values.'),
  }).nullable().describe('Structured Signal check-in data, or null when the user did not ask to capture Signal data.'),
  protocol: parsedProtocolSchema.nullable().describe('Structured protocol schedule data, or null when the user did not ask to create a schedule.'),
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildActionProposal(
  parsed: z.infer<typeof parsedProposalSchema>,
  compounds: ProtocolCompoundInput[],
  now = new Date(),
): AssistantActionProposal {
  if (parsed.protocol) {
    const missingDose = parsed.protocol.items.find((item) => item.doseValue === null || !Number.isFinite(item.doseValue) || item.doseValue <= 0);
    if (missingDose) {
      return {
        message: `I need the dose for ${missingDose.compoundName} before I can create a schedule.`,
        action: null,
      };
    }

    const result = parsedProtocolToStackDraft(parsed.protocol, compounds);
    if (!result.draft) {
      const unmatched = result.unmatchedCompounds.join(', ');
      return {
        message: unmatched ? `I could not match ${unmatched} to the library.` : 'I could not create a schedule from that message.',
        action: null,
      };
    }

    return {
      message: parsed.message || 'I will create this schedule for review.',
      action: {
        id: `assistant-action-${now.getTime()}`,
        type: 'create_stack_from_protocol',
        payload: {
          ...result.draft,
          startDate: now.toISOString(),
        },
      },
    };
  }

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
  'Supported actions:',
  '- Add a Signal check-in with energy, sleep, and notes.',
  '- Create a planned protocol schedule from compounds, doses, frequency, timing, and duration stated by the user.',
  '',
  'Rules:',
  '- This is a logging tool, not a medical advisor.',
  '- Only structure what the user stated. Never give medical advice or recommendations.',
  '- Prefer protocol schedule output when the user asks to schedule, plan, or create a protocol.',
  '- For protocols, never invent compounds, doses, frequencies, or routes. If a dose is missing, leave doseValue null.',
  '- If the user gives energy, treat it as a 0-10 score.',
  '- If the user gives sleep, convert it to hours.',
  '- Put subjective observations in notes.',
  '- If the user did not provide supported action data, set signalCheckIn and protocol to null and explain what you can capture.',
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
  const compounds = body.compounds ?? [];

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      system: [
        SYSTEM_PROMPT,
        '',
        buildProtocolSystemPrompt(compounds),
      ].join('\n'),
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

    return NextResponse.json(buildActionProposal(response.parsed_output, compounds));
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
