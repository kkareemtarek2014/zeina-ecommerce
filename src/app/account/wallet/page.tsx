import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';

export default function WalletPage() {
  const balance = 1250;
  
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">My Wallet</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your store credits and refunds.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">Available Balance</p>
            <p className="font-(family-name:--font-display) text-3xl font-bold text-text-primary">
              {formatEGP(balance)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-text-primary">Recent Transactions</h3>
        <div className="divide-y divide-border rounded-xl border border-border bg-surface-raised">
          {/* Mock transaction */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-status-success/10 text-status-success">
                <ArrowDownLeft className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Refund for Order #10024</p>
                <p className="text-xs text-text-muted">12 Oct 2026</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-status-success">+{formatEGP(1250)}</p>
          </div>
          {/* Mock transaction 2 */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-status-error/10 text-status-error">
                <ArrowUpRight className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Used for Order #10058</p>
                <p className="text-xs text-text-muted">05 Sep 2026</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-status-error">-{formatEGP(450)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
