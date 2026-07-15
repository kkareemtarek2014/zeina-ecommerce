import Link from 'next/link';

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookies', label: 'Cookie Policy' },
];

export interface FooterBottomProps {
  siteName: string;
}

export function FooterBottom({ siteName }: FooterBottomProps) {
  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-center text-xs text-text-muted sm:mt-14 sm:pt-8 sm:text-sm md:flex-row md:text-left">
      <p>
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </p>
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-end">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="transition-colors hover:text-brand-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
