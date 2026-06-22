import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import path from 'node:path';
import { z } from 'zod/v4';

import { parseLabText } from '@/lib/lab-results';
import type { LabReport } from '@/lib/types';

export const runtime = 'nodejs';

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const pdfWorkerPath = path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs');

const metadataSchema = z.object({
  drawDate: z.string().min(1),
  resultedDate: z.string().optional(),
  sourceLabel: z.string().optional(),
  panelName: z.string().optional(),
  linkedStackId: z.string().optional(),
  notes: z.string().optional(),
  existingReports: z.array(z.object({
    id: z.string(),
    uniqueImportKey: z.string(),
  }).passthrough()).optional(),
});

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'File does not look like a PDF.' }, { status: 415 });
  }

  PDFParse.setWorker(pdfWorkerPath);
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText({ partial: [1, 12] });
    const extractedText = cleanExtractedText(result.text);
    if (extractedText.length < 30) {
      return NextResponse.json({
        error: 'No readable text found. Scanned PDFs need OCR, which is not connected yet.',
      }, { status: 422 });
    }

    const draft = parseLabText(extractedText, {
      ...parsedMetadata.data,
      sourceLabel: parsedMetadata.data.sourceLabel || inferSourceLabel(file.name, extractedText),
      panelName: parsedMetadata.data.panelName || inferPanelName(file.name, extractedText),
      existingReports: parsedMetadata.data.existingReports as LabReport[] | undefined,
    });

    return NextResponse.json({
      draft: {
        ...draft,
        method: 'pdf',
      },
      extractedTextPreview: extractedText.slice(0, 2000),
      pageCount: result.total,
    });
  } catch (error) {
    console.error('parse-pdf failed', error);
    return NextResponse.json({ error: 'Could not read PDF. Try a text-based PDF or enter values manually.' }, { status: 422 });
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

function isPdf(bytes: Uint8Array) {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/--\s+\d+\s+of\s+\d+\s+--/gim, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inferSourceLabel(fileName: string, text: string) {
  const haystack = `${fileName}\n${text}`.toLowerCase();
  if (haystack.includes('quest')) return 'Quest Diagnostics';
  if (haystack.includes('labcorp') || haystack.includes('laboratory corporation')) return 'LabCorp';
  if (haystack.includes('ulta')) return 'Ulta Lab Tests';
  return undefined;
}

function inferPanelName(fileName: string, text: string) {
  const haystack = `${fileName}\n${text}`.toLowerCase();
  if (haystack.includes('hormone') || haystack.includes('estradiol') || haystack.includes('testosterone')) return 'Hormones';
  if (haystack.includes('metabolic') || haystack.includes('glucose') || haystack.includes('hemoglobin a1c')) return 'Metabolic';
  if (haystack.includes('lipid') || haystack.includes('cholesterol')) return 'Lipids';
  if (haystack.includes('thyroid') || haystack.includes('tsh')) return 'Thyroid';
  return undefined;
}
