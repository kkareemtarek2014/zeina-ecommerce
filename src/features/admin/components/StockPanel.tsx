'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Select, useToast } from '@/shared/components/ui';
import type { AdminProductDTO } from '@/shared/contracts/admin-catalog.contract';
import type { AdminStockAdjust } from '@/shared/contracts/admin-inventory.contract';
import { AppError } from '@/shared/contracts/errors';
import { adminCatalogService } from '../services/admin-catalog.service';
import { adminKeys } from '../hooks/useAdminCatalog';

interface StockPanelProps {
  product: AdminProductDTO;
}

export function StockPanel({ product }: StockPanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState<AdminStockAdjust['reason']>('restock');
  const [note, setNote] = useState('');

  const historyQuery = useQuery({
    queryKey: ['admin', 'inventory', product.id],
    queryFn: () => adminCatalogService.listInventory(product.id),
  });

  const adjustMutation = useMutation({
    mutationFn: (input: AdminStockAdjust) =>
      adminCatalogService.adjustStock(product.id, input),
    onSuccess: (updated) => {
      qc.setQueryData(adminKeys.product(product.id), updated);
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'inventory', product.id] });
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast('Stock updated', 'success');
      setNote('');
    },
    onError: (err) => {
      toast(
        err instanceof AppError ? err.message : 'Could not adjust stock',
        'error',
      );
    },
  });

  const available = product.availableQty ?? product.stockQty;
  const reserved = product.reservedQty ?? 0;

  return (
    <section className="mt-10 max-w-xl space-y-4 rounded-(--radius) border border-border p-4">
      <div>
        <h2 className="font-(family-name:--font-display) text-xl font-semibold text-text-primary">
          Inventory
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          On hand {product.stockQty} · Reserved {reserved} · Available{' '}
          {available}
        </p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!Number.isFinite(delta) || delta === 0) {
            toast('Enter a non-zero quantity', 'error');
            return;
          }
          if (reason !== 'adjustment' && delta < 0) {
            toast('Use a positive quantity for restock/return', 'error');
            return;
          }
          adjustMutation.mutate({
            delta: reason === 'adjustment' ? delta : Math.abs(delta),
            reason,
            note: note.trim() || null,
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={reason === 'adjustment' ? 'Delta (+/−)' : 'Quantity'}
            type="number"
            value={Number.isFinite(delta) ? delta : 0}
            onChange={(e) => setDelta(Number(e.target.value))}
          />
          <Select
            label="Reason"
            value={reason}
            onChange={(e) =>
              setReason(e.target.value as AdminStockAdjust['reason'])
            }
          >
            <option value="restock">Restock</option>
            <option value="return">Return</option>
            <option value="adjustment">Adjustment</option>
          </Select>
        </div>
        <Input
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button type="submit" isLoading={adjustMutation.isPending}>
          Apply stock change
        </Button>
      </form>

      <div>
        <h3 className="text-sm font-medium text-text-secondary">
          Movement history
        </h3>
        {historyQuery.isLoading ? (
          <p className="mt-2 text-xs text-text-muted">Loading…</p>
        ) : historyQuery.isError ? (
          <p className="mt-2 text-xs text-status-error">Failed to load history.</p>
        ) : (historyQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-2 text-xs text-text-muted">No movements yet.</p>
        ) : (
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
            {historyQuery.data?.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-2"
              >
                <span>
                  <span className="font-medium capitalize">{m.reason}</span>
                  <span className="text-text-muted">
                    {' '}
                    · {m.oldQty} → {m.newQty} ({m.delta > 0 ? '+' : ''}
                    {m.delta})
                  </span>
                  {m.note ? (
                    <span className="block text-xs text-text-muted">{m.note}</span>
                  ) : null}
                </span>
                <time className="text-xs text-text-muted">
                  {new Date(m.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
