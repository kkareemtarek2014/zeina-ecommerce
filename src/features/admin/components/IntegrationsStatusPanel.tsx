'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui';
import type { IntegrationsStatusDTO } from '@/shared/contracts/integrations.contract';
import { api } from '@/shared/lib/api-client';

function ProviderRow({
  label,
  flag,
  configured,
  mock,
}: {
  label: string;
  flag: boolean;
  configured: boolean;
  mock: boolean;
}) {
  const ready = flag && configured;
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <span className="font-medium text-text-primary">{label}</span>
      <span className="text-xs text-text-muted">
        flag {flag ? 'ON' : 'OFF'}
        {' · '}
        {configured ? (mock ? 'mock keys' : 'configured') : 'missing secrets'}
        {ready ? ' · ready' : ''}
      </span>
    </li>
  );
}

export function IntegrationsStatusPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'integrations', 'status'],
    queryFn: () =>
      api.get<IntegrationsStatusDTO>('/api/admin/integrations/status'),
    staleTime: 30_000,
  });

  return (
    <section className="mt-10 max-w-xl rounded-lg border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-(family-name:--font-display) text-lg font-semibold text-text-primary">
            Integrations (Paymob / Bosta)
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Go-live health. Swap mock secrets for production keys in Wrangler
            before enabling flags in production. Run{' '}
            <span className="font-mono">integrations-reconcile</span> to sync
            missed webhooks.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          isLoading={isFetching}
          onClick={() => void refetch()}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-text-muted">Loading…</p>
      ) : isError || !data ? (
        <p className="mt-4 text-sm text-status-error">
          Could not load integrations status.
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border">
            <ProviderRow
              label="Paymob (online payments)"
              flag={data.onlinePayments.flag}
              configured={data.onlinePayments.configured}
              mock={data.onlinePayments.mock}
            />
            <ProviderRow
              label="Bosta (shipping)"
              flag={data.bostaShipping.flag}
              configured={data.bostaShipping.configured}
              mock={data.bostaShipping.mock}
            />
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-(--radius) bg-brand-blush/40 px-2 py-3">
              <p className="text-lg font-semibold text-text-primary">
                {data.issues.paymentMismatch}
              </p>
              <p className="text-text-muted">Payment drift</p>
            </div>
            <div className="rounded-(--radius) bg-brand-blush/40 px-2 py-3">
              <p className="text-lg font-semibold text-text-primary">
                {data.issues.missingShipment}
              </p>
              <p className="text-text-muted">Missing ship</p>
            </div>
            <div className="rounded-(--radius) bg-brand-blush/40 px-2 py-3">
              <p className="text-lg font-semibold text-text-primary">
                {data.issues.statusDrift}
              </p>
              <p className="text-text-muted">Status drift</p>
            </div>
          </div>

          {data.samples.length > 0 ? (
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-xs text-text-secondary">
              {data.samples.map((s) => (
                <li key={`${s.kind}-${s.orderId}-${s.detail}`}>
                  <Link
                    href={`/admin/orders/${encodeURIComponent(s.orderId)}`}
                    className="font-medium text-brand-primary hover:underline"
                  >
                    {s.orderId}
                  </Link>
                  <span className="text-text-muted"> · {s.kind}</span>
                  <span> — {s.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-status-success">
              No order ↔ payment ↔ shipment mismatches detected.
            </p>
          )}
        </>
      )}
    </section>
  );
}
