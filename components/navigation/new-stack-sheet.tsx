"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/lib/context';

interface NewStackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewStackSheet({ open, onOpenChange }: NewStackSheetProps) {
  const { data, addStack } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPeptides, setSelectedPeptides] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState('28');

  const handlePeptideToggle = (peptideId: string) => {
    setSelectedPeptides(prev => 
      prev.includes(peptideId)
        ? prev.filter(id => id !== peptideId)
        : [...prev, peptideId]
    );
  };

  const handleSubmit = () => {
    if (!name || selectedPeptides.length === 0) return;
    
    addStack({
      name,
      description,
      peptides: selectedPeptides.map(peptideId => {
        const peptide = data.peptides.find(p => p.id === peptideId);
        return {
          peptideId,
          doseMcg: 250,
          frequency: 'daily',
          route: peptide?.defaultRoute || 'subq',
          timing: 'Morning'
        };
      }),
      startDate: new Date().toISOString(),
      durationDays: parseInt(durationDays),
      status: 'planned',
      notes: ''
    });

    // Reset form
    setName('');
    setDescription('');
    setSelectedPeptides([]);
    setDurationDays('28');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>New Stack</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4 pb-8">
          <div className="space-y-2">
            <Label>Stack Name</Label>
            <Input
              placeholder="e.g., Healing Protocol"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of this stack's purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Duration (days)</Label>
            <Input
              type="number"
              placeholder="28"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Peptides</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {data.peptides.map((peptide) => (
                <label
                  key={peptide.id}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80"
                >
                  <Checkbox
                    checked={selectedPeptides.includes(peptide.id)}
                    onCheckedChange={() => handlePeptideToggle(peptide.id)}
                  />
                  <span className="text-sm font-medium">{peptide.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button 
            className="w-full mt-6" 
            size="lg"
            onClick={handleSubmit}
            disabled={!name || selectedPeptides.length === 0}
          >
            Create Stack
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
