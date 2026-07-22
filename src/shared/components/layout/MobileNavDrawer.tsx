'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User } from 'lucide-react';
import { Drawer } from '@/shared/components/ui';
import { markOverlayNavigation } from '@/shared/hooks/useBackButtonClose';
import { cn } from '@/shared/utils/cn';

export interface MobileNavLink {
  href: string;
  label: string;
}

interface MobileNavDrawerProps {
  links: MobileNavLink[];
  siteName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNavDrawer({
  links,
  siteName,
  isOpen,
  onOpenChange,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    onOpenChangeRef.current(false);
  }, [pathname]);

  const close = () => onOpenChange(false);
  // Closing as part of a link navigation: keep useBackButtonClose from popping
  // history and cancelling the forward navigation (App Router pushes async).
  const closeForNav = () => {
    markOverlayNavigation();
    onOpenChange(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        onClick={() => onOpenChange(!isOpen)}
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-brand-blush md:hidden"
      >
        <Menu className="size-5" />
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={close}
        title={siteName}
        side="left"
      >
        <div id="mobile-nav-drawer" className="flex h-full flex-col">
          <nav
            aria-label="Mobile navigation"
            className="flex flex-1 flex-col gap-1"
          >
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeForNav}
                  className={cn(
                    'rounded-lg px-3 py-3 text-sm font-medium transition-colors active:scale-[0.97]',
                    isActive
                      ? 'bg-brand-blush/70 text-brand-primary'
                      : 'text-text-primary hover:bg-brand-blush/50',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-border pt-4">
            <Link
              href="/account"
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-brand-blush/50 active:scale-[0.97]"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
                <User className="size-4" />
              </span>
              My account
            </Link>
          </div>
        </div>
      </Drawer>
    </>
  );
}

