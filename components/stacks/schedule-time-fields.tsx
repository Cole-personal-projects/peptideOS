"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getDefaultScheduleRecurrence, getScheduleSummary, normalizeScheduleRecurrence } from '@/lib/schedules';
import type { StackPeptide } from '@/lib/types';

interface ScheduleTimeFieldsProps {
  stackPeptide: StackPeptide;
  idPrefix: string;
  onTimesChange: (timesOfDay: string[]) => void;
}

export function ScheduleTimeFields({ stackPeptide, idPrefix, onTimesChange }: ScheduleTimeFieldsProps) {
  const recurrence = normalizeScheduleRecurrence(stackPeptide.schedule ?? getDefaultScheduleRecurrence(stackPeptide));
  const timesOfDay = recurrence.timesOfDay.length > 0 ? recurrence.timesOfDay : ['08:00'];

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {timesOfDay.map((timeOfDay, index) => (
          <div key={`${idPrefix}-time-${index}`} className="space-y-1">
            <Label htmlFor={`${idPrefix}-time-${index}`} className="text-xs">
              {timesOfDay.length > 1 ? `Dose time ${index + 1}` : 'Dose time'}
            </Label>
            <Input
              id={`${idPrefix}-time-${index}`}
              type="time"
              value={timeOfDay}
              onChange={(event) => {
                const nextTimes = [...timesOfDay];
                nextTimes[index] = event.target.value;
                onTimesChange(nextTimes);
              }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {getScheduleSummary(recurrence)}
      </p>
    </div>
  );
}
