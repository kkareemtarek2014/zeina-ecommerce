'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Copy, X } from 'lucide-react';
import { useFeature } from '@/shared/contexts/FeatureContext';
import {
  markOverlayNavigation,
  useBackButtonClose,
} from '@/shared/hooks/useBackButtonClose';
import { WELCOME_OFFER } from '../welcome-offer.config';

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return WELCOME_OFFER.excludedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * First-visit popup offering 20% off the first order (code FIRST20).
 * Shows once per browser after a short delay; dismissing (any way) marks it seen.
 */
export function WelcomeOfferPopup() {
  const promoEnabled = useFeature('promo_code');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(WELCOME_OFFER.storageKey, '1');
    } catch {
      // Storage unavailable (private mode) — popup simply reappears next visit.
    }
  }, []);

  // Schedule the popup on first visit only.
  useEffect(() => {
    if (!promoEnabled || isExcludedPath(pathname)) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(WELCOME_OFFER.storageKey) === '1';
    } catch {
      seen = false;
    }
    if (seen) return;
    const timer = window.setTimeout(
      () => setOpen(true),
      WELCOME_OFFER.delayMs,
    );
    return () => window.clearTimeout(timer);
    // Intentionally not re-armed on route change once dismissed/shown.
  }, [promoEnabled, pathname]);

  // Esc to close + scroll lock + initial focus while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismiss]);

  useBackButtonClose(open, dismiss);

  // Hide if the user navigates into an excluded flow while it is open.
  if (!open || isExcludedPath(pathname)) return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) dismiss();
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(WELCOME_OFFER.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is visible to copy manually.
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-up w-full max-w-sm overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
      >
        {/* Decorative header */}
        <div className="relative bg-brand-blush px-6 pb-5 pt-7 text-center">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close welcome offer"
            onClick={dismiss}
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-primary"
          >
            <X className="size-5" />
          </button>
          <p className="text-3xl" aria-hidden>
            🫧🧸🫧
          </p>
          <span className="mt-3 inline-block rounded-full bg-brand-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-inverse">
            First order treat
          </span>
          <p
            id={titleId}
            className="mt-2 font-display text-4xl font-bold text-brand-primary"
          >
            {WELCOME_OFFER.percent}% OFF
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-5 text-center">
          <p className="font-display text-lg font-semibold text-text-primary">
            A little welcome gift
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Take {WELCOME_OFFER.percent}% off your first squishy order — use
            the code at checkout. Delivered anywhere in Egypt.
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="rounded-(--radius) border-2 border-dashed border-brand-primary bg-surface px-4 py-2 text-lg font-bold tracking-widest text-brand-primary">
              {WELCOME_OFFER.code}
            </span>
            <button
              type="button"
              aria-label={
                copied ? 'Code copied' : `Copy code ${WELCOME_OFFER.code}`
              }
              onClick={onCopy}
              className="rounded-(--radius) border border-border-strong p-2.5 text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              {copied ? (
                <Check className="size-5 text-status-success" />
              ) : (
                <Copy className="size-5" />
              )}
            </button>
          </div>
          <p
            className="mt-1.5 h-4 text-xs text-status-success"
            role="status"
            aria-live="polite"
          >
            {copied ? 'Copied — see you at checkout!' : ''}
          </p>

          <Link
            href="/shop"
            onClick={() => {
              markOverlayNavigation();
              dismiss();
            }}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-(--radius) bg-brand-primary px-6 text-sm font-medium text-text-inverse shadow-sm transition-colors hover:bg-brand-secondary"
          >
            Shop squishies
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
