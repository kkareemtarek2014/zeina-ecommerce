'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { AnnouncementItem } from '@/shared/contracts/storefront-branding.contract';

const ROTATE_MS = 4500;

interface AnnouncementBarProps {
  items: AnnouncementItem[];
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function AnnouncementBar({ items }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (items.length < 2 || paused || reducedMotion) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [items.length, paused, reducedMotion]);

  if (items.length === 0) return null;

  const current = items[reducedMotion ? 0 : index] ?? items[0];
  if (!current) return null;

  const content = (
    <span className="block px-4 py-2 text-center text-xs font-medium tracking-wide whitespace-nowrap">
      {current.text}
    </span>
  );

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  return (
    <div
      className="bg-brand-primary text-text-inverse"
      role="region"
      aria-label="Announcements"
      aria-live="polite"
      {...pauseHandlers}
    >
      <div className="mx-auto max-w-container lg:px-4">
        {current.href ? (
          current.href.startsWith('/') ? (
            <Link
              href={current.href}
              className="block transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-inverse"
            >
              {content}
            </Link>
          ) : (
            <a
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-inverse"
            >
              {content}
            </a>
          )
        ) : (
          content
        )}
      </div>
    </div>
  );
}
