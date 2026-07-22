/**
 * First-order welcome offer — promoted on Instagram/TikTok.
 * The code must exist (and be active) in the D1 `promos` table:
 * seeded from `src/shared/data/promos.data.ts`, editable at /admin/promos.
 */
export const WELCOME_OFFER = {
  code: 'FIRST20',
  percent: 20,
  /** Delay before the popup appears on a first visit (ms). */
  delayMs: 4000,
  /**
   * localStorage key marking the popup as dismissed.
   * UI preference only (allowed) — bump the suffix to re-show for a new campaign.
   */
  storageKey: 'sqoosh-welcome-offer-v1',
  /** Never interrupt these flows. */
  excludedPathPrefixes: ['/admin', '/checkout', '/order', '/auth'],
} as const;
