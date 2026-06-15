import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { buildProtocolSystemPrompt, parsedProtocolSchema } from '@/lib/ai-protocol';

export const runtime = 'nodejs';

const requestSchema = z.object({
  description: z.string().min(1).max(4000),
  compounds: z.array(z.object({
    id: z.string(),
    name: z.string(),
    defaultRoute: z.enum(['subq', 'im', 'intranasal', 'oral', 'topical']),
    supportedRoutes: z.array(z.enum(['subq', 'im', 'intranasal', 'oral', 'topical'])),
    defaultDoseUnit: z.enum(['mcg', 'mg', 'iu']),
  })).min(1).max(500),
});

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Peppi is not configured. Set the ANTHROPIC_API_KEY environment variable on the server.' },
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
      max_tokens: 4096,
      system: buildProtocolSystemPrompt(body.compounds),
      messages: [{ role: 'user', content: body.description }],
      output_config: {
        format: zodOutputFormat(parsedProtocolSchema),
      },
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return NextResponse.json(
        { error: 'The assistant could not parse that description. Try rephrasing it.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ protocol: response.parsed_output });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Peppi is busy. Try again in a moment.' }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Peppi API key is invalid.' }, { status: 503 });
    }
    console.error('parse-protocol failed', error);
    return NextResponse.json({ error: 'Peppi request failed. Try again.' }, { status: 502 });
  }
}
