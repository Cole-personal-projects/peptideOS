"use client";

import { use } from 'react';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { Calendar, Hash, Droplet, AlertCircle, PackageSearch, Edit3 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/context';
import { getTrackableCompounds, isReconstitutableCompound } from '@/lib/compound-workflows';
import { convertDoseToMg } from '@/lib/dose-helpers';
import { getVialInventoryMetrics } from '@/lib/inventory-metrics';
import { buildReconstitutedVialUpdate, getReconstitutionPreview } from '@/lib/reconstitute-vial';
import { cn } from '@/lib/utils';
import type { DoseUnit } from '@/lib/types';

export default function VialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, getVial, updateVial } = useApp();
  const [isReconstituteOpen, setIsReconstituteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bacWaterInput, setBacWaterInput] = useState('2');
  const vial = getVial(id);

  if (!vial) {
    notFound();
  }

  const compound = getTrackableCompounds(data).find((candidate) => candidate.id === vial.peptideId);
  const canReconstitute = isReconstitutableCompound(compound);
  const inventoryMetrics = getVialInventoryMetrics(vial, data.doses);
  const [editName, setEditName] = useState(vial.name);
  const [editDateAdded, setEditDateAdded] = useState(vial.dateAdded.slice(0, 10));
  const [editExpirationDate, setEditExpirationDate] = useState(vial.expirationDate.slice(0, 10));
  const [editSource, setEditSource] = useState(vial.source);
  const [editLotNumber, setEditLotNumber] = useState(vial.lotNumber);
  const [editAmount, setEditAmount] = useState((vial.totalAmount?.value ?? vial.mg).toString());
  const [editAmountUnit, setEditAmountUnit] = useState<DoseUnit>(vial.totalAmount?.unit ?? 'mg');
  const canEditTotalAmount = !vial.concentration;

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
  const bacWaterMl = Number(bacWaterInput);
  const reconstitutionPreview = useMemo(
    () => getReconstitutionPreview({ vial, bacWaterMl }),
    [vial, bacWaterMl]
  );

  const handleMarkFinished = () => {
    updateVial(vial.id, { status: 'finished' });
  };

  const handleReconstitute = () => {
    const update = buildReconstitutedVialUpdate({ vial, bacWaterMl });
    if (!update) return;

    updateVial(vial.id, update);
    setIsReconstituteOpen(false);
  };

  const openEditDialog = () => {
    setEditName(vial.name);
    setEditDateAdded(vial.dateAdded.slice(0, 10));
    setEditExpirationDate(vial.expirationDate.slice(0, 10));
    setEditSource(vial.source);
    setEditLotNumber(vial.lotNumber);
    setEditAmount((vial.totalAmount?.value ?? vial.mg).toString());
    setEditAmountUnit(vial.totalAmount?.unit ?? 'mg');
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    const amountValue = Number(editAmount);
    const amountMg = canEditTotalAmount && Number.isFinite(amountValue) && amountValue > 0
      ? convertDoseToMg(vial.peptideId, amountValue, editAmountUnit) ?? vial.mg
      : vial.mg;

    updateVial(vial.id, {
      name: trimmedName,
      dateAdded: editDateAdded,
      expirationDate: new Date(`${editExpirationDate}T00:00:00.000Z`).toISOString(),
      source: editSource,
      lotNumber: editLotNumber,
      ...(canEditTotalAmount && Number.isFinite(amountValue) && amountValue > 0
        ? {
            mg: amountMg,
            totalAmount: {
              value: amountValue,
              unit: editAmountUnit,
            },
          }
        : {}),
    });
    setIsEditOpen(false);
  };

  return (
    <AppShell>
      <PageHeader
        title={vial.name}
        backHref="/more/inventory"
        rightElement={
          <Button size="sm" variant="ghost" className="text-primary" onClick={openEditDialog}>
            <Edit3 className="w-4 h-4 mr-1" /> Edit
            <span className="sr-only"> vial</span>
          </Button>
        }
      />

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
              {vial.status === 'sealed' && canReconstitute && (
                <Button size="sm" onClick={() => setIsReconstituteOpen(true)}>
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
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{vial.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <PackageSearch className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compound</p>
                <p className="font-medium">{compound?.name ?? 'Unknown compound'}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3"
              aria-label={`Date Added ${new Date(`${vial.dateAdded.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}`}
            >
              <div className="p-2 rounded-lg bg-secondary">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date Added</p>
                <p className="font-medium">
                  {new Date(`${vial.dateAdded.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Hash className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lot Number</p>
                <p className="font-medium">{vial.lotNumber || 'Not recorded'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Droplet className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium">{inventoryMetrics.originalLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <PackageSearch className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Container Type</p>
                <p className="font-medium capitalize">{(vial.containerType ?? 'lyophilized-vial').replaceAll('-', ' ')}</p>
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
                  {(vial.mg / vial.bacWaterMl).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">mg per mL</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((vial.mg * 1000) / vial.bacWaterMl).toFixed(0)} mcg per mL
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isReconstituteOpen} onOpenChange={setIsReconstituteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconstitute vial</DialogTitle>
            <DialogDescription>
              Enter BAC water volume to activate this vial and calculate inventory concentration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bac-water-volume">BAC water volume</Label>
              <Input
                id="bac-water-volume"
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                value={bacWaterInput}
                onChange={(event) => setBacWaterInput(event.target.value)}
                aria-label="BAC water volume"
              />
            </div>

            <Card className="bg-secondary/40">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Concentration preview</p>
                <p className="font-medium">
                  {reconstitutionPreview?.concentrationLabel ?? 'Enter a BAC water volume'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expiration defaults to 28 days after reconstitution.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReconstituteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReconstitute} disabled={!reconstitutionPreview}>
              Activate vial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit vial</DialogTitle>
            <DialogDescription>
              Update this vial record without changing logged dose history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-vial-name">Vial name</Label>
              <Input
                id="edit-vial-name"
                aria-label="Vial name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-date-added">Date added</Label>
                <Input
                  id="edit-date-added"
                  aria-label="Date added"
                  type="date"
                  value={editDateAdded}
                  onChange={(event) => setEditDateAdded(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-expiration-date">Expiration date</Label>
                <Input
                  id="edit-expiration-date"
                  aria-label="Expiration date"
                  type="date"
                  value={editExpirationDate}
                  onChange={(event) => setEditExpirationDate(event.target.value)}
                />
              </div>
            </div>

            {canEditTotalAmount && (
              <div className="grid grid-cols-[1fr_104px] gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-vial-size">Vial size</Label>
                  <Input
                    id="edit-vial-size"
                    aria-label="Vial size"
                    type="number"
                    step="any"
                    value={editAmount}
                    onChange={(event) => setEditAmount(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-vial-size-unit">Unit</Label>
                  <select
                    id="edit-vial-size-unit"
                    aria-label="Vial size unit"
                    value={editAmountUnit}
                    onChange={(event) => setEditAmountUnit(event.target.value as DoseUnit)}
                    className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                    <option value="iu">IU</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-source">Source</Label>
              <Input
                id="edit-source"
                aria-label="Source"
                value={editSource}
                onChange={(event) => setEditSource(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-lot-number">Lot Number</Label>
              <Input
                id="edit-lot-number"
                aria-label="Lot Number"
                value={editLotNumber}
                onChange={(event) => setEditLotNumber(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
