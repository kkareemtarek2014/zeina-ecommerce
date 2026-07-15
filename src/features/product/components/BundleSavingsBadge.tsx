import { Badge } from '@/shared/components/ui';
import { formatEGP } from '@/shared/utils/price';

interface BundleSavingsBadgeProps {
  amountEgp: number;
}

/** Gold accent savings callout for bundle merchandising. */
export function BundleSavingsBadge({ amountEgp }: BundleSavingsBadgeProps) {
  if (amountEgp <= 0) return null;
  return (
    <Badge tone="accent" className="font-semibold">
      You save {formatEGP(amountEgp)}
    </Badge>
  );
}
