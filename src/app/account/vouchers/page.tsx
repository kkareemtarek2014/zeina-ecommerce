import { Ticket } from 'lucide-react';

export default function VouchersPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">My Vouchers</h2>
        <p className="text-sm text-text-secondary mt-1">
          Exclusive discounts and promotional codes available for you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Mock Voucher 1 */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-brand-blush/50 p-6 shadow-sm transition-transform hover:-translate-y-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary text-white">
              <Ticket className="size-5" />
            </div>
            <span className="rounded-full bg-status-success/10 px-2 py-1 text-xs font-semibold text-status-success">
              Active
            </span>
          </div>
          <div>
            <h3 className="font-(family-name:--font-display) text-2xl font-bold text-text-primary">10% OFF</h3>
            <p className="mt-1 text-sm text-text-secondary">On all accessories</p>
            <div className="mt-4 flex items-center gap-2">
              <code className="rounded border border-border bg-surface-raised px-2 py-1 text-sm font-mono font-bold text-brand-primary">SQOOSH10</code>
            </div>
            <p className="mt-4 text-xs text-text-muted">Expires: 31 Dec 2026</p>
          </div>
        </div>

        {/* Mock Voucher 2 */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface-raised p-6 shadow-sm transition-transform hover:-translate-y-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-primary text-white">
              <Ticket className="size-5" />
            </div>
            <span className="rounded-full bg-status-success/10 px-2 py-1 text-xs font-semibold text-status-success">
              Active
            </span>
          </div>
          <div>
            <h3 className="font-(family-name:--font-display) text-2xl font-bold text-text-primary">20% OFF</h3>
            <p className="mt-1 text-sm text-text-secondary">Orders above 2000 EGP</p>
            <div className="mt-4 flex items-center gap-2">
              <code className="rounded border border-border bg-surface-raised px-2 py-1 text-sm font-mono font-bold text-brand-primary">SQOOSH20</code>
            </div>
            <p className="mt-4 text-xs text-text-muted">Expires: 15 Nov 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
