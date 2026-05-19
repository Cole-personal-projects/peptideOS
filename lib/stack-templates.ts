import type { DoseUnit, Route, StackPeptide } from './types';

export interface StackTemplatePeptide extends StackPeptide {}

export interface StackTemplate {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  category: 'recovery' | 'metabolic' | 'growth';
  peptides: StackTemplatePeptide[];
}

export interface StackTemplateDraft {
  name: string;
  description: string;
  durationDays: number;
  peptides: StackTemplatePeptide[];
}

function peptide(
  peptideId: string,
  doseValue: number,
  doseUnit: DoseUnit,
  frequency: string,
  route: Route,
  timing: string,
): StackTemplatePeptide {
  return {
    peptideId,
    doseValue,
    doseUnit,
    frequency,
    route,
    timing,
  };
}

export const stackTemplates: StackTemplate[] = [
  {
    id: 'healing-recovery-demo',
    name: 'Healing Recovery Demo',
    description: 'Research-oriented recovery stack starter using existing demo compounds.',
    durationDays: 42,
    category: 'recovery',
    peptides: [
      peptide('bpc-157', 250, 'mcg', '2x daily', 'subq', 'Morning and evening'),
      peptide('tb-500', 2.5, 'mg', '2x weekly', 'subq', 'Monday and Thursday'),
    ],
  },
  {
    id: 'metabolic-reset-demo',
    name: 'Metabolic Reset Demo',
    description: 'Demo metabolic stack starter preserving native mg dosing.',
    durationDays: 84,
    category: 'metabolic',
    peptides: [
      peptide('semaglutide', 0.5, 'mg', 'weekly', 'subq', 'Sunday morning'),
      peptide('mots-c', 5, 'mg', '2x weekly', 'subq', 'Pre-workout days'),
    ],
  },
  {
    id: 'gh-support-demo',
    name: 'GH Support Demo',
    description: 'Demo growth-support stack starter preserving IU-native hGH dosing.',
    durationDays: 56,
    category: 'growth',
    peptides: [
      peptide('hgh', 2, 'iu', 'daily', 'subq', 'Evening'),
      peptide('ipamorelin', 200, 'mcg', 'daily', 'subq', 'Pre-bed'),
    ],
  },
];

export function getStackTemplateById(templateId: string): StackTemplate | null {
  return stackTemplates.find((template) => template.id === templateId) ?? null;
}

export function templateToStackDraft(templateId: string): StackTemplateDraft | null {
  const template = getStackTemplateById(templateId);
  if (!template) return null;

  return {
    name: template.name,
    description: template.description,
    durationDays: template.durationDays,
    peptides: template.peptides.map((peptideTemplate) => ({ ...peptideTemplate })),
  };
}
