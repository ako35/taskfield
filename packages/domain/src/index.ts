export const VISIT_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const ORDER_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface DailyVisitSummary {
  planned: number;
  completed: number;
  inProgress: number;
  orderTotal: number;
}