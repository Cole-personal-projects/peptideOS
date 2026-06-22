import * as pdfjs from 'pdfjs-dist';
import { createWorker, PSM } from 'tesseract.js';

export interface LabPdfOcrProgress {
  page: number;
  pageCount: number;
  status: string;
  progress?: number;
}

export interface LabPdfOcrResult {
  text: string;
  pageCount: number;
}

const MAX_OCR_PAGES = 8;

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

export async function extractLabPdfTextWithOcr(
  file: File,
  onProgress?: (progress: LabPdfOcrProgress) => void,
): Promise<LabPdfOcrResult> {
  if (typeof document === 'undefined') {
    throw new Error('PDF OCR must run in the browser.');
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const documentTask = pdfjs.getDocument({ data });
  const pdf = await documentTask.promise;
  const pageCount = Math.min(pdf.numPages, MAX_OCR_PAGES);
  let currentPage = 1;
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (typeof message.progress === 'number') {
        onProgress?.({
          page: currentPage,
          pageCount,
          status: message.status,
          progress: message.progress,
        });
      }
    },
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: PSM.AUTO,
      user_defined_dpi: '220',
    });

    const pages: string[] = [];
    for (currentPage = 1; currentPage <= pageCount; currentPage += 1) {
      onProgress?.({ page: currentPage, pageCount, status: 'rendering', progress: 0 });
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: 2.4 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create OCR canvas.');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;

      onProgress?.({ page: currentPage, pageCount, status: 'recognizing', progress: 0 });
      const result = await worker.recognize(canvas);
      pages.push(cleanOcrText(result.data.text));
      page.cleanup();
    }

    return {
      text: pages.filter(Boolean).join('\n\n'),
      pageCount: pdf.numPages,
    };
  } finally {
    await worker.terminate();
    documentTask.destroy();
  }
}

function cleanOcrText(value: string) {
  return value
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
