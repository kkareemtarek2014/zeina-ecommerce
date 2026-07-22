import { formatEGP } from '@/shared/utils/price';

type SalesDay = { date: string; total: number };

interface SalesChartProps {
  data: SalesDay[];
}

function formatDayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function SalesChart({ data }: SalesChartProps) {
  const max = Math.max(...data.map((d) => d.total), 0);
  const hasSales = max > 0;

  if (!hasSales) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-surface-raised/50">
        <p className="text-sm text-text-muted">No sales in the last 14 days.</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-52 items-end gap-1 sm:gap-2"
      role="img"
      aria-label="Sales by day for the last 14 days"
    >
      {data.map((day) => {
        const pct = (day.total / max) * 100;
        return (
          <div
            key={day.date}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            {day.total > 0 ? (
              <span className="hidden text-[10px] text-text-muted sm:block">
                {formatEGP(day.total)}
              </span>
            ) : (
              <span className="hidden h-3 sm:block" aria-hidden />
            )}
            <div className="flex h-36 w-full items-end">
              <div
                className="w-full min-h-1 rounded-t-(--radius) bg-brand-primary/75 transition-[height]"
                style={{ height: `${Math.max(pct, day.total > 0 ? 4 : 0)}%` }}
                title={`${formatDayLabel(day.date)}: ${formatEGP(day.total)}`}
              />
            </div>
            <span className="truncate text-[10px] text-text-muted">
              {formatDayLabel(day.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
