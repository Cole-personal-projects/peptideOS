export type EmptyStateKey =
  | 'library-no-results'
  | 'stacks-empty'
  | 'log-day-empty'
  | 'log-timeline-empty'
  | 'inventory-active-empty'
  | 'inventory-sealed-empty'
  | 'inventory-history-empty';

export interface EmptyStateContent {
  title: string;
  description: string;
  actionLabel?: string;
}

const emptyStateContent: Record<EmptyStateKey, EmptyStateContent> = {
  'library-no-results': {
    title: 'No matching peptides',
    description: 'Adjust the search text or category filter to return to the reference library.',
    actionLabel: 'Clear filters',
  },
  'stacks-empty': {
    title: 'No stacks planned',
    description: 'Create a research stack to group compounds, schedules, duration, and review notes in one place.',
    actionLabel: 'Create stack',
  },
  'log-day-empty': {
    title: 'No doses on this day',
    description: 'Logged and planned doses for the selected date will appear here with route, site, and native unit.',
  },
  'log-timeline-empty': {
    title: 'No dose history',
    description: 'Completed doses will build a timeline grouped by day. Change the peptide filter if history is hidden.',
  },
  'inventory-active-empty': {
    title: 'No active vials',
    description: 'Active reconstituted vials will show concentration, remaining amount, and date metadata here.',
    actionLabel: 'Add vial',
  },
  'inventory-sealed-empty': {
    title: 'No sealed vials',
    description: 'Add a sealed vial when a compound enters inventory, then reconstitute it when it becomes active.',
    actionLabel: 'Add vial',
  },
  'inventory-history-empty': {
    title: 'No vial history',
    description: 'Finished and expired vial records will appear here once inventory starts moving through statuses.',
  },
};

export function getEmptyStateContent(key: EmptyStateKey): EmptyStateContent {
  return emptyStateContent[key];
}
