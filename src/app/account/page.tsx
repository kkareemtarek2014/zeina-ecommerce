import Link from 'next/link';
import { Heart, MapPin, Package, User } from 'lucide-react';

const CARDS = [
  {
    href: '/account/orders',
    label: 'My Orders',
    text: 'Track and review your orders',
    icon: Package,
  },
  {
    href: '/account/favorites',
    label: 'Favorites',
    text: 'Products you saved for later',
    icon: Heart,
  },
  {
    href: '/account/addresses',
    label: 'My Addresses',
    text: 'Manage delivery addresses',
    icon: MapPin,
  },
  {
    href: '/account/profile',
    label: 'My Profile',
    text: 'Name, phone and email',
    icon: User,
  },
] as const;

export default function AccountPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CARDS.map(({ href, label, text, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-lg border border-border bg-surface-raised p-5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-primary/40"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
            <Icon className="size-5" />
          </span>
          <p className="mt-3 font-semibold transition-colors group-hover:text-brand-primary">
            {label}
          </p>
          <p className="mt-1 text-xs text-text-muted">{text}</p>
        </Link>
      ))}
    </div>
  );
}
