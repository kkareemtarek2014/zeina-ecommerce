import { cn } from '@/shared/utils/cn';
import { ORDER_STATUS_LABELS } from '../OrderStatusSelect';

export interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_STYLE_MAP: Record<string, string> = {
  // Order statuses
  pending: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  confirmed: 'bg-status-info/10 text-status-info border-status-info/30',
  shipped: 'bg-brand-primary/10 text-brand-primary border-brand-primary/30',
  delivered: 'bg-status-success/10 text-status-success border-status-success/30',
  cancelled: 'bg-status-error/10 text-status-error border-status-error/30',
  refunded: 'bg-status-error/10 text-status-error border-status-error/30',

  // Product / Catalog statuses
  published: 'bg-status-success/10 text-status-success border-status-success/30',
  active: 'bg-status-success/10 text-status-success border-status-success/30',
  draft: 'bg-text-muted/10 text-text-muted border-text-muted/30',
  hidden: 'bg-text-muted/10 text-text-muted border-text-muted/30',
  archived: 'bg-text-muted/10 text-text-muted border-text-muted/30',
};

function formatStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[normalized as keyof typeof ORDER_STATUS_LABELS];
  }
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export function StatusPill({
  status,
  size = 'md',
  className,
}: StatusPillProps) {
  const normalized = status.toLowerCase();
  const styleClasses =
    STATUS_STYLE_MAP[normalized] ??
    'bg-text-muted/10 text-text-muted border-text-muted/30';
  const label = formatStatusLabel(status);

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full tracking-wide',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        styleClasses,
        className
      )}
    >
      {label}
    </span>
  );
}
