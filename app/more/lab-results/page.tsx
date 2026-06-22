"use client";

import { useMemo, useState } from 'react';
import { Bot, FileText, Plus, Save, TestTube, Trash2, TrendingUp, Upload, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import {
  buildLabProtocolContext,
  buildLabTrends,
  createManualLabDraft,
  hasMixedAssays,
  parseLabCsv,
  parseLabText,
  persistLabImportDraft,
  type LabImportDraft,
  type LabImportRow,
} from '@/lib/lab-results';
import type { LabReport, LabResult } from '@/lib/types';

interface LabAnalysisCard {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'watch' | 'caveat';
}

const today = new Date().toISOString().slice(0, 10);

const csvTemplates = [
  {
    label: 'Quest hormones',
    sourceLabel: 'Quest',
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
    sourceLabel: 'Labcorp',
    panelName: 'Metabolic',
    body: [
      'Test,Value,Unit,Reference Range,Flag,Assay',
      'Glucose,88,mg/dL,70-99,normal,',
      'Hemoglobin A1c,5.2,%,4.8-5.6,normal,',
      'ALT,41,IU/L,0-44,normal,',
    ].join('\n'),
  },
];

export default function LabResultsPage() {
  const { data, addLabImport, deleteLabReport } = useApp();
  const [importMode, setImportMode] = useState<'csv' | 'text' | 'manual'>('csv');
  const [drawDate, setDrawDate] = useState(today);
  const [resultedDate, setResultedDate] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [panelName, setPanelName] = useState('');
  const [notes, setNotes] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [manualRow, setManualRow] = useState({ testName: '', assayMethod: '', value: '', unit: '', range: '', flag: 'unknown' });
  const [manualRows, setManualRows] = useState<LabImportRow[]>([]);
  const [draft, setDraft] = useState<LabImportDraft | null>(null);
  const [analysisCards, setAnalysisCards] = useState<LabAnalysisCard[]>([]);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const reports = useMemo(
    () => [...data.labReports].sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()),
    [data.labReports],
  );
  const resultsByReport = useMemo(() => groupResultsByReport(data.labResults), [data.labResults]);
  const trends = useMemo(() => buildLabTrends(data.labResults, data.labReports), [data.labResults, data.labReports]);

  const baseImportOptions = {
    drawDate,
    resultedDate: resultedDate || undefined,
    sourceLabel,
    panelName,
    notes,
    existingReports: data.labReports,
  };

  const applyTemplate = (template: typeof csvTemplates[number]) => {
    setImportMode('csv');
    setSourceLabel(template.sourceLabel);
    setPanelName(template.panelName);
    setRawInput(template.body);
    setDraft(null);
  };

  const buildDraft = () => {
    const nextDraft = importMode === 'csv'
      ? parseLabCsv(rawInput, baseImportOptions)
      : importMode === 'text'
        ? parseLabText(rawInput, baseImportOptions)
        : createManualLabDraft({ ...baseImportOptions, rows: manualRows });
    setDraft(nextDraft);
  };

  const saveDraft = () => {
    if (!draft || draft.rows.length === 0) return;
    addLabImport(persistLabImportDraft(draft));
    setDraft(null);
    setRawInput('');
    setManualRows([]);
  };

  const updateDraftRow = (index: number, updates: Partial<LabImportRow>) => {
    setDraft((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        rows: previous.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)),
      };
    });
  };

  const removeDraftRow = (index: number) => {
    setDraft((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        rows: previous.rows.filter((_, rowIndex) => rowIndex !== index),
      };
    });
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
    setRawInput(await file.text());
    setImportMode('csv');
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
      setAnalysisMessage(payload.message ?? (reportId ? 'Peppi reviewed this lab report against your PeptideOS records.' : 'Peppi reviewed labs against your PeptideOS records.'));
      setAnalysisCards(Array.isArray(payload.cards) ? payload.cards : []);
    } catch {
      setAnalysisMessage('Peppi lab analysis is unavailable right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Lab Results"
        backHref="/more"
        rightElement={
          <Button size="sm" onClick={buildDraft}>
            <Plus className="w-4 h-4" />
            Review import
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-4 h-4 text-primary" />
              Import labs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Store test data, dates, assay details, and a non-PHI import key. Do not paste patient names, accession numbers, addresses, or clinician identifiers.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lab-draw-date">Draw date</Label>
                <Input id="lab-draw-date" type="date" value={drawDate} onChange={(event) => setDrawDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab-resulted-date">Resulted date</Label>
                <Input id="lab-resulted-date" type="date" value={resultedDate} onChange={(event) => setResultedDate(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lab-source">Source label</Label>
                <Input id="lab-source" value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="Quest, Labcorp, Marek" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lab-panel">Panel</Label>
                <Input id="lab-panel" value={panelName} onChange={(event) => setPanelName(event.target.value)} placeholder="Hormones, CMP, CBC" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['csv', 'text', 'manual'] as const).map((mode) => (
                <Button key={mode} type="button" variant={importMode === mode ? 'default' : 'outline'} onClick={() => setImportMode(mode)}>
                  {mode === 'csv' ? 'CSV/TSV' : mode === 'text' ? 'Paste text' : 'Manual'}
                </Button>
              ))}
            </div>

            {importMode === 'csv' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {csvTemplates.map((template) => (
                    <Button key={template.label} type="button" size="sm" variant="outline" onClick={() => applyTemplate(template)}>
                      {template.label}
                    </Button>
                  ))}
                </div>
                <Input type="file" accept=".csv,.tsv,.txt" onChange={(event) => void importFile(event.target.files?.[0])} />
                <Textarea value={rawInput} onChange={(event) => setRawInput(event.target.value)} rows={7} placeholder={'Test,Value,Unit,Reference Range,Flag,Assay\nEstradiol Sensitive,22,pg/mL,8-35,normal,LC/MS/MS'} />
              </div>
            )}

            {importMode === 'text' && (
              <Textarea value={rawInput} onChange={(event) => setRawInput(event.target.value)} rows={8} placeholder="Estradiol, Sensitive LC/MS/MS 22 pg/mL 8-35 normal" />
            )}

            {importMode === 'manual' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input value={manualRow.testName} onChange={(event) => setManualRow({ ...manualRow, testName: event.target.value })} placeholder="Test name" />
                  <Input value={manualRow.assayMethod} onChange={(event) => setManualRow({ ...manualRow, assayMethod: event.target.value })} placeholder="Assay/method" />
                  <Input value={manualRow.value} onChange={(event) => setManualRow({ ...manualRow, value: event.target.value })} placeholder="Value" />
                  <Input value={manualRow.unit} onChange={(event) => setManualRow({ ...manualRow, unit: event.target.value })} placeholder="Unit" />
                  <Input value={manualRow.range} onChange={(event) => setManualRow({ ...manualRow, range: event.target.value })} placeholder="Reference range" />
                  <Input value={manualRow.flag} onChange={(event) => setManualRow({ ...manualRow, flag: event.target.value })} placeholder="normal, high, low" />
                </div>
                <Button type="button" variant="outline" onClick={addManualRow}>Add row</Button>
                {manualRows.length > 0 && <p className="text-sm text-muted-foreground">{manualRows.length} manual rows queued.</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lab-notes">Notes</Label>
              <Textarea id="lab-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional context without personal identifiers" />
            </div>
          </CardContent>
        </Card>

        {draft && (
          <Card className={draft.duplicateStatus === 'possible-duplicate' ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20' : undefined}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span>Review import</span>
                <span className="text-xs font-normal text-muted-foreground">{Math.round(draft.parserConfidence * 100)}% parsed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.duplicateStatus === 'possible-duplicate' && (
                <p className="rounded-md border border-amber-300 bg-background px-3 py-2 text-sm">This looks like a lab set you already imported.</p>
              )}
              <div className="max-h-[28rem] overflow-auto rounded-md border">
                {draft.rows.map((row, index) => (
                  <div key={`${row.testName}-${index}`} className="space-y-3 border-b p-3 text-sm last:border-b-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">Result {index + 1}</p>
                      <Button type="button" size="icon" variant="ghost" aria-label="Remove lab result row" onClick={() => removeDraftRow(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input aria-label={`Test name ${index + 1}`} value={row.testName} onChange={(event) => updateDraftRow(index, { testName: event.target.value })} />
                      <Input aria-label={`Assay method ${index + 1}`} value={row.assayMethod ?? ''} onChange={(event) => updateDraftRow(index, { assayMethod: event.target.value || undefined })} placeholder="Assay/method" />
                      <Input aria-label={`Result value ${index + 1}`} value={row.value} onChange={(event) => updateDraftRow(index, { value: event.target.value })} />
                      <Input aria-label={`Result unit ${index + 1}`} value={row.unit} onChange={(event) => updateDraftRow(index, { unit: event.target.value })} placeholder="Unit" />
                      <Input aria-label={`Reference range ${index + 1}`} value={row.referenceRange?.text ?? ''} onChange={(event) => updateDraftRow(index, { referenceRange: event.target.value ? { text: event.target.value } : undefined })} placeholder="Reference range" />
                      <Input aria-label={`Result flag ${index + 1}`} value={row.flag} onChange={(event) => updateDraftRow(index, { flag: event.target.value as LabImportRow['flag'] })} placeholder="normal, high, low" />
                    </div>
                  </div>
                ))}
              </div>
              {draft.unresolvedRows.length > 0 && (
                <p className="text-xs text-muted-foreground">{draft.unresolvedRows.length} rows need manual review and were not saved.</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDraft(null)}>Dismiss</Button>
                <Button onClick={saveDraft} disabled={draft.rows.length === 0}>
                  <Save className="w-4 h-4" />
                  Save labs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Peppi lab analysis
              </span>
              <Button size="sm" variant="outline" onClick={() => void analyzeLabs()} disabled={data.labResults.length === 0 || isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Peppi explains trends and timing against your protocols. It does not diagnose, recommend dose changes, or determine safety.
            </p>
            {analysisMessage && (
              <p className="rounded-md border bg-background px-3 py-2 text-sm">{analysisMessage}</p>
            )}
            {analysisCards.map((card) => (
              <div key={card.id} className="rounded-md border bg-background p-3 text-sm">
                <p className="font-medium">{card.title}</p>
                <p className="text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {reports.length === 0 ? (
          <Empty className="bg-secondary/40 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TestTube className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>No lab results yet</EmptyTitle>
              <EmptyDescription>
                Import structured test data to trend biomarkers alongside protocols and Signal notes.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <LabReportCard
                key={report.id}
                report={report}
                results={resultsByReport.get(report.id) ?? []}
                protocolContext={buildLabProtocolContext(data, report.drawDate)}
                onAnalyze={() => void analyzeLabs(report.id)}
                onDelete={() => deleteLabReport(report.id)}
              />
            ))}
          </div>
        )}

        {trends.size > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from(trends.entries()).slice(0, 12).map(([key, points]) => (
                <div key={key} className="rounded-md border bg-background p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{points.at(-1)?.testName ?? key}</p>
                      <p className="text-muted-foreground">{points.length} result{points.length === 1 ? '' : 's'} tracked</p>
                    </div>
                    <p className="font-medium">{points.at(-1)?.value} {points.at(-1)?.unit}</p>
                  </div>
                  {hasMixedAssays(points) && (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Assay or unit changed across this trend. Compare cautiously.</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Quest/Labcorp account connection is future work. Likely paths are vendor FHIR/EDI approval or an aggregator such as Health Gorilla; v1 is PHI-minimized file/manual import.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function LabReportCard({
  report,
  results,
  protocolContext,
  onAnalyze,
  onDelete,
}: {
  report: LabReport;
  results: LabResult[];
  protocolContext: ReturnType<typeof buildLabProtocolContext>;
  onAnalyze: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{formatDate(report.drawDate)}{report.panelName ? ` · ${report.panelName}` : ''}</p>
            <p className="text-xs text-muted-foreground">{report.sourceLabel || 'Source not specified'} · {results.length} result{results.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onAnalyze}>
              <Bot className="w-4 h-4" />
              Analyze
            </Button>
            <Button size="icon" variant="ghost" aria-label="Delete lab report" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid gap-2 rounded-md border bg-background p-3 text-xs">
          <p className="font-medium text-sm">Protocol context</p>
          <p className="text-muted-foreground">{formatProtocolContext(protocolContext)}</p>
          <div className="grid grid-cols-2 gap-2">
            <span className="rounded-md bg-secondary px-2 py-1">{protocolContext.recentCompletedLogs} completed · 14d</span>
            <span className="rounded-md bg-secondary px-2 py-1">{protocolContext.recentSkippedOrMissedLogs} skipped/missed · 14d</span>
            <span className="rounded-md bg-secondary px-2 py-1">{protocolContext.prior30DayCompletedLogs} completed · 30d</span>
            <span className="rounded-md bg-secondary px-2 py-1">{protocolContext.prior30DaySkippedOrMissedLogs} skipped/missed · 30d</span>
          </div>
          {protocolContext.latestSignal && (
            <p className="text-muted-foreground">
              Latest Signal before draw: energy {protocolContext.latestSignal.energy}/10 · sleep {protocolContext.latestSignal.sleepHours} hr
            </p>
          )}
        </div>
        <div className="space-y-2">
          {results.slice(0, 6).map((result) => (
            <div key={result.id} className="flex items-start justify-between gap-3 rounded-md bg-secondary/50 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{result.testName}</p>
                <p className="text-xs text-muted-foreground">{result.assayMethod || 'Assay not specified'}{result.referenceRange?.text ? ` · ref ${result.referenceRange.text}` : ''}</p>
              </div>
              <p className="font-medium">{result.value} {result.unit}</p>
            </div>
          ))}
          {results.length > 6 && <p className="text-xs text-muted-foreground">+{results.length - 6} more results</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function groupResultsByReport(results: LabResult[]) {
  return results.reduce((groups, result) => {
    const group = groups.get(result.reportId) ?? [];
    group.push(result);
    groups.set(result.reportId, group);
    return groups;
  }, new Map<string, LabResult[]>());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatProtocolContext(context: ReturnType<typeof buildLabProtocolContext>) {
  if (context.activeStacks.length === 0) return 'No active protocol on draw date';
  const stack = context.activeStacks[0];
  return `${stack.name} day ${stack.day} · ${context.recentCompletedLogs} completed logs in prior 14 days`;
}
