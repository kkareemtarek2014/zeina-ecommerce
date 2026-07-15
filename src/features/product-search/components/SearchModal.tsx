'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Clock3, SearchX, Search as SearchIcon, X } from 'lucide-react';
import { formatEGP } from '@/shared/utils/price';
import { SearchResultsSkeleton } from '@/shared/components/ui';
import { useEscapeKey } from '@/shared/hooks/useEscapeKey';
import { useScrollLock } from '@/shared/hooks/useScrollLock';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { useRecentSearches, useSearch } from '../hooks/useSearch';

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { value, setValue, results, isLoading } = useSearch();
  const recent = useRecentSearches((s) => s.recent);
  const saveRecent = useRecentSearches((s) => s.save);
  const clearRecent = useRecentSearches((s) => s.clear);

  useEscapeKey(true, onClose);
  useScrollLock(true);
  useFocusTrap(panelRef, true);

  if (typeof document === 'undefined') return null;

  const handleResultClick = () => {
    if (value.trim()) saveRecent(value.trim());
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <div
        className="absolute inset-0 bg-surface-overlay/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative flex justify-center px-4 pt-20">
        <div
          ref={panelRef}
          className="animate-fade-up w-full max-w-xl overflow-hidden rounded-(--radius-lg) bg-surface-raised shadow-2xl"
        >
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <SearchIcon className="size-5 shrink-0 text-text-muted" />
            <input
              type="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search jewelry, bags, bridal…"
              aria-label="Search products"
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-blush hover:text-brand-primary"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto p-3">
            {value.trim().length === 0 && recent.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Recent searches
                  </p>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-xs text-text-muted underline-offset-2 hover:text-brand-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setValue(term)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary"
                    >
                      <Clock3 className="size-3" /> {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {value.trim().length === 0 && recent.length === 0 && (
              <p className="p-6 text-center text-sm text-text-muted">
                Type to search all products…
              </p>
            )}

            {value.trim().length > 0 && isLoading && <SearchResultsSkeleton />}

            {value.trim().length > 0 && !isLoading && results.length > 0 && (
              <ul>
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.id}`}
                      onClick={handleResultClick}
                      className="flex items-center gap-3 rounded-(--radius) p-2 transition-colors hover:bg-brand-blush/60"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-(--radius) bg-brand-blush">
                        <Image
                          src={product.images[0] ?? ''}
                          alt=""
                          width={96}
                          height={96}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="text-xs capitalize text-text-muted">
                          {product.category}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-brand-primary">
                        {formatEGP(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {value.trim().length > 0 && !isLoading && results.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <SearchX className="size-8 text-border-strong" />
                <p className="text-sm text-text-secondary">
                  No results for “{value}”
                </p>
                <p className="text-xs text-text-muted">
                  Try “necklace”, “bag”, or “bride”
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
