import type { Dose, Stack, StackPeptide } from './types';

export type StackConflictSeverity = 'info' | 'review';

export interface StackConflictWarning {
  id: string;
  severity: StackConflictSeverity;
  blocking: boolean;
  title: string;
  message: string;
}

export interface StackConflictInput {
  draftPeptides: StackPeptide[];
  existingStacks: Stack[];
  recentDoses: Dose[];
  peptideNameById: Record<string, string>;
  now?: Date;
}

const injectableRoutes = new Set(['subq', 'im']);

function peptideName(peptideId: string, names: Record<string, string>): string {
  return names[peptideId] ?? peptideId;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function getStackConflictWarnings(input: StackConflictInput): StackConflictWarning[] {
  const warnings: StackConflictWarning[] = [];
  const { draftPeptides, existingStacks, recentDoses, peptideNameById } = input;
  const now = input.now ?? new Date();

  const peptideCounts = new Map<string, number>();
  draftPeptides.forEach((peptide) => {
    peptideCounts.set(peptide.peptideId, (peptideCounts.get(peptide.peptideId) ?? 0) + 1);
  });

  peptideCounts.forEach((count, peptideId) => {
    if (count <= 1) return;
    warnings.push({
      id: `duplicate-peptide:${peptideId}`,
      severity: 'review',
      blocking: false,
      title: 'Review duplicate peptide',
      message: `${peptideName(peptideId, peptideNameById)} appears more than once in this draft. Review whether these entries should be combined or intentionally separated.`,
    });
  });

  const activeStacks = existingStacks.filter((stack) => stack.status === 'active');
  draftPeptides.forEach((draftPeptide) => {
    activeStacks.forEach((stack) => {
      if (!stack.peptides.some((peptide) => peptide.peptideId === draftPeptide.peptideId)) return;
      warnings.push({
        id: `active-overlap:${draftPeptide.peptideId}:${stack.id}`,
        severity: 'review',
        blocking: false,
        title: 'Review active stack overlap',
        message: `${peptideName(draftPeptide.peptideId, peptideNameById)} is already present in active stack "${stack.name}". Review overlap before saving this draft.`,
      });
    });
  });

  const usesInjectableRoute = draftPeptides.some((peptide) => injectableRoutes.has(peptide.route));
  if (usesInjectableRoute) {
    const recentSiteCounts = new Map<string, { route: string; site: string; count: number }>();
    recentDoses
      .filter((dose) => dose.completed && injectableRoutes.has(dose.route) && dose.site)
      .filter((dose) => daysBetween(now, new Date(dose.dateTime)) <= 7)
      .forEach((dose) => {
        const key = `${dose.route}:${dose.site}`;
        const previous = recentSiteCounts.get(key) ?? { route: dose.route, site: dose.site, count: 0 };
        recentSiteCounts.set(key, { ...previous, count: previous.count + 1 });
      });

    recentSiteCounts.forEach(({ route, site, count }) => {
      if (count < 3) return;
      warnings.push({
        id: `route-site-load:${route}:${site}`,
        severity: 'info',
        blocking: false,
        title: 'Review recent site load',
        message: `${site.replace(/-/g, ' ')} has ${count} completed ${route.toUpperCase()} entries in the last 7 days. Consider rotation planning for this stack.`,
      });
    });
  }

  return warnings;
}
