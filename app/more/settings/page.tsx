"use client";

import { useRef, useState } from 'react';
import { Database, Moon, Sun, Fingerprint, Download, Shield, Trash2, Upload, UserRound } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/lib/context';
import { formatReferenceLibraryStatus } from '@/lib/reference-library-status';

export default function SettingsPage() {
  const { data, referenceLibraryStatus, toggleDarkMode, toggleBiometricLock, exportAllData, importAllData, clearAllData } = useApp();
  const { config: authConfig, status: authStatus, user, signInWithEmail, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const formattedReferenceLibraryStatus = formatReferenceLibraryStatus(referenceLibraryStatus);

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setIsImporting(true);
    setImportStatus('');

    try {
      await importAllData(file);
      setImportStatus('Data restored from backup.');
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Could not restore this backup.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    setIsSubmittingAuth(true);
    setAuthMessage('');

    try {
      const result = await signInWithEmail(email);
      setAuthMessage(result.message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmittingAuth(true);

    try {
      await signOut();
      setAuthMessage('Signed out.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Settings" backHref="/more" />

      <div data-testid="settings-content" className="mx-auto w-full max-w-3xl p-4 space-y-4">
        {/* Account */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">
                  {authStatus === 'signed-in' ? user?.email : 'Local-only mode'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {authStatus === 'signed-in'
                    ? 'Signed in. Cloud sync will be added in a future slice.'
                    : 'Your data remains on this device until you sign in and cloud sync is available.'}
                </p>
                {!authConfig.enabled && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sign-in is ready for Supabase public config.
                  </p>
                )}
              </div>
            </div>

            {authStatus === 'signed-in' ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={isSubmittingAuth}
                onClick={() => void handleSignOut()}
              >
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={isSubmittingAuth}
                  onClick={() => void handleEmailSignIn()}
                >
                  {isSubmittingAuth ? 'Sending sign-in link...' : 'Send sign-in link'}
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

        {/* Reference Library */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reference library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{formattedReferenceLibraryStatus.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formattedReferenceLibraryStatus.detail}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {data.darkMode ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
                </div>
              </div>
              <Switch checked={data.darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
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

        {/* Data */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Exports include your saved vials, doses, stacks, schedules, reconstitution calculations, signals, custom compounds, and settings. Bundled reference compounds stay in the app and are not duplicated in backups.
            </p>
            <Button variant="outline" className="w-full justify-start" onClick={() => void exportAllData()}>
              <Download className="w-4 h-4 mr-3" />
              Export All Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Imports replace local user data from a PeptideOS JSON backup. Bundled reference compounds remain app-owned.
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import Data File"
              onChange={(event) => void handleImportFile(event.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-3" />
              {isImporting ? 'Importing Data...' : 'Import Data'}
            </Button>
            {importStatus && (
              <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground" role="status" aria-live="polite">
                {importStatus}
              </p>
            )}
            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => setClearDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-3" />
                Clear All Data
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes your saved vials, doses, stacks, schedules, reconstitution calculations, signals, custom compounds, and settings from this device. Bundled reference compounds stay available after reset.
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

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Your Data Stays Local</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All data is stored locally on your device. No data is sent to external servers. 
                  Export your data anytime for backup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
