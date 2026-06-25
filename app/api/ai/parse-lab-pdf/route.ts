import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';

import { createAiLabPdfDraft } from '@/lib/lab-results';
import type { LabReport } from '@/lib/types';

export const runtime = 'nodejs';

const MODEL = process.env.ANTHROPIC_LAB_IMPORT_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const metadataSchema = z.object({
  drawDate: z.string().min(1),
  resultedDate: z.string().optional(),
  sourceLabel: z.string().optional(),
  panelName: z.string().optional(),
  linkedStackId: z.string().optional(),
  notes: z.string().optional(),
  existingReports: z
    .array(
      z.object({
        id: z.string(),
        uniqueImportKey: z.string(),
      }).passthrough(),
    )
    .optional(),
});

const labFlagSchema = z.enum(['low', 'high', 'normal', 'critical', 'unknown']);

const aiLabRowSchema = z.object({
  testName: z.string().min(1),
  assayMethod: z.string().optional(),
  value: z.string().min(1),
  numericValue: z.number().optional(),
  unit: z.string().default(''),
  referenceRangeText: z.string().optional(),
  referenceRangeLow: z.number().optional(),
  referenceRangeHigh: z.number().optional(),
  flag: labFlagSchema.default('unknown'),
  panelName: z.string().optional(),
});

const aiLabPdfSchema = z.object({
  sourceLabel: z.string().optional(),
  panelName: z.string().optional(),
  drawDate: z.string().optional(),
  resultedDate: z.string().optional(),
  rows: z.array(aiLabRowSchema),
  unresolvedRows: z.array(z.string()).default([]),
  caveats: z.array(z.string()).default([]),
});

const SYSTEM_PROMPT = [
  'You extract lab results from uploaded PDF lab reports for PeptideOS.',
  'Return only PHI-minimized structured lab marker data. Do not include patient names, addresses, account numbers, accessions, phone numbers, or ordering clinician names.',
  'Extract actual test markers with result values. Ignore page headers, footers, legal text, specimen IDs, billing text, and demographics.',
  'Preserve assay/method details when present, especially distinctions such as Estradiol Sensitive LC/MS/MS versus Estradiol immunoassay.',
  'Preserve units and reference range text exactly enough for human review.',
  'Use flag values only from low, high, normal, critical, unknown.',
  'If unsure about a row, omit it from rows and add the raw line to unresolvedRows.',
  'Do not diagnose, interpret, recommend dosing, or decide whether values are optimal.',
].join(' ');

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Peppi PDF extraction is not connected in this environment. You can still use local OCR, CSV, text, or manual entry.' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid PDF upload.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a PDF file to import.' }, { status: 400 });
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: 'PDF must be 10 MB or smaller.' }, { status: 413 });
  }

  const metadataRaw = formData.get('metadata');
  let metadataJson: unknown = {};
  try {
    metadataJson = typeof metadataRaw === 'string' && metadataRaw ? JSON.parse(metadataRaw) : {};
  } catch {
    return NextResponse.json({ error: 'Invalid lab import metadata.' }, { status: 400 });
  }

  const parsedMetadata = metadataSchema.safeParse(metadataJson);
  if (!parsedMetadata.success) {
    return NextResponse.json({ error: 'Invalid lab import metadata.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(bytes)) {
    return NextResponse.json({ error: 'Only PDF files can use PDF extraction.' }, { status: 415 });
  }

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 3200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: Buffer.from(bytes).toString('base64'),
              },
            },
            {
              type: 'text',
              text: JSON.stringify({
                task: 'Extract lab marker rows for review in PeptideOS.',
                fileName: file.name,
                metadata: parsedMetadata.data,
                expectedFields: [
                  'testName',
                  'assayMethod',
                  'value',
                  'unit',
                  'referenceRangeText',
                  'flag',
                  'panelName',
                ],
              }),
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(aiLabPdfSchema),
      },
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return NextResponse.json({ error: 'Peppi could not extract lab markers from this PDF.' }, { status: 422 });
    }

    const parsed = response.parsed_output;
    const rows = parsed.rows.map((row) => ({
      testName: row.testName,
      assayMethod: row.assayMethod,
      value: row.value,
      numericValue: row.numericValue,
      unit: row.unit,
      referenceRange: row.referenceRangeText
        ? {
            text: row.referenceRangeText,
            low: row.referenceRangeLow,
            high: row.referenceRangeHigh,
          }
        : undefined,
      flag: row.flag,
      panelName: row.panelName,
    }));

    const draft = createAiLabPdfDraft(rows, {
      ...parsedMetadata.data,
      sourceLabel: parsedMetadata.data.sourceLabel || parsed.sourceLabel,
      panelName: parsedMetadata.data.panelName || parsed.panelName,
      drawDate: parsedMetadata.data.drawDate || parsed.drawDate || new Date().toISOString().slice(0, 10),
      resultedDate: parsedMetadata.data.resultedDate || parsed.resultedDate,
      existingReports: parsedMetadata.data.existingReports as LabReport[] | undefined,
      unresolvedRows: [...parsed.unresolvedRows, ...parsed.caveats.map((caveat) => `Caveat: ${caveat}`)],
    });

    if (draft.rows.length === 0) {
      return NextResponse.json(
        { error: 'Peppi reviewed the PDF but did not find importable lab marker rows.', draft },
        { status: 422 },
      );
    }

    return NextResponse.json({ draft, pageCount: undefined, mode: 'ai-pdf' });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Peppi is busy. Running local OCR fallback is still available.' }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Peppi API key is invalid. Use local OCR, CSV, text, or manual entry.' }, { status: 503 });
    }
    console.error('parse-lab-pdf failed', error);
    return NextResponse.json({ error: 'Peppi PDF extraction failed. Use local OCR, paste text, or enter values manually.' }, { status: 502 });
  }
}

function isPdf(bytes: Uint8Array) {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}
