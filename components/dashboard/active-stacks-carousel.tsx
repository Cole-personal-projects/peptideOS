"use client";

import Link from 'next/link';
import { ChevronRight, Play, Pause, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';

export function ActiveStacksCarousel() {
  const { getActiveStacks, getPeptide } = useApp();
  const activeStacks = getActiveStacks();

  const getProgressPercentage = (startDate: string, durationDays: number) => {
    const start = new Date(startDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max((elapsed / durationDays) * 100, 0), 100);
  };

  const getDaysRemaining = (startDate: string, durationDays: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    const now = new Date();
    const remaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(remaining, 0);
  };

  if (activeStacks.length === 0) {
    return (
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
<h2 className="text-base font-semibold">Active Protocols</h2>
          <Link href="/stacks" className="text-sm text-primary flex items-center">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <Card className="bg-secondary/50 border-dashed">
          <CardContent className="py-8 text-center">
<p className="text-muted-foreground text-sm">No active protocols</p>
            <Link href="/stacks" className="text-primary text-sm mt-1 inline-block">
              Create your first protocol
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-4">
<h2 className="text-base font-semibold">Active Protocols</h2>
        <Link href="/stacks" className="text-sm text-primary flex items-center">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {activeStacks.map((stack) => {
          const progress = getProgressPercentage(stack.startDate, stack.durationDays);
          const daysRemaining = getDaysRemaining(stack.startDate, stack.durationDays);
          
          return (
            <Link key={stack.id} href={`/stacks/${stack.id}`} className="flex-shrink-0">
              <Card className="w-64 hover:bg-secondary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{stack.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stack.peptides.length} peptide{stack.peptides.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[11px]",
                        stack.status === 'active' && "bg-primary/20 text-primary"
                      )}
                    >
                      {stack.status === 'active' ? (
                        <><Play className="w-2.5 h-2.5 mr-1" /> Active</>
                      ) : (
                        <><Pause className="w-2.5 h-2.5 mr-1" /> {stack.status}</>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5 mt-3">
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysRemaining} days left
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {stack.peptides.slice(0, 3).map((sp) => {
                      const peptide = getPeptide(sp.peptideId);
                      return (
<Badge key={sp.peptideId} variant="outline" className="px-1.5 text-[11px]">
                          {peptide?.name}
                        </Badge>
                      );
                    })}
                    {stack.peptides.length > 3 && (
<Badge variant="outline" className="px-1.5 text-[11px]">
                        +{stack.peptides.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
