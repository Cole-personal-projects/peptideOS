import { beforeEach, describe, expect, test, vi } from 'vitest';

const renderMock = vi.fn();
const getPageMock = vi.fn();
const pdfDestroyMock = vi.fn();
const getDocumentMock = vi.fn();
const recognizeMock = vi.fn();
const setParametersMock = vi.fn();
const terminateMock = vi.fn();
const createWorkerMock = vi.fn();

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: getDocumentMock,
}));

vi.mock('tesseract.js', () => ({
  PSM: { AUTO: 'auto' },
  createWorker: createWorkerMock,
}));

describe('lab PDF OCR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: vi.fn(() => ({
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({})),
        })),
      },
    });
    renderMock.mockReturnValue({ promise: Promise.resolve() });
    getPageMock.mockResolvedValue({
      getViewport: vi.fn(() => ({ width: 100, height: 200 })),
      render: renderMock,
      cleanup: vi.fn(),
    });
    pdfDestroyMock.mockResolvedValue(undefined);
    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: getPageMock,
      }),
      destroy: pdfDestroyMock,
    });
    recognizeMock
      .mockResolvedValueOnce({ data: { text: ' Glucose   89 mg/dL 70-99 normal\n\n\n' } })
      .mockResolvedValueOnce({ data: { text: 'IGF-1  195 ng/mL 68-247 normal' } });
    setParametersMock.mockResolvedValue(undefined);
    terminateMock.mockResolvedValue(undefined);
    createWorkerMock.mockImplementation(async (_langs, _oem, options) => {
      options.logger({ status: 'loading tesseract', progress: 0.5 });
      options.logger({ status: 'loading language' });
      return {
        setParameters: setParametersMock,
        recognize: recognizeMock,
        terminate: terminateMock,
      };
    });
  });

  test('renders PDF pages and OCRs cleaned text', async () => {
    const { extractLabPdfTextWithOcr } = await import('./lab-pdf-ocr');
    const progress = vi.fn();
    const result = await extractLabPdfTextWithOcr(new File(['pdf'], 'labs.pdf', { type: 'application/pdf' }), progress);

    expect(getDocumentMock).toHaveBeenCalledWith({ data: expect.any(Uint8Array) });
    expect(getPageMock).toHaveBeenCalledTimes(2);
    expect(recognizeMock).toHaveBeenCalledTimes(2);
    expect(setParametersMock).toHaveBeenCalledWith({
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: 'auto',
      user_defined_dpi: '220',
    });
    expect(result).toEqual({
      pageCount: 2,
      text: 'Glucose 89 mg/dL 70-99 normal\n\nIGF-1 195 ng/mL 68-247 normal',
    });
    expect(progress).toHaveBeenCalledWith({ page: 1, pageCount: 2, status: 'loading tesseract', progress: 0.5 });
    expect(progress).toHaveBeenCalledWith({ page: 1, pageCount: 2, status: 'rendering', progress: 0 });
    expect(terminateMock).toHaveBeenCalled();
    expect(pdfDestroyMock).toHaveBeenCalled();
  });

  test('requires a browser document', async () => {
    Object.defineProperty(globalThis, 'document', { configurable: true, value: undefined });
    const { extractLabPdfTextWithOcr } = await import('./lab-pdf-ocr');

    await expect(extractLabPdfTextWithOcr(new File(['pdf'], 'labs.pdf'))).rejects.toThrow('PDF OCR must run in the browser.');
  });
});
