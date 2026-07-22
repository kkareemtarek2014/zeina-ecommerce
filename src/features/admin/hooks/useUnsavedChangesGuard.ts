'use client';

import { useEffect } from 'react';

/**
 * Custom hook to alert users before leaving a page when there are unsaved form changes.
 *
 * Note: Next.js App Router does not support synchronous route interception via router hooks.
 * This hook attaches a window `beforeunload` listener for browser refreshes, tab closures,
 * and external navigation when `isDirty` is true.
 *
 * @param isDirty - Boolean flag indicating if the form currently has uncommitted changes.
 * @param message - Optional custom message shown by supporting legacy browsers.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  message = 'You have unsaved changes. Are you sure you want to leave?'
) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
}
