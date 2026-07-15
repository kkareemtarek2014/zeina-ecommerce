'use client';

import { Mail, ArrowRight } from 'lucide-react';

export function NewsletterForm() {
  return (
    <div className="mt-1 sm:mt-2">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary sm:mb-4 sm:text-sm">
        Subscribe to our newsletter
      </h3>
      <form
        className="relative flex w-full max-w-md items-center"
        onSubmit={(e) => e.preventDefault()}
      >
        <Mail className="absolute left-3.5 h-4 w-4 text-text-muted sm:h-5 sm:w-5" />
        <input
          type="email"
          placeholder="Enter your email"
          aria-label="Email address"
          className="w-full rounded-full border border-border bg-brand-blush/20 py-2.5 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-text-muted focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary sm:py-3 sm:pl-12 sm:pr-14"
        />
        <button
          type="submit"
          className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105 sm:right-2 sm:h-8 sm:w-8"
          aria-label="Subscribe"
        >
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </form>
    </div>
  );
}
