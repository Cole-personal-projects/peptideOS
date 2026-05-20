"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/lib/context';
import type { VialStatus } from '@/lib/types';

interface AddVialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVialSheet({ open, onOpenChange }: AddVialSheetProps) {
  const { data, addVial } = useApp();
  const [peptideId, setPeptideId] = useState('');
  const [source, setSource] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [mg, setMg] = useState('');
  const [status, setStatus] = useState<VialStatus>('sealed');

  const handleSubmit = () => {
    if (!peptideId || !mg || !lotNumber) return;
    
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 12);
    
    addVial({
      name: `${data.peptides.find((peptide) => peptide.id === peptideId)?.name ?? 'Vial'} vial`,
      peptideId,
      dateAdded: new Date().toISOString(),
      source,
      lotNumber,
      mg: parseFloat(mg),
      bacWaterMl: 0,
      reconstitutedDate: null,
      expirationDate: expirationDate.toISOString(),
      status
    });

    // Reset form
    setPeptideId('');
    setSource('');
    setLotNumber('');
    setMg('');
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
            <Label>Peptide</Label>
            <Select value={peptideId} onValueChange={setPeptideId}>
              <SelectTrigger>
                <SelectValue placeholder="Select peptide" />
              </SelectTrigger>
              <SelectContent>
                {data.peptides.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
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

          <div className="space-y-2">
            <Label>Amount (mg)</Label>
            <Input
              type="number"
              placeholder="e.g., 5"
              value={mg}
              onChange={(e) => setMg(e.target.value)}
            />
          </div>

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
            disabled={!peptideId || !mg || !lotNumber}
          >
            Add Vial
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
