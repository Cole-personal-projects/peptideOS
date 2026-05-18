"use client";

import { use } from 'react';
import { notFound } from 'next/navigation';
import { Calendar, Hash, Droplet, AlertCircle, PackageSearch } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';

export default function VialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getVial, getPeptide, updateVial } = useApp();
  const vial = getVial(id);

  if (!vial) {
    notFound();
  }

  const peptide = getPeptide(vial.peptideId);

  const getDaysUntilExpiration = () => {
    const exp = new Date(vial.expirationDate);
    const now = new Date();
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpirationProgress = () => {
    if (!vial.reconstitutedDate) return 100;
    const recon = new Date(vial.reconstitutedDate);
    const exp = new Date(vial.expirationDate);
    const now = new Date();
    const total = exp.getTime() - recon.getTime();
    const remaining = exp.getTime() - now.getTime();
    return Math.max(Math.min((remaining / total) * 100, 100), 0);
  };

  const daysLeft = getDaysUntilExpiration();
  const progress = getExpirationProgress();
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  const handleMarkFinished = () => {
    updateVial(vial.id, { status: 'finished' });
  };

  const handleReconstitute = () => {
    updateVial(vial.id, { 
      status: 'active',
      reconstitutedDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  return (
    <AppShell>
      <PageHeader title={peptide?.name || 'Vial'} backHref="/more/inventory" />

      <div className="p-4 space-y-4">
        {/* Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge 
                variant={vial.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  "capitalize text-sm",
                  vial.status === 'active' && "bg-primary"
                )}
              >
                {vial.status}
              </Badge>
              {vial.status === 'active' && (
                <Button size="sm" variant="outline" onClick={handleMarkFinished}>
                  Mark Finished
                </Button>
              )}
              {vial.status === 'sealed' && (
                <Button size="sm" onClick={handleReconstitute}>
                  Reconstitute
                </Button>
              )}
            </div>

            {vial.status === 'active' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    {(isExpiringSoon || isExpired) && (
                      <AlertCircle className={cn(
                        "w-4 h-4",
                        isExpired ? "text-destructive" : "text-chart-4"
                      )} />
                    )}
                    Expiration
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isExpired ? "text-destructive" : isExpiringSoon ? "text-chart-4" : ""
                  )}>
                    {isExpired ? 'Expired' : `${daysLeft} days remaining`}
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    isExpired && "[&>div]:bg-destructive",
                    isExpiringSoon && !isExpired && "[&>div]:bg-chart-4"
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Hash className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lot Number</p>
                <p className="font-medium">{vial.lotNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Droplet className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium">{vial.mg}mg</p>
              </div>
            </div>

            {vial.bacWaterMl > 0 && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Droplet className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">BAC Water</p>
                  <p className="font-medium">{vial.bacWaterMl}mL</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <PackageSearch className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-medium">{vial.source || 'Unknown'}</p>
              </div>
            </div>

            {vial.reconstitutedDate && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reconstituted</p>
                  <p className="font-medium">
                    {new Date(vial.reconstitutedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiration Date</p>
                <p className="font-medium">
                  {new Date(vial.expirationDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Concentration (if reconstituted) */}
        {vial.bacWaterMl > 0 && (
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Concentration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-primary">
                  {((vial.mg * 1000) / vial.bacWaterMl).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">mcg per mL</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
