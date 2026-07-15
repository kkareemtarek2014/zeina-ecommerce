'use client';

import { useState } from 'react';
import { Check, Copy, Gift, Share2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';

export const REFERRAL_PROMO_CODE = 'ZAYFRIEND10';

const SHARE_TEXT = `Check out Zaya! Use code ${REFERRAL_PROMO_CODE} for 10% off 💕`;

/**
 * Post-purchase reciprocity card — fixed shared referral code (promo engine).
 */
export function ReferralCard() {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const waShare = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`;

  return (
    <section className="animate-fade-up mt-6 rounded-lg border border-brand-accent/30 bg-brand-blush/50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/20 text-brand-accent">
          <Gift className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Love your Zaya order? Share the love.
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Give your friends 10% off — use code{' '}
            <span className="font-semibold tracking-wide text-brand-accent">
              {REFERRAL_PROMO_CODE}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void copyCode()}
              aria-label={copied ? 'Code copied' : 'Copy referral code'}
            >
              {copied ? (
                <>
                  <Check className="size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copy code
                </>
              )}
            </Button>
            <a href={waShare} target="_blank" rel="noopener noreferrer">
              <Button type="button" size="sm" variant="secondary">
                <Share2 className="size-4" /> Share on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
