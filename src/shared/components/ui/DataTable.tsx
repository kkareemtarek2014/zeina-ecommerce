'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  cell: (row: T) => ReactNode;
}


interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No rows yet.',
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-text-secondary">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-lg border border-border bg-surface-raised',
        className,
      )}
    >
      <table className="w-full min-w-xl text-left text-sm">
        <thead className="border-b border-border bg-brand-blush/40 text-text-secondary">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-medium whitespace-nowrap',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-brand-blush/20">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-4 py-3 text-text-primary', col.className)}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
