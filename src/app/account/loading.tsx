import { AccountListSkeleton } from '@/shared/components/ui';

/** Layout already provides H1 + nav — only the page pane suspends. */
export default function Loading() {
  return <AccountListSkeleton />;
}
