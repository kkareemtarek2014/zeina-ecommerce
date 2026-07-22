'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { useFeature } from '@/shared/contexts/FeatureContext';
import { WELCOME_OFFER } from '../welcome-offer.config';

/**
 * Permanent (non-dismissible) confirmation strip for Instagram/TikTok traffic —
 * unlike `WelcomeOfferPopup` (shows once), this always renders under the hero
 * so an ad's "20% off" promise is confirmed the instant the page loads.
 */
export function WelcomeOfferStrip() {
  const enabled = useFeature('promo_code');
  const [copied, setCopied] = useState(false);

  if (!enabled) return null;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(WELCOME_OFFER.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still visible to copy manually.
    }
  };

  return (
    <div className="animate-fade-up border-y border-brand-primary/15 bg-brand-blush">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-center gap-3 px-4 py-3 text-center lg:px-8">
        <p className="text-sm font-medium text-text-primary">
          🫧 First order? Take{' '}
          <span className="font-semibold text-brand-primary">
            {WELCOME_OFFER.percent}% off
          </span>{' '}
          with code
        </p>
        <button
          type="button"
          onClick={onCopy}
          aria-label={
            copied ? 'Code copied' : `Copy code ${WELCOME_OFFER.code}`
          }
          className="inline-flex items-center gap-1.5 rounded-(--radius) border-2 border-dashed border-brand-primary bg-surface-raised px-3 py-1 text-sm font-bold tracking-widest text-brand-primary transition-colors hover:bg-brand-blush"
        >
          {WELCOME_OFFER.code}
          {copied ? (
            <Check className="size-3.5 text-status-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        <Link
          href="/shop"
          className="text-sm font-semibold text-brand-secondary underline-offset-4 hover:underline"
        >
          Shop now
        </Link>
      </div>
    </div>
  );
}
