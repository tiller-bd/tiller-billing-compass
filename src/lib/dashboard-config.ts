// ── Widget registry and layout types ──────────────────────────────────────────

export const WIDGET_IDS = [
  'metrics',
  'pg_metrics',
  'charts',
  'revenue',
  'projects',
  'info_row',
  'bill_status',
] as const;

export type WidgetId = typeof WIDGET_IDS[number];

export interface WidgetMeta {
  id: WidgetId;
  label: string;
  description: string;
  defaultVisible: boolean;
  alwaysVisible?: boolean; // cannot be hidden (e.g. filters)
}

export const WIDGET_META: Record<WidgetId, WidgetMeta> = {
  metrics: {
    id: 'metrics',
    label: 'Key Metrics',
    description: 'Total billed, received, outstanding and project counts',
    defaultVisible: true,
  },
  pg_metrics: {
    id: 'pg_metrics',
    label: 'Project Guarantee Overview',
    description: 'PG deposited, cleared and pending amounts',
    defaultVisible: true,
  },
  charts: {
    id: 'charts',
    label: 'Client Distribution & Budget',
    description: 'Client distribution pie and budget vs received bar chart',
    defaultVisible: true,
  },
  revenue: {
    id: 'revenue',
    label: 'Revenue Trend',
    description: 'Monthly and yearly revenue line chart',
    defaultVisible: false,
  },
  bill_status: {
    id: 'bill_status',
    label: 'Bill Status Breakdown',
    description: 'Count and amount breakdown of paid, partial and pending bills',
    defaultVisible: true,
  },
  projects: {
    id: 'projects',
    label: 'Projects Table',
    description: 'Full projects list with status and billing details',
    defaultVisible: true,
  },
  info_row: {
    id: 'info_row',
    label: 'Last Received · Deadlines · Calendar',
    description: 'Recent payments, upcoming deadlines and project calendar',
    defaultVisible: true,
  },
};

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: WIDGET_IDS.map(id => ({
    id,
    visible: WIDGET_META[id].defaultVisible,
  })),
};

export function mergeWithDefaults(saved: Partial<DashboardLayout>): DashboardLayout {
  const savedWidgets = saved.widgets ?? [];
  const savedMap = new Map(savedWidgets.map(w => [w.id, w]));

  // Keep saved order for known ids, append new ids at end
  const knownSaved = savedWidgets.filter(w => WIDGET_IDS.includes(w.id as WidgetId));
  const savedIds   = new Set(knownSaved.map(w => w.id));
  const newIds     = WIDGET_IDS.filter(id => !savedIds.has(id));

  return {
    widgets: [
      ...knownSaved.map(w => ({ id: w.id as WidgetId, visible: w.visible })),
      ...newIds.map(id => ({ id, visible: WIDGET_META[id].defaultVisible })),
    ],
  };
}
