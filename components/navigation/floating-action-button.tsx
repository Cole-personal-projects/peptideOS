"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Syringe, FlaskConical, Layers, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LogDoseSheet } from './log-dose-sheet';
import { AddVialSheet } from './add-vial-sheet';
import { NewStackSheet } from './new-stack-sheet';
import type { LucideIcon } from 'lucide-react';

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  href?: string;
};

const actions: QuickAction[] = [
  { id: 'log-dose', label: 'Log Dose', icon: Syringe, color: 'text-primary' },
  { id: 'add-vial', label: 'Add Vial', icon: FlaskConical, color: 'text-accent' },
  { id: 'new-stack', label: 'New Stack', icon: Layers, color: 'text-chart-3' },
  { id: 'reconstitution', label: 'Calculate Reconstitution', icon: Calculator, color: 'text-chart-4', href: '/more/reconstitution' },
  { id: 'ai-assistant', label: 'Peppi', icon: Bot, color: 'text-chart-5', href: '/more/ai-assistant' },
];

export function FloatingActionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleActionClick = (action: QuickAction) => {
    setOpen(false);
    if (action.href) {
      router.push(action.href);
      return;
    }
    setTimeout(() => setActiveSheet(action.id), 150);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className={cn(
              "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
              "w-14 h-14 rounded-full shadow-lg shadow-primary/25",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "transition-transform active:scale-95"
            )}
          >
            <Plus className="w-6 h-6" />
            <span className="sr-only">Quick actions</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle>Quick Actions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  <div className={cn("p-2 rounded-lg bg-background", action.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <LogDoseSheet open={activeSheet === 'log-dose'} onOpenChange={(o) => !o && setActiveSheet(null)} />
      <AddVialSheet open={activeSheet === 'add-vial'} onOpenChange={(o) => !o && setActiveSheet(null)} />
      <NewStackSheet open={activeSheet === 'new-stack'} onOpenChange={(o) => !o && setActiveSheet(null)} />
    </>
  );
}
