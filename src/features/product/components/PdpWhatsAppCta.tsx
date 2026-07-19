'use client';

import { MessageCircle } from 'lucide-react';
import { useStorefrontConfig } from '@/features/admin';
import { normalizeWhatsAppDigits } from '@/shared/lib/contact-links';

/** Categories where purchase uncertainty is higher — show WhatsApp help. */
const CONCIERGE_CATEGORIES = new Set(['large']);

interface PdpWhatsAppCtaProps {
  productName: string;
  category: string;
}

/**
 * Inline (not FAB) WhatsApp deep-link for PDPs with higher decision friction.
 * Pre-fills product name to reduce decision fatigue.
 */
export function PdpWhatsAppCta({ productName, category }: PdpWhatsAppCtaProps) {
  const { data: config } = useStorefrontConfig();
  const digits = normalizeWhatsAppDigits(config?.whatsappNumber ?? null);

  if (!digits || !CONCIERGE_CATEGORIES.has(category)) return null;

  const message = `Hi! I'm interested in ${productName} — can you help me choose?`;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-3 rounded-(--radius) border border-border bg-brand-blush/50 px-4 py-3 text-sm text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text-primary"
    >
      <MessageCircle className="size-5 shrink-0 text-brand-primary" aria-hidden />
      <span>
        <span className="font-medium text-text-primary">Not sure? Ask our styling team</span>
        <span className="mt-0.5 block text-xs text-text-muted">
          Chat on WhatsApp about this piece
        </span>
      </span>
    </a>
  );
}
