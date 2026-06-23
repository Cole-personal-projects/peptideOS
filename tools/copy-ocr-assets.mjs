import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const publicOcrDir = join(process.cwd(), 'public', 'ocr');
mkdirSync(publicOcrDir, { recursive: true });

const tesseractDir = dirname(require.resolve('tesseract.js/package.json'));
const tesseractCoreDir = join(tesseractDir, '..', 'tesseract.js-core');

const assets = [
  [require.resolve('pdfjs-dist/build/pdf.worker.min.mjs'), 'pdf.worker.min.mjs'],
  [require.resolve('tesseract.js/dist/worker.min.js'), 'tesseract-worker.min.js'],
  [join(tesseractCoreDir, 'tesseract-core-lstm.wasm.js'), 'tesseract-core-lstm.wasm.js'],
  [join(tesseractCoreDir, 'tesseract-core-lstm.wasm'), 'tesseract-core-lstm.wasm'],
  [join(tesseractCoreDir, 'tesseract-core-simd-lstm.wasm.js'), 'tesseract-core-simd-lstm.wasm.js'],
  [join(tesseractCoreDir, 'tesseract-core-simd-lstm.wasm'), 'tesseract-core-simd-lstm.wasm'],
  [require.resolve('@tesseract.js-data/eng/4.0.0/eng.traineddata.gz'), 'eng.traineddata.gz'],
];

for (const [source, target] of assets) {
  copyFileSync(source, join(publicOcrDir, target));
}

console.log(`Copied ${assets.length} OCR assets to public/ocr`);
