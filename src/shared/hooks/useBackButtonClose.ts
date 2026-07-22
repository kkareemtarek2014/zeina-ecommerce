'use client';

import { useEffect, useRef } from 'react';

let seq = 0;

/**
 * Set (module-global) by a link *inside* an overlay, synchronously, right
 * before that link closes the overlay. See `markOverlayNavigation` below.
 */
let pendingOverlayNav = false;

/**
 * Call this the instant a link inside an overlay is activated — before the
 * overlay's close handler runs. It tells the next `useBackButtonClose` close
 * NOT to `history.back()`.
 *
 * Why it's needed: the App Router pushes its own history entry *asynchronously*,
 * after the RSC payload arrives — not synchronously on click. So when our close
 * effect runs (synchronously, right after the click) `history.state` is still
 * our overlay marker; we can't tell "user navigated" from "user closed in
 * place" by inspecting history. If we called `history.back()` there it would
 * race/cancel the pending forward navigation and the link would appear to do
 * nothing. This flag lets a navigating link opt the close out of the pop.
 */
export function markOverlayNavigation(): void {
  pendingOverlayNav = true;
}

/** True when `history.state` is still the marker *this* overlay pushed. */
function isOwnState(marker: string): boolean {
  const state = window.history.state as { __overlay?: string } | null;
  return state?.__overlay === marker;
}

/**
 * On open, pushes a history entry so Android back / iOS swipe-back closes the
 * overlay instead of leaving the page. The pushed entry is popped in exactly
 * one place — the effect cleanup — and only for a genuine "close in place"
 * action (X / backdrop / Esc). It is intentionally NOT popped when:
 *   - the browser already went back (popstate closed us), or
 *   - a link inside the overlay is navigating forward
 *     (`markOverlayNavigation()` was called).
 */
export function useBackButtonClose(
  isOpen: boolean,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  const closingViaBackRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Fresh overlay — clear any stale flag from a prior instance.
    pendingOverlayNav = false;
    closingViaBackRef.current = false;

    const marker = `sqoosh-overlay-${(seq += 1)}`;
    window.history.pushState({ __overlay: marker }, '');

    const onPopState = () => {
      closingViaBackRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);

      const navigating = pendingOverlayNav;
      pendingOverlayNav = false;

      // Only remove our own entry for a plain close — not a back-press, not a
      // forward navigation — and only while it's still on top of the stack.
      if (!navigating && !closingViaBackRef.current && isOwnState(marker)) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
