import React from 'react';

type AuthIllustrationProps = React.SVGProps<SVGSVGElement>;

/**
 * Zaya-themed auth illustration — a delicate jewelry / accessories motif
 * (necklace + pendant + gift) rendered in the brand rose/gold/blush palette.
 * Colours are pulled from the design tokens so it re-themes automatically.
 */
export function AuthIllustration(props: AuthIllustrationProps) {
  return (
    <svg
      width="200"
      height="165"
      viewBox="0 0 200 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* soft blush halo */}
      <circle cx="100" cy="70" r="58" fill="var(--color-brand-blush)" />

      {/* jewelry box lid + base */}
      <rect x="46" y="96" width="108" height="46" rx="10" fill="var(--color-surface-raised)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <rect x="46" y="96" width="108" height="16" rx="8" fill="var(--color-brand-blush)" stroke="var(--color-border-strong)" strokeWidth="1.5" />
      <rect x="92" y="100" width="16" height="8" rx="2" fill="var(--color-brand-accent)" />
      <path d="M60 122h80" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M60 131h56" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />

      {/* necklace chain */}
      <path
        d="M64 40 C64 78 84 92 100 92 C116 92 136 78 136 40"
        stroke="var(--color-brand-accent)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* chain clasps */}
      <circle cx="64" cy="40" r="4.5" fill="var(--color-surface-raised)" stroke="var(--color-brand-accent)" strokeWidth="2" />
      <circle cx="136" cy="40" r="4.5" fill="var(--color-surface-raised)" stroke="var(--color-brand-accent)" strokeWidth="2" />

      {/* pendant gem */}
      <path
        d="M100 78 L90 90 L100 106 L110 90 Z"
        fill="var(--color-brand-primary)"
        stroke="var(--color-brand-secondary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M90 90 H110" stroke="var(--color-brand-blush)" strokeWidth="1.2" opacity="0.7" />
      <path d="M100 78 L100 106" stroke="var(--color-brand-blush)" strokeWidth="1" opacity="0.5" />

      {/* sparkles */}
      <path d="M150 44 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="var(--color-brand-accent)" />
      <path d="M46 58 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z" fill="var(--color-brand-primary)" opacity="0.8" />
      <circle cx="158" cy="70" r="2" fill="var(--color-brand-primary)" opacity="0.6" />
      <circle cx="40" cy="86" r="2" fill="var(--color-brand-accent)" />
    </svg>
  );
}
