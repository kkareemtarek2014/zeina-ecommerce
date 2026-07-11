'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  MapPin,
  Package,
  User,
  UserCircle2,
  Wallet,
  Ticket,
  LogOut,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const LINKS = [
  { href: '/account', label: 'Overview', icon: UserCircle2 },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/favorites', label: 'Favorites', icon: Heart },
  { href: '/account/addresses', label: 'My Addresses', icon: MapPin },
  { href: '/account/profile', label: 'My Profile', icon: User },
  { href: '/account/wallet', label: 'My Wallet', icon: Wallet },
  { href: '/account/vouchers', label: 'Vouchers', icon: Ticket },
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account navigation"
      className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col"
    >
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex shrink-0 items-center gap-3 rounded-(--radius) px-4 py-2.5 text-sm transition-colors',
            pathname === href
              ? 'bg-brand-blush font-medium text-brand-primary'
              : 'text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary',
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
      <div className="mt-4 hidden lg:block border-t border-border pt-4">
        <button
          type="button"
          onClick={() => { window.location.href = '/'; }}
          className="flex w-full shrink-0 items-center gap-3 rounded-(--radius) px-4 py-2.5 text-sm transition-colors text-status-error hover:bg-status-error/10"
        >
          <LogOut className="size-4" />
          Log Out
        </button>
      </div>
      {/* Mobile logout */}
      <button
        type="button"
        onClick={() => { window.location.href = '/'; }}
        className="flex shrink-0 items-center gap-3 rounded-(--radius) px-4 py-2.5 text-sm transition-colors text-status-error hover:bg-status-error/10 lg:hidden"
      >
        <LogOut className="size-4" />
        Log Out
      </button>
    </nav>
  );
}
