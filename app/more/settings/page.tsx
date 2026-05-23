"use client";

import { Moon, Sun, Fingerprint, Download, Shield, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';

export default function SettingsPage() {
  const { data, toggleDarkMode, toggleBiometricLock, exportAllData, clearAllData } = useApp();

  return (
    <AppShell>
      <PageHeader title="Settings" backHref="/more" />

      <div className="p-4 space-y-4">
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
            <Button variant="outline" className="w-full justify-start" onClick={() => void exportAllData()}>
              <Download className="w-4 h-4 mr-3" />
              Export All Data
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => void clearAllData()}>
              <Trash2 className="w-4 h-4 mr-3" />
              Clear All Data
            </Button>
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
