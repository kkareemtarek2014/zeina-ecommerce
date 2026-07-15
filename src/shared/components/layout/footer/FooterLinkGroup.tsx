import Link from 'next/link';

export interface FooterLinkItem {
  href: string;
  label: string;
}

export interface FooterLinkGroupProps {
  title: string;
  links: FooterLinkItem[];
}

export function FooterLinkGroup({ title, links }: FooterLinkGroupProps) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-primary sm:mb-4 sm:text-sm">
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5 sm:gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-xs text-text-secondary transition-colors hover:text-brand-primary sm:text-sm"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
