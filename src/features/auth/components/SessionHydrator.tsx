'use client';

import { useSession } from '../hooks/useAuth';

/** Mount once under Providers to hydrate auth from the session cookie. */
export function SessionHydrator() {
  useSession();
  return null;
}
