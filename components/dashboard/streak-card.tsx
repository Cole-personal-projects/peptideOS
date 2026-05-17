"use client";

import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/context';

export function StreakCard() {
  const { getStreak } = useApp();
  const streak = getStreak();

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="py-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/20">
          <Flame className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{streak}</p>
          <p className="text-sm text-muted-foreground">Day streak</p>
        </div>
      </CardContent>
    </Card>
  );
}
