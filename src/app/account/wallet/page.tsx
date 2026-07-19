import { Metadata } from 'next';
import { MyWallet } from '@/features/account';

export const metadata: Metadata = {
  title: 'My Wallet',
  description: 'View your Sqoosh store credit and transaction history.',
};

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          My Wallet
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          View your store credit and transaction history.
        </p>
      </div>

      <MyWallet />
    </div>
  );
}
