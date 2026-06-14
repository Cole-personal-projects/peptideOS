"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/lib/context';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { buildNewVialBatch } from '@/lib/vial-create';
import type { ConcentrationUnit, DoseUnit, InventoryContainerType, VialStatus } from '@/lib/types';

interface AddVialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVialSheet({ open, onOpenChange }: AddVialSheetProps) {
  const { data, addVials } = useApp();
  const [name, setName] = useState('');
  const [peptideId, setPeptideId] = useState('');
  const [dateAdded, setDateAdded] = useState(() => new Date().toISOString().slice(0, 10));
  const [containerType, setContainerType] = useState<InventoryContainerType>('lyophilized-vial');
  const [source, setSource] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [amountUnit, setAmountUnit] = useState<DoseUnit>('mg');
  const [packageUnit, setPackageUnit] = useState<'vial' | 'kit'>('vial');
  const [packageQuantity, setPackageQuantity] = useState('1');
  const [concentration, setConcentration] = useState('');
  const [concentrationUnit, setConcentrationUnit] = useState<ConcentrationUnit>('mg/ml');
  const [volumeMl, setVolumeMl] = useState('');
  const [status, setStatus] = useState<VialStatus>('sealed');
  const trackableCompounds = getTrackableCompounds(data);
  const selectedCompound = trackableCompounds.find((compound) => compound.id === peptideId);
  const usesConcentration = containerType === 'multi-dose-vial' || containerType === 'prefilled-pen';

  const handleCompoundChange = (value: string) => {
    const compound = trackableCompounds.find((candidate) => candidate.id === value);
    setPeptideId(value);
    setAmountUnit(compound?.defaultDoseUnit === 'iu' ? 'iu' : 'mg');
    setConcentrationUnit(compound?.defaultDoseUnit === 'iu' ? 'iu/ml' : 'mg/ml');

    if (compound?.concentrationMode === 'concentration') {
      setContainerType('multi-dose-vial');
    } else if (compound?.concentrationMode === 'prefilled') {
      setContainerType('prefilled-pen');
    } else if (compound?.concentrationMode === 'none') {
      setContainerType('capsule-bottle');
    } else {
      setContainerType('lyophilized-vial');
    }
  };

  const handleSubmit = () => {
    if (!peptideId) return;
    if (usesConcentration && (!concentration || !volumeMl)) return;
    if (!usesConcentration && !amount) return;
    
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 12);
    const vialPayloads = buildNewVialBatch({
      name: name || `${selectedCompound?.name ?? 'Compound'} container`,
      peptideId,
      dateAdded,
      containerType,
      totalAmountValue: usesConcentration ? undefined : parseFloat(amount),
      totalAmountUnit: usesConcentration ? undefined : amountUnit,
      concentrationValue: usesConcentration ? parseFloat(concentration) : undefined,
      concentrationUnit: usesConcentration ? concentrationUnit : undefined,
      volumeMl: usesConcentration ? parseFloat(volumeMl) : undefined,
      packageUnit: usesConcentration ? 'vial' : packageUnit,
      packageQuantity: usesConcentration ? 1 : parseFloat(packageQuantity),
    });

    if (vialPayloads.length === 0) return;
    
    addVials(vialPayloads.map((vialPayload) => ({
      ...vialPayload,
      source,
      lotNumber,
      expirationDate: expirationDate.toISOString(),
      status
    })));

    // Reset form
    setName('');
    setPeptideId('');
    setDateAdded(new Date().toISOString().slice(0, 10));
    setContainerType('lyophilized-vial');
    setSource('');
    setLotNumber('');
    setAmount('');
    setAmountUnit('mg');
    setPackageUnit('vial');
    setPackageQuantity('1');
    setConcentration('');
    setConcentrationUnit('mg/ml');
    setVolumeMl('');
    setStatus('sealed');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[75vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Add Vial</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="vial-name">Vial name</Label>
            <Input
              id="vial-name"
              aria-label="Vial name"
              placeholder="e.g., KPV kit"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Compound</Label>
            <Select value={peptideId} onValueChange={handleCompoundChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select compound" />
              </SelectTrigger>
              <SelectContent>
                {trackableCompounds.map((compound) => (
                  <SelectItem key={compound.id} value={compound.id}>{compound.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vial-date-added">Date added</Label>
            <Input
              id="vial-date-added"
              aria-label="Date added"
              type="date"
              value={dateAdded}
              onChange={(e) => setDateAdded(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Container Type</Label>
            <Select value={containerType} onValueChange={(value) => setContainerType(value as InventoryContainerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lyophilized-vial">Lyophilized vial</SelectItem>
                <SelectItem value="multi-dose-vial">Multi-dose vial</SelectItem>
                <SelectItem value="prefilled-pen">Prefilled pen</SelectItem>
                <SelectItem value="capsule-bottle">Capsule bottle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Input
              placeholder="Optional vial source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Lot Number</Label>
            <Input
              placeholder="e.g., BPC-2024-001"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
            />
          </div>

          {usesConcentration ? (
            <div className="grid grid-cols-[1fr_116px] gap-2">
              <div className="space-y-2">
                <Label>Concentration</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 200"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={concentrationUnit} onValueChange={(value) => setConcentrationUnit(value as ConcentrationUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg/ml">mg/mL</SelectItem>
                    <SelectItem value="iu/ml">IU/mL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Volume (mL)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g., 10"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_104px] gap-2">
              <div className="space-y-2">
                <Label htmlFor="vial-size">Vial size</Label>
                <Input
                  id="vial-size"
                  aria-label="Vial size"
                  type="number"
                  step="any"
                  placeholder="e.g., 10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={amountUnit} onValueChange={(value) => setAmountUnit(value as DoseUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="iu">IU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-unit">Inventory unit</Label>
                <select
                  id="inventory-unit"
                  aria-label="Inventory unit"
                  value={packageUnit}
                  onChange={(e) => setPackageUnit(e.target.value as 'vial' | 'kit')}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="vial">Vials</option>
                  <option value="kit">Kits (10 vials)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-amount">Inventory amount</Label>
                <Input
                  id="inventory-amount"
                  aria-label="Inventory amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g., 1"
                  value={packageQuantity}
                  onChange={(e) => setPackageQuantity(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as VialStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sealed">Sealed</SelectItem>
                <SelectItem value="active">Active (Reconstituted)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full mt-6" 
            size="lg"
            onClick={handleSubmit}
            disabled={!peptideId || (usesConcentration ? !concentration || !volumeMl : !amount || !packageQuantity)}
          >
            Add Vial
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
