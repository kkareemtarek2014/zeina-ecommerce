import { CATEGORIES } from '@/shared/data/categories.data';
import type { SiteBrandingDTO } from '@/shared/contracts/storefront-branding.contract';
import { SocialLinks } from './footer/SocialLinks';
import { NewsletterForm } from './footer/NewsletterForm';
import { FooterLinkGroup } from './footer/FooterLinkGroup';
import { FooterBottom } from './footer/FooterBottom';

const HELP_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/account', label: 'My Account' },
  { href: '/account/orders', label: 'Track My Order' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
];

interface FooterProps {
  branding: SiteBrandingDTO;
}

export function Footer({ branding }: FooterProps) {
  const description = branding.footerText ?? branding.siteTagline;

  const shopLinks = CATEGORIES.map((cat) => ({
    href: `/shop/${cat.slug}`,
    label: cat.name,
  }));

  return (
    <footer className="mt-12 border-t border-border bg-white pt-10 pb-8 sm:mt-20 sm:pt-16">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Brand & Newsletter Section */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div>
              <p className="font-display text-3xl font-bold tracking-tight text-brand-primary italic sm:text-4xl">
                {branding.siteName}
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary sm:mt-4 sm:text-base">
                {description}
              </p>
              <SocialLinks
                instagramUrl={branding.socialInstagram}
                facebookUrl={branding.socialFacebook}
                tiktokUrl={branding.socialTiktok}
              />
            </div>

            <NewsletterForm />
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-7 lg:gap-12">
            <div className="lg:col-span-3">
              <FooterLinkGroup title="Shop" links={shopLinks} />
            </div>

            <div className="lg:col-span-4">
              <FooterLinkGroup title="Help" links={HELP_LINKS} />
            </div>
          </div>
        </div>

        {/* Footer Bottom / Copyright */}
        <FooterBottom siteName={branding.siteName} />
      </div>
    </footer>
  );
}
