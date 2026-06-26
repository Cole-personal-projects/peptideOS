"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Camera,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  Grid3X3,
  ImageIcon,
  Pencil,
  RefreshCw,
  Share2,
  Table2,
  TestTube,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RangeBar, StatusDot } from '@/components/ui/visual-primitives';
import { useApp } from '@/lib/context';
import {
  buildLabProtocolContext,
  createManualLabDraft,
  parseLabCsv,
  parseLabText,
  persistLabImportDraft,
  type LabImportDraft,
  type LabImportRow,
} from '@/lib/lab-results';
import {
  buildLabComparison,
  buildLabMarkerDetail,
  buildLabTimelineCards,
  buildLabTrendsDashboard,
  formatResultValue,
  makeLabCompareHref,
  makeLabMarkerHref,
  type LabCompareRow,
} from '@/lib/lab-results-view';
import type { LabImportMethod, LabReport, LabResult } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LabAnalysisCard {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'watch' | 'caveat';
}

type LabView = 'timeline' | 'import' | 'detail' | 'compare' | 'trends';
type ImportMethod = LabImportMethod;

const today = new Date().toISOString().slice(0, 10);

const csvTemplates = [
  {
    label: 'Quest hormones',
    sourceLabel: 'Quest Diagnostics',
    panelName: 'Hormones',
    body: [
      'Test,Value,Unit,Reference Range,Flag,Assay',
      'Estradiol Sensitive,22,pg/mL,8-35,normal,LC/MS/MS',
      'Estradiol,31,pg/mL,8-35,normal,Immunoassay',
      'Testosterone Total,640,ng/dL,250-1100,normal,Immunoassay',
      'IGF-1,184,ng/mL,83-456,normal,',
    ].join('\n'),
  },
  {
    label: 'Labcorp metabolic',
    sourceLabel: 'LabCorp',
    panelName: 'Metabolic',
    body: [
      'Test,Value,Unit,Reference Range,Flag,Assay',
      'Glucose,88,mg/dL,70-99,normal,',
      'Hemoglobin A1c,5.2,%,4.8-5.6,normal,',
      'ALT,41,IU/L,0-44,normal,',
    ].join('\n'),
  },
];

const importMethods: Array<{
  id: ImportMethod;
  label: string;
  subtitle: string;
  icon: typeof Upload;
  tone: 'amber' | 'green' | 'teal' | 'primary';
}> = [
  { id: 'pdf', label: 'Upload PDF', subtitle: 'Quest, LabCorp, Ulta Lab Tests', icon: FileText, tone: 'amber' },
  { id: 'manual', label: 'Manual Entry', subtitle: 'Type values directly', icon: Pencil, tone: 'green' },
  { id: 'photo', label: 'Photo / Screenshot', subtitle: 'Camera or photo library', icon: Camera, tone: 'teal' },
  { id: 'csv', label: 'CSV / Spreadsheet', subtitle: 'Bulk import multiple tests', icon: Table2, tone: 'primary' },
];

interface PdfImportPayload {
  draft?: LabImportDraft;
  error?: string;
  extractedText?: string;
  pageCount?: number;
  mode?: string;
}

function shouldUsePdfOcrFallback(draft: LabImportDraft) {
  return draft.rows.length === 0
    || draft.parserConfidence < 0.65
    || draft.unresolvedRows.length > draft.rows.length;
}

async function readPdfImportPayload(response: Response): Promise<PdfImportPayload> {
  const contentType = response.headers.get('content-type') ?? '';
  const responseText = await response.text();
  if (!responseText) return {};

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(responseText) as PdfImportPayload;
    } catch {
      return { error: 'PDF parser returned an invalid response.' };
    }
  }

  return { error: response.ok ? undefined : responseText || `PDF parser failed with HTTP ${response.status}` };
}

function inferLabSourceLabel(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('labcorp') || lower.includes('laboratory corporation')) return 'LabCorp';
  if (lower.includes('quest diagnostics')) return 'Quest Diagnostics';
  if (lower.includes('ulta lab')) return 'Ulta Lab Tests';
  return undefined;
}

function inferLabPanelName(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('basic metabolic') || lower.includes('glucose') || lower.includes('creatinine')) return 'Metabolic';
  if (lower.includes('estradiol') || lower.includes('testosterone') || lower.includes('igf-1')) return 'Hormones';
  if (lower.includes('cholesterol') || lower.includes('triglycerides')) return 'Lipids';
  if (lower.includes('tsh') || lower.includes('thyroid')) return 'Thyroid';
  return undefined;
}

export default function LabsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, addLabImport, deleteLabReport } = useApp();

  const requestedView = (searchParams.get('view') as LabView | null) ?? 'timeline';
  const view = requestedView;
  const [importStep, setImportStep] = useState(0);
  const [importMethod, setImportMethod] = useState<ImportMethod>('csv');
  const [drawDate, setDrawDate] = useState(today);
  const [resultedDate, setResultedDate] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [panelName, setPanelName] = useState('');
  const [linkedStackId, setLinkedStackId] = useState('');
  const [notes, setNotes] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [pdfImportMessage, setPdfImportMessage] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [manualRow, setManualRow] = useState({ testName: '', assayMethod: '', value: '', unit: '', range: '', flag: 'unknown' });
  const [manualRows, setManualRows] = useState<LabImportRow[]>([]);
  const [draft, setDraft] = useState<LabImportDraft | null>(null);
  const [savedReport, setSavedReport] = useState<LabReport | null>(null);
  const [analysisCards, setAnalysisCards] = useState<LabAnalysisCard[]>([]);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const timelineCards = useMemo(() => buildLabTimelineCards(data), [data]);
  const dashboard = useMemo(() => buildLabTrendsDashboard(data), [data]);
  const reports = timelineCards.map((card) => card.report);
  const firstReportId = searchParams.get('first') ?? reports[0]?.id ?? '';
  const secondReportId = searchParams.get('second') ?? reports[1]?.id ?? reports[0]?.id ?? '';
  const detail = useMemo(
    () => buildLabMarkerDetail(data, searchParams.get('report') ?? reports[0]?.id ?? '', searchParams.get('marker') ?? ''),
    [data, reports, searchParams],
  );
  const comparison = useMemo(() => buildLabComparison(data, firstReportId, secondReportId), [data, firstReportId, secondReportId]);

  const activeStacks = data.stacks.filter((stack) => stack.status === 'active');
  const baseImportOptions = {
    drawDate,
    resultedDate: resultedDate || undefined,
    sourceLabel,
    panelName,
    linkedStackId: linkedStackId || undefined,
    notes,
    existingReports: data.labReports,
  };

  const setWorkspaceView = (nextView: LabView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'timeline') params.delete('view');
    else params.set('view', nextView);
    router.replace(params.toString() ? `/labs?${params.toString()}` : '/labs', { scroll: false });
  };

  const chooseImportMethod = (method: ImportMethod) => {
    setImportMethod(method);
    setDraft(null);
    setImportStep(1);
  };

  const buildDraft = () => {
    if (importMethod === 'pdf' || importMethod === 'photo') return;
    const nextDraft = importMethod === 'csv'
      ? parseLabCsv(rawInput, baseImportOptions)
      : importMethod === 'text'
        ? parseLabText(rawInput, baseImportOptions)
        : createManualLabDraft({ ...baseImportOptions, rows: manualRows });
    setDraft(nextDraft);
    setImportStep(2);
  };

const applyPdfDraft = (nextDraft: LabImportDraft, pageCount: number | undefined, mode: 'text' | 'ai' | 'ocr') => {
setDraft(nextDraft);
setSourceLabel(nextDraft.sourceLabel ?? sourceLabel);
setPanelName(nextDraft.panelName ?? panelName);
const pageLabel = pageCount ? ` from ${pageCount} page${pageCount === 1 ? '' : 's'}` : '';
const modeLabel = mode === 'ai' ? 'Peppi extracted' : mode === 'ocr' ? 'OCR parsed' : 'Parsed';
setPdfImportMessage(`${modeLabel} ${nextDraft.rows.length} marker${nextDraft.rows.length === 1 ? '' : 's'}${pageLabel}. Review before saving.`);
setImportStep(2);
};

  const saveDraft = async () => {
    if (!draft || draft.rows.length === 0) return;
    setIsSavingImport(true);
    const persisted = persistLabImportDraft(draft);
    try {
      await addLabImport(persisted);
      setSavedReport(persisted.report);
      setDraft(null);
      setRawInput('');
      setManualRows([]);
      setSelectedFileName('');
      setImportStep(3);
    } finally {
      setIsSavingImport(false);
    }
  };

  const updateDraftRow = (index: number, updates: Partial<LabImportRow>) => {
    setDraft((previous) => previous ? {
      ...previous,
      rows: previous.rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...updates } : row),
    } : previous);
  };

  const removeDraftRow = (index: number) => {
    setDraft((previous) => previous ? {
      ...previous,
      rows: previous.rows.filter((_, rowIndex) => rowIndex !== index),
    } : previous);
  };

  const convertUnresolvedRow = (index: number) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const raw = previous.unresolvedRows[index];
      if (!raw) return previous;

      return {
        ...previous,
        rows: [
          ...previous.rows,
          {
            testName: raw,
            value: '',
            unit: '',
            flag: 'unknown',
            panelName: previous.panelName,
          },
        ],
        unresolvedRows: previous.unresolvedRows.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  };

  const removeUnresolvedRow = (index: number) => {
    setDraft((previous) => previous ? {
      ...previous,
      unresolvedRows: previous.unresolvedRows.filter((_, rowIndex) => rowIndex !== index),
    } : previous);
  };

  const addManualRow = () => {
    if (!manualRow.testName.trim() || !manualRow.value.trim()) return;
    setManualRows((previous) => [
      ...previous,
      {
        testName: manualRow.testName,
        assayMethod: manualRow.assayMethod || undefined,
        value: manualRow.value,
        unit: manualRow.unit,
        referenceRange: manualRow.range ? { text: manualRow.range } : undefined,
        flag: manualRow.flag as LabImportRow['flag'],
        panelName,
      },
    ]);
    setManualRow({ testName: '', assayMethod: '', value: '', unit: '', range: '', flag: 'unknown' });
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setPdfImportMessage(null);
    if (importMethod === 'csv' || importMethod === 'text') {
      setRawInput(await file.text());
      return;
    }
    if (importMethod !== 'pdf') return;

    setIsParsingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(baseImportOptions));
      const response = await fetch('/api/labs/parse-pdf', {
        method: 'POST',
        body: formData,
      });
const payload = await readPdfImportPayload(response);
      if (response.ok && payload.draft && !shouldUsePdfOcrFallback(payload.draft)) {
        applyPdfDraft(payload.draft, payload.pageCount ?? 1, 'text');
        return;
      }

setPdfImportMessage(payload.error ? `${payload.error} Asking Peppi to extract the PDF...` : 'Asking Peppi to extract this PDF...');
const aiFormData = new FormData();
aiFormData.append('file', file);
aiFormData.append('metadata', JSON.stringify(baseImportOptions));
if (payload.extractedText) aiFormData.append('extractedText', payload.extractedText);
const aiResponse = await fetch('/api/ai/parse-lab-pdf', {
method: 'POST',
body: aiFormData,
});
const aiPayload = await readPdfImportPayload(aiResponse);
if (aiResponse.ok && aiPayload.draft && aiPayload.draft.rows.length > 0) {
applyPdfDraft(aiPayload.draft, aiPayload.pageCount, 'ai');
return;
}

setPdfImportMessage(aiPayload.error ? `${aiPayload.error} Running local OCR...` : 'Running local OCR for this PDF...');
      const { extractLabPdfTextWithOcr } = await import('@/lib/lab-pdf-ocr');
      const ocrResult = await extractLabPdfTextWithOcr(file, (progress) => {
        const percent = typeof progress.progress === 'number' ? ` ${Math.round(progress.progress * 100)}%` : '';
        setPdfImportMessage(`OCR page ${progress.page} of ${progress.pageCount}: ${progress.status}${percent}`);
      });
      const ocrDraft = parseLabText(ocrResult.text, {
        ...baseImportOptions,
        sourceLabel: sourceLabel || inferLabSourceLabel(ocrResult.text),
        panelName: panelName || inferLabPanelName(ocrResult.text),
      });
      const pdfDraft: LabImportDraft = {
        ...ocrDraft,
        method: 'pdf',
      };
      applyPdfDraft(pdfDraft, ocrResult.pageCount, 'ocr');
    } catch (error) {
      setPdfImportMessage(error instanceof Error ? `Could not import PDF: ${error.message}` : 'Could not import PDF. Try manual entry.');
    } finally {
      setIsParsingPdf(false);
    }
  };

  const applyTemplate = (template: typeof csvTemplates[number]) => {
    setImportMethod('csv');
    setSourceLabel(template.sourceLabel);
    setPanelName(template.panelName);
    setRawInput(template.body);
    setDraft(null);
    setImportStep(1);
  };

  const analyzeLabs = async (reportId?: string) => {
    setIsAnalyzing(true);
    setAnalysisMessage(null);
    setAnalysisCards([]);
    const scopedReports = reportId ? data.labReports.filter((report) => report.id === reportId) : data.labReports;
    const scopedReportIds = new Set(scopedReports.map((report) => report.id));
    const scopedResults = reportId ? data.labResults.filter((result) => scopedReportIds.has(result.reportId)) : data.labResults;
    try {
      const response = await fetch('/api/ai/analyze-labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labReports: scopedReports,
          labResults: scopedResults,
          protocolContexts: scopedReports.map((report) => buildLabProtocolContext(data, report.drawDate)),
          stacks: data.stacks.map((stack) => ({ id: stack.id, name: stack.name, status: stack.status, startDate: stack.startDate, durationDays: stack.durationDays })),
        }),
      });
      const payload = await response.json() as { message?: string; cards?: LabAnalysisCard[]; error?: string };
      if (!response.ok) {
        setAnalysisMessage(payload.error ?? 'Peppi could not analyze these labs.');
        return;
      }
      setAnalysisMessage(payload.message ?? 'Peppi reviewed labs against PeptideOS records.');
      setAnalysisCards(Array.isArray(payload.cards) ? payload.cards : []);
    } catch {
      setAnalysisMessage('Peppi lab analysis unavailable right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const shareText = async (text: string) => {
    try {
      const canShare = 'share' in navigator;
      if (canShare) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShareMessage(canShare ? 'Share sheet opened.' : 'Summary copied.');
    } catch {
      setShareMessage('Share unavailable right now.');
    }
  };

  const showEmpty = timelineCards.length === 0 && view === 'timeline';

  return (
    <AppShell>
      <PageHeader
        title="Lab Results"
        backHref="/more"
        rightElement={
          <Button size="sm" onClick={() => { setWorkspaceView('import'); setImportStep(0); }}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
        }
      />

      <div className="space-y-4 p-4">
        {timelineCards.length > 0 && (
          <LabWorkspaceTabs view={view} onViewChange={setWorkspaceView} />
        )}

        {showEmpty ? (
          <EmptyLabs onImport={() => { setWorkspaceView('import'); setImportStep(0); }} />
        ) : view === 'import' ? (
          <ImportWizard
            step={importStep}
            method={importMethod}
            drawDate={drawDate}
            resultedDate={resultedDate}
            sourceLabel={sourceLabel}
            panelName={panelName}
            linkedStackId={linkedStackId}
            notes={notes}
          rawInput={rawInput}
          selectedFileName={selectedFileName}
          pdfImportMessage={pdfImportMessage}
          isParsingPdf={isParsingPdf}
          manualRow={manualRow}
            manualRows={manualRows}
            draft={draft}
          activeStacks={activeStacks}
          savedReport={savedReport}
          isSavingImport={isSavingImport}
            onStepChange={setImportStep}
            onChooseMethod={chooseImportMethod}
            onImportMethodChange={setImportMethod}
            onDrawDateChange={setDrawDate}
            onResultedDateChange={setResultedDate}
            onSourceLabelChange={setSourceLabel}
            onPanelNameChange={setPanelName}
            onLinkedStackIdChange={setLinkedStackId}
            onNotesChange={setNotes}
            onRawInputChange={setRawInput}
            onManualRowChange={setManualRow}
            onAddManualRow={addManualRow}
            onApplyTemplate={applyTemplate}
            onImportFile={importFile}
        onBuildDraft={buildDraft}
        onUpdateDraftRow={updateDraftRow}
        onRemoveDraftRow={removeDraftRow}
        onConvertUnresolvedRow={convertUnresolvedRow}
        onRemoveUnresolvedRow={removeUnresolvedRow}
        onSaveDraft={saveDraft}
            onViewTimeline={() => setWorkspaceView('timeline')}
          />
        ) : view === 'detail' ? (
          <MarkerDetailView detail={detail} onCompare={() => setWorkspaceView('compare')} onShare={shareText} />
        ) : view === 'compare' ? (
          <CompareView
            reports={reports}
            firstReportId={firstReportId}
            secondReportId={secondReportId}
            rows={comparison}
            onSelect={(first, second) => router.replace(makeLabCompareHref(first, second), { scroll: false })}
            onShare={shareText}
          />
        ) : view === 'trends' ? (
          <TrendsView dashboard={dashboard} />
        ) : (
          <TimelineView
            cards={timelineCards}
            analysisMessage={analysisMessage}
            analysisCards={analysisCards}
            isAnalyzing={isAnalyzing}
            onAnalyze={analyzeLabs}
            onDelete={deleteLabReport}
          />
        )}

        {shareMessage && <p className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">{shareMessage}</p>}
      </div>
    </AppShell>
  );
}

function LabWorkspaceTabs({ view, onViewChange }: { view: LabView; onViewChange: (view: LabView) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border bg-secondary p-1">
      {[
        ['timeline', 'Timeline'],
        ['compare', 'Compare'],
        ['trends', 'Trends'],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={cn('rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground', view === id && 'bg-card text-foreground shadow-sm')}
          onClick={() => onViewChange(id as LabView)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EmptyLabs({ onImport }: { onImport: () => void }) {
  return (
    <div className="pt-10">
      <Empty className="border-2 border-dashed bg-secondary/30 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Grid3X3 className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>No lab results yet</EmptyTitle>
          <EmptyDescription>
            Import test results to track marker trends, connect them to active protocols, and compare changes over time.
          </EmptyDescription>
          <Button onClick={onImport}>Import Lab Results</Button>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

function ImportWizard(props: {
  step: number;
  method: ImportMethod;
  drawDate: string;
  resultedDate: string;
  sourceLabel: string;
  panelName: string;
  linkedStackId: string;
  notes: string;
  rawInput: string;
  selectedFileName: string;
  pdfImportMessage: string | null;
  isParsingPdf: boolean;
  manualRow: { testName: string; assayMethod: string; value: string; unit: string; range: string; flag: string };
  manualRows: LabImportRow[];
  draft: LabImportDraft | null;
  activeStacks: Array<{ id: string; name: string }>;
  savedReport: LabReport | null;
  isSavingImport: boolean;
  onStepChange: (step: number) => void;
  onChooseMethod: (method: ImportMethod) => void;
  onImportMethodChange: (method: ImportMethod) => void;
  onDrawDateChange: (value: string) => void;
  onResultedDateChange: (value: string) => void;
  onSourceLabelChange: (value: string) => void;
  onPanelNameChange: (value: string) => void;
  onLinkedStackIdChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onRawInputChange: (value: string) => void;
  onManualRowChange: (value: { testName: string; assayMethod: string; value: string; unit: string; range: string; flag: string }) => void;
  onAddManualRow: () => void;
  onApplyTemplate: (template: typeof csvTemplates[number]) => void;
  onImportFile: (file: File | undefined) => Promise<void>;
  onBuildDraft: () => void;
  onUpdateDraftRow: (index: number, updates: Partial<LabImportRow>) => void;
  onRemoveDraftRow: (index: number) => void;
  onConvertUnresolvedRow: (index: number) => void;
  onRemoveUnresolvedRow: (index: number) => void;
  onSaveDraft: () => Promise<void>;
  onViewTimeline: () => void;
}) {
  const progress = [0, 1, 2, 3];
  return (
<div className="space-y-3">
      <div className="flex gap-1.5">
        {progress.map((item) => <div key={item} className={cn('h-1 flex-1 rounded-full bg-border', props.step >= item && 'bg-primary')} />)}
      </div>

      {props.step === 0 && <ImportMethodStep onChooseMethod={props.onChooseMethod} />}
      {props.step === 1 && <ImportInputStep {...props} />}
      {props.step === 2 && <ReviewStep {...props} />}
      {props.step === 3 && <ConfirmationStep report={props.savedReport} draft={props.draft} onViewTimeline={props.onViewTimeline} />}
    </div>
  );
}

function ImportMethodStep({ onChooseMethod }: { onChooseMethod: (method: ImportMethod) => void }) {
  return (
    <div className="space-y-3">
      <StepLabel>Step 1 of 4 · Choose method</StepLabel>
      {importMethods.map((method) => {
        const Icon = method.icon;
        return (
          <button
            key={method.id}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
            onClick={() => onChooseMethod(method.id)}
          >
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClass(method.tone))}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{method.label}</span>
              <span className="block text-xs text-muted-foreground">{method.subtitle}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        );
      })}
      <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-muted-foreground">
        Your lab data stays in your PeptideOS records. Do not include names, addresses, accession numbers, or other patient identifiers.
      </p>
    </div>
  );
}

function ImportInputStep(props: Parameters<typeof ImportWizard>[0]) {
const isPdf = props.method === 'pdf';
const isPhotoShell = props.method === 'photo';
const hasPdfDraft = Boolean(props.draft && props.method === 'pdf');
return (
<div className="space-y-4">
<StepLabel>Step 2 of 4 · Upload or enter results</StepLabel>
<ImportMetaFields {...props} />

{isPdf || isPhotoShell ? (
<PdfImportPanel {...props} />
) : props.method === 'manual' ? (
<ManualEntryFields {...props} />
) : (
        <CsvTextFields {...props} />
      )}

<WizardActions
backLabel="Back"
nextLabel={isPdf ? props.isParsingPdf ? 'Reading...' : hasPdfDraft ? 'Review Results' : 'Choose PDF' : 'Review Data'}
onBack={() => props.onStepChange(0)}
onNext={isPdf ? () => props.onStepChange(2) : props.onBuildDraft}
nextDisabled={isPhotoShell || props.isParsingPdf || (isPdf ? !hasPdfDraft : props.method === 'manual' ? props.manualRows.length === 0 : props.rawInput.trim().length === 0)}
/>
</div>
);
}

function ImportMetaFields(props: Parameters<typeof ImportWizard>[0]) {
const hasDetails = Boolean(props.sourceLabel || props.panelName || props.notes);
const showDetails = hasDetails || props.method !== 'pdf';
return (
<Card className="overflow-hidden">
<CardContent className="space-y-3 p-3">
<div className="grid grid-cols-2 gap-2">
<div className="space-y-1">
<Label htmlFor="lab-draw-date" className="text-[11px]">Lab date</Label>
<Input id="lab-draw-date" aria-label="Draw date" type="date" value={props.drawDate} onChange={(event) => props.onDrawDateChange(event.target.value)} />
</div>
<div className="space-y-1">
<Label htmlFor="lab-resulted-date" className="text-[11px]">Resulted</Label>
<Input id="lab-resulted-date" type="date" value={props.resultedDate} onChange={(event) => props.onResultedDateChange(event.target.value)} />
</div>
</div>
<select
aria-label="Active Protocol"
className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm"
value={props.linkedStackId}
onChange={(event) => props.onLinkedStackIdChange(event.target.value)}
>
<option value="">Baseline / no linked protocol</option>
{props.activeStacks.map((stack) => <option key={stack.id} value={stack.id}>{stack.name}</option>)}
</select>
<details className="group rounded-lg border bg-background/40 p-2" open={showDetails}>
<summary className="cursor-pointer list-none text-xs font-semibold text-muted-foreground">
<span>{hasDetails ? 'Report details' : 'Add provider, panel, or notes'}</span>
</summary>
<div className="mt-3 space-y-2">
<div className="grid grid-cols-2 gap-2">
<Input aria-label="Lab provider" placeholder="Provider" value={props.sourceLabel} onChange={(event) => props.onSourceLabelChange(event.target.value)} />
<Input aria-label="Panel name" placeholder="Panel" value={props.panelName} onChange={(event) => props.onPanelNameChange(event.target.value)} />
</div>
<Textarea value={props.notes} onChange={(event) => props.onNotesChange(event.target.value)} placeholder="Notes without patient identifiers" className="min-h-20" />
</div>
</details>
</CardContent>
</Card>
);
}

function PdfImportPanel(props: Parameters<typeof ImportWizard>[0]) {
const isPhoto = props.method === 'photo';
const compactName = compactFileName(props.selectedFileName);
const status = getPdfImportStatus(props);
const StatusIcon = status.icon;
return (
<Card className={cn('overflow-hidden', props.draft ? 'border-chart-3/40' : 'border-primary/20')}>
<CardContent className="space-y-4 p-4">
<div className="flex items-start gap-3">
<span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', status.tone)}>
{isPhoto ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
</span>
<div className="min-w-0 flex-1">
<p className="text-sm font-semibold">{isPhoto ? 'Photo import coming soon' : props.selectedFileName ? 'Lab PDF selected' : 'Upload lab PDF'}</p>
<p className="text-xs text-muted-foreground">{isPhoto ? 'Use manual entry or CSV/text for now.' : 'We extract the report date and marker rows before review.'}</p>
</div>
<Badge variant="outline" className={cn('shrink-0', status.badgeClass)}>{status.label}</Badge>
</div>

{props.selectedFileName ? (
<div className="flex items-center gap-2 rounded-xl border bg-secondary/40 p-2">
<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
<div className="min-w-0 flex-1">
<p className="truncate text-sm font-semibold">{compactName}</p>
<p className="text-[11px] text-muted-foreground">PDF selected</p>
</div>
<label className="shrink-0">
<span className="inline-flex h-8 cursor-pointer items-center rounded-md border px-3 text-xs font-semibold">Replace</span>
<input className="sr-only" type="file" accept={isPhoto ? 'image/*' : '.pdf'} onChange={(event) => void props.onImportFile(event.target.files?.[0])} />
</label>
</div>
) : (
<label className="block cursor-pointer rounded-2xl border border-dashed bg-secondary/25 p-5 text-center transition-colors hover:bg-secondary/45">
<Upload className="mx-auto h-6 w-6 text-primary" />
<span className="mt-2 block text-sm font-semibold">{isPhoto ? 'Choose image' : 'Choose PDF'}</span>
<span className="mt-1 block text-xs text-muted-foreground">{isPhoto ? 'Photo extraction is not active yet.' : 'PDF text, Peppi extraction, and OCR fallback are handled automatically.'}</span>
<input className="sr-only" type="file" accept={isPhoto ? 'image/*' : '.pdf'} onChange={(event) => void props.onImportFile(event.target.files?.[0])} />
</label>
)}

<div className="grid grid-cols-3 gap-2">
{status.steps.map((step) => (
<div key={step.label} className={cn('rounded-lg border px-2 py-2 text-center text-[11px] font-semibold', step.active ? 'border-primary/40 bg-primary/10 text-primary' : step.done ? 'border-chart-3/40 bg-chart-3/10 text-chart-3' : 'text-muted-foreground')}>
{step.label}
</div>
))}
</div>

{props.pdfImportMessage && (
<div className={cn('flex gap-2 rounded-xl border px-3 py-2 text-sm', status.messageClass)}>
<StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />
<p>{polishPdfImportMessage(props.pdfImportMessage)}</p>
</div>
)}

<div className="grid grid-cols-2 gap-2">
<Button variant="ghost" onClick={() => props.onImportMethodChange('manual')}>Use manual entry</Button>
<Button variant="ghost" onClick={() => props.onImportMethodChange('csv')}>Paste CSV/text</Button>
</div>
</CardContent>
</Card>
);
}

function compactFileName(fileName: string) {
if (!fileName) return '';
const extensionMatch = fileName.match(/(\.[a-z0-9]+)$/i);
const extension = extensionMatch?.[1] ?? '';
const base = extension ? fileName.slice(0, -extension.length) : fileName;
if (base.length <= 18) return fileName;
return `${base.slice(0, 6)}...${base.slice(-6)}${extension}`;
}

function polishPdfImportMessage(message: string) {
const lower = message.toLowerCase();
if (lower.includes('peppi extracted')) return message.replace('Peppi extracted', 'Ready for review');
if (lower.includes('ocr parsed')) return message.replace('OCR parsed', 'Ready for review');
if (lower.includes('parsed')) return message.replace('Parsed', 'Ready for review');
if (lower.includes('could not read pdf directly')) return 'Checking another extraction method.';
if (lower.includes('asking peppi')) return 'Using Peppi extraction.';
if (lower.includes('ocr page')) return message.replace(/^OCR page/i, 'Scanning page');
if (lower.includes('running local ocr')) return 'Scanning the PDF locally.';
return message;
}

function getPdfImportStatus(props: Parameters<typeof ImportWizard>[0]) {
const hasFile = Boolean(props.selectedFileName);
const hasDraft = Boolean(props.draft);
const isWorking = props.isParsingPdf;
const hasUnreadable = (props.draft?.unresolvedRows.length ?? 0) > 0;

if (hasDraft) {
return {
label: hasUnreadable ? 'Needs review' : 'Ready',
icon: hasUnreadable ? AlertCircle : Check,
tone: hasUnreadable ? 'bg-chart-4/15 text-chart-4' : 'bg-chart-3/15 text-chart-3',
badgeClass: hasUnreadable ? 'border-chart-4/40 text-chart-4' : 'border-chart-3/40 text-chart-3',
messageClass: hasUnreadable ? 'border-chart-4/35 bg-chart-4/10 text-foreground' : 'border-chart-3/35 bg-chart-3/10 text-foreground',
steps: [
{ label: 'Upload', done: true, active: false },
{ label: 'Extract', done: true, active: false },
{ label: 'Review', done: false, active: true },
],
};
}

if (isWorking) {
return {
label: 'Reading',
icon: RefreshCw,
tone: 'bg-primary/15 text-primary',
badgeClass: 'border-primary/40 text-primary',
messageClass: 'border-primary/25 bg-primary/10 text-foreground',
steps: [
{ label: 'Upload', done: true, active: false },
{ label: 'Extract', done: false, active: true },
{ label: 'Review', done: false, active: false },
],
};
}

return {
label: hasFile ? 'Selected' : 'Waiting',
icon: FileText,
tone: hasFile ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
badgeClass: hasFile ? 'border-primary/40 text-primary' : 'text-muted-foreground',
messageClass: 'border-border bg-secondary/30 text-muted-foreground',
steps: [
{ label: 'Upload', done: hasFile, active: !hasFile },
{ label: 'Extract', done: false, active: false },
{ label: 'Review', done: false, active: false },
],
};
}

function CsvTextFields(props: Parameters<typeof ImportWizard>[0]) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {csvTemplates.map((template) => (
            <Button key={template.label} type="button" size="sm" variant="outline" onClick={() => props.onApplyTemplate(template)}>
              {template.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant={props.method === 'text' ? 'default' : 'outline'} onClick={() => props.onImportMethodChange(props.method === 'text' ? 'csv' : 'text')}>
            Paste raw results
          </Button>
        </div>
        <Input type="file" accept=".csv,.tsv,.txt" onChange={(event) => void props.onImportFile(event.target.files?.[0])} />
        <Textarea
          value={props.rawInput}
          onChange={(event) => props.onRawInputChange(event.target.value)}
          rows={8}
          placeholder={props.method === 'text' ? 'Estradiol Sensitive LC/MS/MS 22 pg/mL 8-35 normal' : 'Test,Value,Unit,Reference Range,Flag,Assay'}
        />
      </CardContent>
    </Card>
  );
}

function ManualEntryFields(props: Parameters<typeof ImportWizard>[0]) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
        <Input aria-label="Manual test name" value={props.manualRow.testName} onChange={(event) => props.onManualRowChange({ ...props.manualRow, testName: event.target.value })} placeholder="Test name" />
        <Input aria-label="Manual assay method" value={props.manualRow.assayMethod} onChange={(event) => props.onManualRowChange({ ...props.manualRow, assayMethod: event.target.value })} placeholder="Assay/method" />
        <Input aria-label="Manual result value" value={props.manualRow.value} onChange={(event) => props.onManualRowChange({ ...props.manualRow, value: event.target.value })} placeholder="Value" />
        <Input aria-label="Manual result unit" value={props.manualRow.unit} onChange={(event) => props.onManualRowChange({ ...props.manualRow, unit: event.target.value })} placeholder="Unit" />
        <Input aria-label="Manual reference range" value={props.manualRow.range} onChange={(event) => props.onManualRowChange({ ...props.manualRow, range: event.target.value })} placeholder="Reference range" />
        <Input aria-label="Manual result flag" value={props.manualRow.flag} onChange={(event) => props.onManualRowChange({ ...props.manualRow, flag: event.target.value })} placeholder="normal, high, low" />
        </div>
        <Button type="button" variant="outline" onClick={props.onAddManualRow}>Add row</Button>
        {props.manualRows.length > 0 && <p className="text-sm text-muted-foreground">{props.manualRows.length} manual rows queued.</p>}
      </CardContent>
    </Card>
  );
}

function ReviewStep(props: Parameters<typeof ImportWizard>[0]) {
  const flagged = props.draft?.rows.filter((row) => row.flag === 'high' || row.flag === 'low' || row.flag === 'critical') ?? [];
  return (
    <div className="space-y-4">
      <StepLabel>Step 3 of 4 · Review & validate</StepLabel>
      {flagged.length > 0 && (
        <div className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">{flagged.length} flagged marker{flagged.length === 1 ? '' : 's'}</p>
            <p className="text-muted-foreground">Review values and reference ranges before saving.</p>
          </div>
        </div>
      )}
      <Card className={props.draft?.duplicateStatus === 'possible-duplicate' ? 'border-chart-4/50 bg-chart-4/10' : undefined}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Review import</span>
            <span className="text-xs font-normal text-muted-foreground">{Math.round((props.draft?.parserConfidence ?? 0) * 100)}% parsed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.draft?.duplicateStatus === 'possible-duplicate' && <p className="rounded-md border bg-background px-3 py-2 text-sm">This looks like a lab set you already imported.</p>}
          <div className="max-h-[30rem] overflow-auto rounded-lg border">
            {props.draft?.rows.map((row, index) => (
              <div key={`${row.testName}-${index}`} className="space-y-3 border-b p-3 text-sm last:border-b-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Result {index + 1}</p>
                  <Button type="button" size="icon" variant="ghost" aria-label="Remove lab result row" onClick={() => props.onRemoveDraftRow(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input aria-label={`Test name ${index + 1}`} value={row.testName} onChange={(event) => props.onUpdateDraftRow(index, { testName: event.target.value })} />
                  <Input aria-label={`Assay method ${index + 1}`} value={row.assayMethod ?? ''} onChange={(event) => props.onUpdateDraftRow(index, { assayMethod: event.target.value || undefined })} placeholder="Assay/method" />
                  <Input aria-label={`Result value ${index + 1}`} value={row.value} onChange={(event) => props.onUpdateDraftRow(index, { value: event.target.value })} />
                  <Input aria-label={`Result unit ${index + 1}`} value={row.unit} onChange={(event) => props.onUpdateDraftRow(index, { unit: event.target.value })} placeholder="Unit" />
                  <Input aria-label={`Reference range ${index + 1}`} value={row.referenceRange?.text ?? ''} onChange={(event) => props.onUpdateDraftRow(index, { referenceRange: event.target.value ? { text: event.target.value } : undefined })} placeholder="Reference range" />
                  <Input aria-label={`Result flag ${index + 1}`} value={row.flag} onChange={(event) => props.onUpdateDraftRow(index, { flag: event.target.value as LabImportRow['flag'] })} placeholder="normal, high, low" />
                </div>
              </div>
            ))}
          </div>
          {(props.draft?.unresolvedRows.length ?? 0) > 0 && (
            <div className="space-y-2 rounded-lg border border-chart-4/40 bg-chart-4/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-chart-4" />
                <div>
                  <p className="text-sm font-semibold">{props.draft?.unresolvedRows.length} unreadable row{props.draft?.unresolvedRows.length === 1 ? '' : 's'}</p>
                  <p className="text-xs text-muted-foreground">Review each line. Add real lab markers as editable results, or dismiss non-result text.</p>
                </div>
              </div>
              <div className="max-h-56 space-y-2 overflow-auto">
                {props.draft?.unresolvedRows.map((row, index) => (
                  <div key={`${row}-${index}`} className="rounded-md border bg-background/80 p-2">
                    <p className="break-words text-xs text-muted-foreground">{row}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => props.onConvertUnresolvedRow(index)}>Add as result</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => props.onRemoveUnresolvedRow(index)}>Dismiss</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <WizardActions
        backLabel="Back"
        nextLabel={props.isSavingImport ? 'Saving...' : 'Confirm Import'}
        onBack={() => props.onStepChange(1)}
        onNext={() => void props.onSaveDraft()}
        nextDisabled={props.isSavingImport || !props.draft || props.draft.rows.length === 0}
      />
    </div>
  );
}

function ConfirmationStep({ report, onViewTimeline }: { report: LabReport | null; draft: LabImportDraft | null; onViewTimeline: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/15 text-chart-3">
          <Check className="h-6 w-6" />
        </span>
        <div>
          <p className="font-semibold">Import complete</p>
          <p className="text-sm text-muted-foreground">Results saved to your lab timeline.</p>
        </div>
        <div className="rounded-lg border text-left text-sm">
          <SummaryRow label="Date" value={report ? formatDate(report.drawDate) : 'Saved'} />
          <SummaryRow label="Provider" value={report?.sourceLabel || 'Not specified'} />
          <SummaryRow label="Panel" value={report?.panelName || 'Lab results'} />
        </div>
        <Button className="w-full" onClick={onViewTimeline}>View Timeline</Button>
      </CardContent>
    </Card>
  );
}

function TimelineView(props: {
  cards: ReturnType<typeof buildLabTimelineCards>;
  analysisMessage: string | null;
  analysisCards: LabAnalysisCard[];
  isAnalyzing: boolean;
  onAnalyze: (reportId?: string) => void;
  onDelete: (reportId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Peppi lab analysis</span>
            <Button size="sm" variant="outline" onClick={() => props.onAnalyze()} disabled={props.cards.length === 0 || props.isAnalyzing}>
              {props.isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Peppi explains trends against local protocol records. It does not diagnose, recommend dose changes, or determine safety.</p>
          {props.analysisMessage && <p className="rounded-md border bg-background px-3 py-2 text-sm">{props.analysisMessage}</p>}
          {props.analysisCards.map((card) => (
            <div key={card.id} className="rounded-md border bg-background p-3 text-sm">
              <p className="font-medium">{card.title}</p>
              <p className="text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {props.cards.map((card) => (
        <Card key={card.report.id} className="overflow-hidden">
          <CardContent className="p-0">
<div className="flex items-start justify-between gap-3 border-b px-3.5 py-3">
<div className="min-w-0">
<p className="truncate text-sm font-semibold">{formatDate(card.report.drawDate)}{card.report.panelName ? ` · ${card.report.panelName}` : ''}</p>
                <p className="text-xs text-muted-foreground">{card.report.sourceLabel || 'Source not specified'} · {card.markerCount} marker{card.markerCount === 1 ? '' : 's'}</p>
              </div>
<Badge variant="outline" className="shrink-0 border-primary/40 bg-primary/10 text-primary">{card.stackLabel}</Badge>
            </div>
<div className="space-y-1.5 p-2.5">
              {card.markers.slice(0, 6).map((marker) => (
                <Link key={marker.id} href={makeLabMarkerHref(card.report.id, { id: marker.id, normalizedKey: marker.normalizedKey })} className="grid grid-cols-[1fr_auto] gap-3 rounded-[14px] bg-secondary/60 px-3 py-2">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <StatusDot tone={marker.flag === 'high' || marker.flag === 'low' || marker.flag === 'critical' ? 'danger' : 'success'} className="h-2 w-2" />
                      <span className="block truncate text-sm font-bold">{marker.name}</span>
                    </span>
                    <span className="mt-2 block">
                      <RangeBar percent={marker.flag === 'high' || marker.flag === 'critical' ? 92 : marker.flag === 'low' ? 18 : 56} label={marker.rangeLabel} tone={marker.flag === 'high' || marker.flag === 'low' || marker.flag === 'critical' ? 'danger' : 'primary'} />
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={cn('block text-sm font-bold', flagClass(marker.flag))}>{marker.valueLabel}</span>
                    {marker.trend && <TrendBadge direction={marker.trend.direction} percent={marker.trend.percent} />}
                  </span>
                </Link>
              ))}
              {card.markerCount > 6 && <p className="px-1 text-xs text-muted-foreground">+{card.markerCount - 6} more markers</p>}
            </div>
<div className="grid grid-cols-4 gap-2 border-t bg-secondary/30 p-2.5">
              <Button variant="outline" size="sm" asChild><Link href={makeLabCompareHref(card.report.id)}>Compare</Link></Button>
              <Button variant="outline" size="sm">Notes</Button>
              <Button variant="outline" size="sm" onClick={() => props.onAnalyze(card.report.id)}>Analyze</Button>
              <Button variant="ghost" size="icon" aria-label="Delete lab report" onClick={() => props.onDelete(card.report.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MarkerDetailView({ detail, onCompare, onShare }: { detail: ReturnType<typeof buildLabMarkerDetail>; onCompare: () => void; onShare: (text: string) => void }) {
  if (!detail) {
    return <Empty><EmptyHeader><EmptyTitle>Marker not found</EmptyTitle><EmptyDescription>Select a marker from the timeline.</EmptyDescription></EmptyHeader></Empty>;
  }
  const latest = detail.result.numericValue ?? 0;
  const rangeLow = detail.result.referenceRange?.low;
  const rangeHigh = detail.result.referenceRange?.high;
  const rangePercent = rangeLow !== undefined && rangeHigh !== undefined && rangeHigh > rangeLow
    ? Math.min(100, Math.max(0, ((latest - rangeLow) / (rangeHigh - rangeLow)) * 100))
    : 50;
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="space-y-4 border-b p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{detail.result.testName}</p>
                <p className="text-sm text-muted-foreground">{detail.result.unit || 'unit not specified'} · Ref: {detail.result.referenceRange?.text ?? 'not specified'}</p>
              </div>
              <div className="text-right">
<p className={cn('text-xl font-bold leading-none', flagClass(detail.result.flag))}>{detail.result.value}</p>
                {detail.latestTrend && <TrendBadge direction={detail.latestTrend.direction} percent={detail.latestTrend.percent} />}
              </div>
            </div>
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ width: `${rangePercent}%` }} />
              </div>
<div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{rangeLow ?? 'Low'}</span>
                <span>Reference range</span>
                <span>{rangeHigh ?? 'High'}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-xs font-medium text-muted-foreground">Trend</p>
            <TrendBars points={detail.comparablePoints.length ? detail.comparablePoints : detail.points} />
            {detail.mixedAssays && <p className="rounded-md border border-chart-4/40 bg-chart-4/10 px-3 py-2 text-xs text-muted-foreground">Assay or unit changed across this trend. Compare cautiously.</p>}
          </div>
          <div className="border-t bg-secondary/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Active protocol during test</p>
            <p className="text-sm font-medium">{detail.stackLabel}</p>
            <p className="text-xs text-muted-foreground">{formatDate(detail.report.drawDate)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onCompare}>Compare Tests</Button>
        <Button variant="outline" onClick={() => onShare(`${detail.result.testName}: ${formatResultValue(detail.result)} on ${formatDate(detail.report.drawDate)}`)}>
          <Share2 className="h-4 w-4" /> Share Result
        </Button>
      </div>
    </div>
  );
}

function CompareView({
  reports,
  firstReportId,
  secondReportId,
  rows,
  onSelect,
  onShare,
}: {
  reports: LabReport[];
  firstReportId: string;
  secondReportId: string;
  rows: LabCompareRow[];
  onSelect: (first: string, second: string) => void;
  onShare: (text: string) => void;
}) {
  const first = reports.find((report) => report.id === firstReportId);
  const second = reports.find((report) => report.id === secondReportId);
  const comparableRows = rows.filter((row) => row.status === 'matched');
  const reviewRows = rows.filter((row) => row.status !== 'matched');
  const reportLabel = `${first ? formatDate(first.drawDate) : 'Test 1'} vs ${second ? formatDate(second.drawDate) : 'Test 2'}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateSelect label="Test 1" value={firstReportId} reports={reports} onChange={(value) => onSelect(value, secondReportId)} />
        <DateSelect label="Test 2" value={secondReportId} reports={reports} onChange={(value) => onSelect(firstReportId, value)} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Comparable" value={String(comparableRows.length)} accent />
        <StatCard label="Needs review" value={String(reviewRows.length)} />
        <StatCard label="Markers" value={String(rows.length)} />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Comparable changes</p>
              <p className="text-xs text-muted-foreground">Same marker, unit, assay, and numeric value.</p>
            </div>
            <Badge variant="outline">{reportLabel}</Badge>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Import at least two reports to compare.</p>
          ) : comparableRows.length === 0 ? (
            <p className="rounded-md border border-chart-4/40 bg-chart-4/10 p-4 text-sm text-muted-foreground">
              No reliable deltas yet. Check the review queue for unit, assay, missing, or non-numeric mismatches.
            </p>
          ) : (
            <div className="space-y-2">
              {comparableRows.map((row) => <CompareRowCard key={row.key} row={row} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {reviewRows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Needs review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviewRows.map((row) => <CompareReviewRow key={row.key} row={row} />)}
          </CardContent>
        </Card>
      )}

      <Card className="border-accent/40 bg-accent/10">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Summary</p>
          {comparableRows.length === 0 ? (
            <p className="text-muted-foreground">No reliable numeric changes are available for these two reports.</p>
          ) : (
            comparableRows.slice(0, 4).map((row) => (
              <p key={row.key} className="text-muted-foreground">{row.marker}: {formatDelta(row)}</p>
            ))
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        onClick={() => onShare(`Lab comparison: ${reportLabel}. Comparable markers: ${comparableRows.length}. Needs review: ${reviewRows.length}.`)}
      >
        <Copy className="h-4 w-4" />
        Share Comparison
      </Button>
    </div>
  );
}

function CompareRowCard({ row }: { row: LabCompareRow }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{row.marker}</p>
          <p className="text-xs text-muted-foreground">{formatCompareValues(row)}</p>
        </div>
        <span className={cn('text-right text-lg font-semibold tabular-nums', deltaClass(row.deltaPercent))}>{formatDelta(row)}</span>
      </div>
    </div>
  );
}

function CompareReviewRow({ row }: { row: LabCompareRow }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{row.marker}</p>
          <p className="text-xs text-muted-foreground">{formatCompareValues(row)}</p>
        </div>
        <Badge variant="outline">{compareStatusLabel(row.status)}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{row.issue ?? compareStatusLabel(row.status)}</p>
    </div>
  );
}

function TrendsView({ dashboard }: { dashboard: ReturnType<typeof buildLabTrendsDashboard> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Tests" value={String(dashboard.totalReports)} />
        <StatCard label="Markers" value={String(dashboard.markersTracked)} />
        <StatCard label="Changing" value={String(dashboard.improvingCount)} accent />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Key marker trends</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {dashboard.keyTrends.length === 0 ? <p className="text-sm text-muted-foreground">Import labs to build trends.</p> : dashboard.keyTrends.map((trend) => (
            <div key={trend.key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{trend.label}</span>
                {trend.latestTrend ? <TrendBadge direction={trend.latestTrend.direction} percent={trend.latestTrend.percent} /> : <span className="text-xs text-muted-foreground">1 point</span>}
              </div>
              <TrendBars points={trend.points} compact />
              {trend.mixedAssays && <p className="text-xs text-chart-4">Assay or unit changed. Compare cautiously.</p>}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Marker correlations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {dashboard.correlations.length === 0 ? <p className="text-sm text-muted-foreground">Not enough data.</p> : dashboard.correlations.map((correlation) => (
            <div key={correlation.label} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0">
              <span>{correlation.label}</span>
              <Badge variant="outline">{correlation.coefficient.toFixed(2)} {correlation.strength}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Protocol performance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dashboard.stackPerformance.length === 0 ? <p className="text-sm text-muted-foreground">Link a lab import to a protocol to see protocol-level summaries.</p> : dashboard.stackPerformance.map((item) => (
            <div key={item.stackId} className="border-l-2 border-accent pl-3 text-sm">
              <p className="font-semibold">{item.stackName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(item.latestDate)} · {item.reportCount} report{item.reportCount === 1 ? '' : 's'}</p>
              <p>{item.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}

function WizardActions({ backLabel, nextLabel, onBack, onNext, nextDisabled }: { backLabel: string; nextLabel: string; onBack: () => void; onNext: () => void | Promise<void>; nextDisabled?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={onBack}>{backLabel}</Button>
      <Button onClick={onNext} disabled={nextDisabled}>{nextLabel}</Button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b px-3 py-2 last:border-b-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function DateSelect({ label, value, reports, onChange }: { label: string; value: string; reports: LabReport[]; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {reports.map((report) => <option key={report.id} value={report.id}>{formatDate(report.drawDate)}</option>)}
      </select>
    </label>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <Card><CardContent className="p-3"><p className={cn('text-xl font-bold', accent && 'text-chart-3')}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>;
}

function TrendBars({ points, compact }: { points: Array<{ numericValue?: number; drawDate: string }>; compact?: boolean }) {
  const numeric = points.filter((point) => typeof point.numericValue === 'number').slice(-6);
  if (numeric.length === 0) return <p className="text-xs text-muted-foreground">No numeric trend yet.</p>;
  const max = Math.max(...numeric.map((point) => point.numericValue as number), 1);
  return (
    <div>
      <div className={cn('flex items-end gap-1.5', compact ? 'h-8' : 'h-14')}>
        {numeric.map((point, index) => (
          <div key={`${point.drawDate}-${index}`} className="flex-1 rounded-t bg-primary/35 last:bg-primary" style={{ height: `${Math.max(10, ((point.numericValue as number) / max) * 100)}%` }} />
        ))}
      </div>
{!compact && <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">{numeric.map((point) => <span key={point.drawDate}>{formatMonth(point.drawDate)}</span>)}</div>}
    </div>
  );
}

function TrendBadge({ direction, percent }: { direction: 'up' | 'down' | 'flat'; percent: number }) {
  const Icon = direction === 'down' ? TrendingDown : TrendingUp;
  return <span className={cn('inline-flex items-center justify-end gap-0.5 text-xs font-medium', direction === 'down' ? 'text-accent' : direction === 'up' ? 'text-destructive' : 'text-muted-foreground')}><Icon className="h-3 w-3" /> {percent}%</span>;
}

function formatDelta(row: LabCompareRow) {
  if (row.status !== 'matched') return row.issue ?? compareStatusLabel(row.status);
  if (row.deltaValue === undefined || row.deltaPercent === undefined) return 'No delta';
  const unit = row.first?.unit ? ` ${row.first.unit}` : '';
  const absolute = `${row.deltaValue > 0 ? '+' : ''}${formatNumber(row.deltaValue)}${unit}`;
  const percent = `${row.deltaPercent > 0 ? '+' : ''}${Math.round(row.deltaPercent)}%`;
  return `${absolute} (${percent})`;
}

function formatCompareValues(row: LabCompareRow) {
  const first = row.first ? formatResultValue(row.first) : 'Missing';
  const second = row.second ? formatResultValue(row.second) : 'Missing';
  return `${first} vs ${second}`;
}

function compareStatusLabel(status: LabCompareRow['status']) {
  switch (status) {
    case 'matched':
      return 'Comparable';
    case 'assay-mismatch':
      return 'Assay differs';
    case 'unit-mismatch':
      return 'Unit differs';
    case 'non-numeric':
      return 'Text value';
    case 'missing':
      return 'Missing';
  }
}

function formatNumber(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function flagClass(flag: LabResult['flag']) {
  if (flag === 'high' || flag === 'critical') return 'text-destructive';
  if (flag === 'low') return 'text-accent';
  return '';
}

function deltaClass(delta?: number) {
  if (delta === undefined || Math.abs(delta) < 1) return 'text-muted-foreground';
  return delta > 0 ? 'text-destructive' : 'text-accent';
}

function toneClass(tone: 'amber' | 'green' | 'teal' | 'primary') {
  switch (tone) {
    case 'amber':
      return 'bg-chart-4/15 text-chart-4';
    case 'green':
      return 'bg-chart-3/15 text-chart-3';
    case 'teal':
      return 'bg-accent/15 text-accent';
    case 'primary':
      return 'bg-primary/15 text-primary';
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonth(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short' });
}
