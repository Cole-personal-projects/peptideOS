"use client";

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Cloud, Database, Download, Fingerprint, Palette, RefreshCw, Shield, Trash2, Upload, UserRound } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';
import { APP_BUILD_ID, APP_VERSION, SERVICE_WORKER_CACHE_NAME } from '@/lib/app-build-info';
import { useApp } from '@/lib/context';
import { isFeatureEnabled } from '@/lib/feature-gates';
import { validateUserDataExport, type UserDataImportPreview } from '@/lib/persistence';
import { formatReferenceLibraryStatus } from '@/lib/reference-library-status';
import type { AppTheme } from '@/lib/types';

const themeOptions: Array<{
  id: AppTheme;
  name: string;
  tone: string;
  swatches: string[];
}> = [
  {
    id: 'clinical-light',
    name: 'Clinical Light',
    tone: 'Clean and high-trust',
    swatches: ['#f7faf9', '#117d82', '#2f8f5b'],
  },
  {
    id: 'graphite-dark',
    name: 'Graphite Dark',
    tone: 'Focused night cockpit',
    swatches: ['#0a0f12', '#27b5ad', '#f0a84f'],
  },
  {
    id: 'signal',
    name: 'Signal',
    tone: 'High-contrast data',
    swatches: ['#08111f', '#37d5ff', '#7ee06b'],
  },
  {
    id: 'warm-minimal',
    name: 'Warm Minimal',
    tone: 'Softer daily use',
    swatches: ['#fbf7ef', '#8f5f2a', '#4f8b63'],
  },
];

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'No successful save yet';
}

function formatImportCounts(preview: UserDataImportPreview) {
  return [
    `${preview.counts.stacks} protocols`,
    `${preview.counts.schedules} schedules`,
    `${preview.counts.scheduleLogs} due-dose records`,
    `${preview.counts.doses} logged doses`,
    `${preview.counts.vials} containers`,
    `${preview.counts.signalCheckIns} signals`,
    `${preview.counts.labReports} lab reports`,
    `${preview.counts.labResults} lab results`,
    `${preview.counts.userCompounds} custom compounds`,
  ].join(' · ');
}

export default function SettingsPage() {
const router = useRouter();
const searchParams = useSearchParams();
const {
data,
referenceLibraryStatus,
persistenceStatus,
setUserMode,
setTheme,
toggleBiometricLock,
exportAllData,
importAllData,
  clearAllData,
  saveToCloud,
  previewCloudRetrieve,
  confirmCloudRetrieve,
  cancelCloudRetrievePreview,
  undoLastCloudRetrieve,
  setCloudSyncEnabled,
} = useApp();
  const activeTheme = data.theme ?? (data.darkMode ? 'graphite-dark' : 'clinical-light');
  const { config: authConfig, status: authStatus, user, signInWithEmail, verifyEmailCode, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authAction, setAuthAction] = useState<'email' | 'code' | 'sign-out' | null>(null);
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
const [pendingImport, setPendingImport] = useState<{ file: File; preview: UserDataImportPreview } | null>(null);
const [clearDialogOpen, setClearDialogOpen] = useState(false);
const [retrieveDialogOpen, setRetrieveDialogOpen] = useState(false);
const [isClearing, setIsClearing] = useState(false);
const formattedReferenceLibraryStatus = formatReferenceLibraryStatus(referenceLibraryStatus);
const isCloudBusy = persistenceStatus.cloudStatus === 'saving' || persistenceStatus.cloudStatus === 'retrieving';
const canUseCloud = persistenceStatus.mode === 'signed-in' && persistenceStatus.cloudStatus !== 'unavailable';
const biometricLockEnabled = isFeatureEnabled('biometric-lock');

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setIsImporting(true);
    setImportStatus('');

    try {
      const preview = validateUserDataExport(await file.text());
      setPendingImport({ file, preview });
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Could not restore backup.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;
    setIsImporting(true);
    setImportStatus('');

    try {
      await importAllData(pendingImport.file);
      setImportStatus(`Data restored from backup exported ${new Date(pendingImport.preview.exportedAt).toLocaleString()}.`);
      setPendingImport(null);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Could not restore backup.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);

    try {
      await clearAllData();
      setClearDialogOpen(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleEmailSignIn = async () => {
    setAuthAction('email');
    setAuthMessage('');

    try {
      const result = await signInWithEmail(email);
      setAuthMessage(result.message);
    } finally {
      setAuthAction(null);
    }
  };

  const handleVerifyCode = async () => {
    setAuthAction('code');
    setAuthMessage('');

    try {
      const result = await verifyEmailCode(email, verificationCode);
      setAuthMessage(result.message);
      if (result.ok) setVerificationCode('');
    } finally {
      setAuthAction(null);
    }
  };

  const handleSignOut = async () => {
    setAuthAction('sign-out');

    try {
      await signOut();
      setAuthMessage('Signed out.');
      router.push('/welcome');
    } finally {
      setAuthAction(null);
    }
  };

  return (
    <AppShell showDisclaimer={searchParams.get('entry') !== 'signin'}>
      <PageHeader title="Settings" backHref="/more" />

      <div data-testid="settings-content" className="mx-auto w-full max-w-3xl p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{authStatus === 'signed-in' ? user?.email : 'Local-only mode'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {authStatus === 'signed-in'
                    ? 'Signed in. Cloud mode can keep this device synced with your account.'
                    : 'Your data remains on this device until you sign in and turn on Cloud mode.'}
                </p>
                {!authConfig.enabled && (
                  <p className="mt-2 text-xs text-muted-foreground">Sign-in is ready for Supabase public config.</p>
                )}
              </div>
            </div>

            {authStatus === 'signed-in' ? (
              <Button variant="outline" className="w-full justify-start" disabled={authAction !== null} onClick={() => void handleSignOut()}>
                Sign out
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email address</Label>
                  <Input
                    id="account-email"
                    aria-label="Email address"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <Button variant="outline" className="w-full justify-start" disabled={authAction !== null} onClick={() => void handleEmailSignIn()}>
                  {authAction === 'email' ? 'Sending sign-in link...' : 'Send sign-in link'}
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="account-verification-code">Verification code</Label>
                  <Input
                    id="account-verification-code"
                    aria-label="Verification code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Paste email code"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                  />
                </div>
                <Button variant="outline" className="w-full justify-start" disabled={authAction !== null} onClick={() => void handleVerifyCode()}>
                  {authAction === 'code' ? 'Verifying code...' : 'Verify sign-in code'}
                </Button>
              </div>
            )}

            {authMessage && (
              <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
                {authMessage}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Data ownership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">Storage mode</p>
                <p className="mt-1 text-sm font-medium">
                  {persistenceStatus.mode === 'signed-in' ? 'Signed-in local store' : 'Local-only store'}
                </p>
              </div>
<div className="rounded-md border bg-secondary/20 p-3">
<p className="text-xs text-muted-foreground">Last successful save</p>
<p className="mt-1 text-sm font-medium">{formatDateTime(persistenceStatus.lastSavedAt)}</p>
</div>
<div className="rounded-md border bg-secondary/20 p-3">
<p className="text-xs text-muted-foreground">Cloud save</p>
<p className="mt-1 text-sm font-medium">
{persistenceStatus.mode === 'signed-in' ? formatDateTime(persistenceStatus.cloudLastSavedAt) : 'Sign in to enable'}
</p>
</div>
<div className="rounded-md border bg-secondary/20 p-3">
<p className="text-xs text-muted-foreground">Cloud retrieve</p>
                <p className="mt-1 text-sm font-medium">
                  {persistenceStatus.mode === 'signed-in' ? formatDateTime(persistenceStatus.cloudLastRetrievedAt) : 'Sign in to enable'}
                </p>
              </div>
              <div className="rounded-md border bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">App version</p>
                <p className="mt-1 text-sm font-medium">v{APP_VERSION}</p>
              </div>
              <div className="rounded-md border bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground">Build</p>
                <p className="mt-1 text-sm font-medium">{APP_BUILD_ID}</p>
              </div>
              <div className="rounded-md border bg-secondary/20 p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Offline shell</p>
                <p className="mt-1 text-sm font-medium">{SERVICE_WORKER_CACHE_NAME}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border bg-secondary/20 p-3">
              <Database className="mt-0.5 h-5 w-5 text-muted-foreground" />
<div>
<p className="text-xs text-muted-foreground">Reference library</p>
<p className="mt-1 font-medium text-sm">{formattedReferenceLibraryStatus.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{formattedReferenceLibraryStatus.detail}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Exports include saved containers, doses, protocols, schedules, reconstitution calculations, signals, custom compounds, and settings.
              Bundled reference compounds stay app-owned.
            </p>

<div className="flex items-center justify-between rounded-md border bg-secondary/20 p-3">
<div className="flex items-start gap-3">
<Cloud className="mt-0.5 h-5 w-5 text-muted-foreground" />
<div>
<p className="font-medium text-sm">Cloud mode</p>
<p className="text-xs text-muted-foreground mt-1">
When on, PeptideOS saves app changes to your account automatically. Retrieve only when you want to replace this device with the cloud copy.
</p>
</div>
</div>
<Switch
checked={Boolean(data.cloudSyncEnabled)}
disabled={persistenceStatus.mode !== 'signed-in' || isCloudBusy}
onCheckedChange={(checked) => void setCloudSyncEnabled(checked)}
/>
</div>

<Button variant="outline" className="w-full justify-start" onClick={() => void exportAllData()}>
<Download className="w-4 h-4 mr-3" />
Export full backup
</Button>

<div className="grid gap-2 sm:grid-cols-2">
<Button
variant="outline"
className="w-full justify-start"
disabled={!canUseCloud || isCloudBusy}
onClick={() => void saveToCloud()}
>
<Cloud className="w-4 h-4 mr-3" />
{persistenceStatus.cloudStatus === 'saving' ? 'Saving to cloud...' : 'Save to cloud'}
</Button>
<Button
variant="outline"
className="w-full justify-start"
disabled={!canUseCloud || isCloudBusy}
onClick={() => {
setRetrieveDialogOpen(true);
void previewCloudRetrieve();
}}
>
<RefreshCw className="w-4 h-4 mr-3" />
{persistenceStatus.cloudStatus === 'retrieving' ? 'Retrieving...' : 'Retrieve from cloud'}
</Button>
</div>

{persistenceStatus.canUndoCloudRetrieve && (
<Button
variant="outline"
className="w-full justify-start"
disabled={isCloudBusy}
onClick={() => void undoLastCloudRetrieve()}
>
<RefreshCw className="w-4 h-4 mr-3" />
Undo last cloud retrieve
</Button>
)}

{persistenceStatus.cloudMessage && (
<p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
{persistenceStatus.cloudMessage}
</p>
)}

<AlertDialog open={retrieveDialogOpen} onOpenChange={setRetrieveDialogOpen}>
   <AlertDialogContent>
   <AlertDialogHeader>
   <AlertDialogTitle>Review cloud retrieve</AlertDialogTitle>
   <AlertDialogDescription>
   This replaces this device with the cloud copy. PeptideOS creates an in-app restore point first, so iOS stays in the app.
   </AlertDialogDescription>
   </AlertDialogHeader>
   {persistenceStatus.cloudRetrievePreview ? (
   <div className="grid gap-3 rounded-[16px] bg-secondary p-3 text-sm">
   <div className="grid grid-cols-2 gap-2">
   <div className="rounded-[12px] bg-background p-3">
   <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">This device</p>
   <p className="mt-1 text-2xl font-black">{persistenceStatus.cloudRetrievePreview.localRecordCount}</p>
   <p className="text-xs text-muted-foreground">local records</p>
   </div>
   <div className="rounded-[12px] bg-background p-3">
   <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Cloud copy</p>
   <p className="mt-1 text-2xl font-black">{persistenceStatus.cloudRetrievePreview.cloudRecordCount}</p>
   <p className="text-xs text-muted-foreground">cloud records</p>
   </div>
   </div>
   <p className="text-xs leading-5 text-muted-foreground">
   Cloud has {persistenceStatus.cloudRetrievePreview.cloudHasMoreRecords} more records by count. This device has {persistenceStatus.cloudRetrievePreview.localHasMoreRecords} more records by count.
   </p>
 <p className="text-xs leading-5 text-muted-foreground">
 Retrieved {persistenceStatus.cloudRetrievePreview.pulledRows} sync rows{persistenceStatus.cloudRetrievePreview.pulledAt ? ` · ${formatDateTime(persistenceStatus.cloudRetrievePreview.pulledAt)}` : ''}.
 </p>
 <div className="grid gap-1.5">
 {persistenceStatus.cloudRetrievePreview.collectionCounts
 .filter((item) => item.localCount > 0 || item.cloudCount > 0 || item.delta !== 0)
 .map((item) => (
 <div key={item.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-[10px] bg-background px-2.5 py-2 text-xs">
 <span className="font-semibold">{item.label}</span>
 <span className="text-muted-foreground">{item.localCount} → {item.cloudCount}</span>
 <span className={item.delta === 0 ? 'text-muted-foreground' : item.delta > 0 ? 'text-emerald-600' : 'text-amber-600'}>
 {item.delta > 0 ? `+${item.delta}` : item.delta}
 </span>
 </div>
 ))}
 </div>
 </div>
   ) : (
   <div className="rounded-[16px] bg-secondary p-3 text-sm text-muted-foreground" role="status">
   {persistenceStatus.cloudStatus === 'retrieving' ? 'Checking cloud copy...' : 'No cloud retrieve preview is available.'}
   </div>
   )}
   <AlertDialogFooter>
   <AlertDialogCancel
   disabled={isCloudBusy}
   onClick={() => {
   cancelCloudRetrievePreview();
   }}
   >
   Cancel
   </AlertDialogCancel>
   <AlertDialogAction
   disabled={isCloudBusy || !persistenceStatus.cloudRetrievePreview}
   onClick={(event) => {
   event.preventDefault();
   setRetrieveDialogOpen(false);
   void confirmCloudRetrieve();
   }}
   >
   {persistenceStatus.cloudStatus === 'retrieving' ? 'Retrieving...' : 'Create restore point and retrieve'}
   </AlertDialogAction>
   </AlertDialogFooter>
</AlertDialogContent>
</AlertDialog>

<input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import Data File"
              onChange={(event) => void handleImportFile(event.target.files?.[0])}
            />
            <Button variant="outline" className="w-full justify-start" disabled={isImporting} onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-3" />
              {isImporting ? 'Checking backup...' : 'Restore from backup'}
            </Button>

            {importStatus && (
              <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
                {importStatus}
              </p>
            )}

            <AlertDialog open={Boolean(pendingImport)} onOpenChange={(open) => !open && setPendingImport(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restore this PeptideOS backup?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {pendingImport && (
                      <span className="space-y-2 block">
                        <span className="block">Schema version {pendingImport.preview.schemaVersion} · Exported {new Date(pendingImport.preview.exportedAt).toLocaleString()}</span>
                        <span className="block">{formatImportCounts(pendingImport.preview)}</span>
                        <span className="block">Restoring replaces local user data on this device. Bundled reference compounds stay available.</span>
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isImporting} onClick={(event) => { event.preventDefault(); void handleConfirmImport(); }}>
                    {isImporting ? 'Restoring...' : 'Restore backup'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setClearDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-3" />
                Clear local data
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes saved containers, doses, protocols, schedules, reconstitution calculations, signals, custom compounds, and settings from this device.
                    Bundled reference compounds stay available after reset.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isClearing}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleClearData();
                    }}
                  >
                    {isClearing ? 'Clearing...' : 'Clear local data'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Content mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {data.userMode === 'researcher' ? 'Experienced tracker' : 'Beginner'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Beginner mode emphasizes first actions and what to track. Experienced mode shows evidence, mechanisms, caveats, and source detail.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={data.userMode === 'beginner' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setUserMode('beginner')}
              >
                Beginner
              </Button>
              <Button
                type="button"
                variant={data.userMode === 'researcher' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setUserMode('researcher')}
              >
                Experienced
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Theme</p>
                <p className="text-xs text-muted-foreground">Choose how PeptideOS appears on this device.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {themeOptions.map((theme) => {
                const selected = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTheme(theme.id)}
                    className={`flex min-h-20 items-center justify-between rounded-lg border p-3 text-left transition ${selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card hover:border-primary/50'}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{theme.name}</span>
                      <span className="block text-xs text-muted-foreground">{theme.tone}</span>
                      <span className="mt-3 flex gap-1.5">
                        {theme.swatches.map((swatch) => (
                          <span
                            key={swatch}
                            className="h-4 w-4 rounded-full border border-border"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </span>
                    </span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card> {biometricLockEnabled && (
<Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Biometric Lock</p>
                  <p className="text-xs text-muted-foreground">Require Face ID / fingerprint</p>
                </div>
              </div>
              <Switch checked={data.biometricLock} onCheckedChange={toggleBiometricLock} />
            </div>
          </CardContent>
        </Card>

        
)} 
<Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your data stays local</p>
<p className="text-xs text-muted-foreground mt-1">
                  PeptideOS stores protocol data in this browser by default. Signed-in users can manually save or retrieve cloud copies from Data ownership.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
