import type { Metadata } from 'next';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { getSiteBranding } from '@/server/services/settings.service';
import { normalizeWhatsAppDigits } from '@/shared/lib/contact-links';

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSiteBranding();
  const title = `Contact Us | ${branding.siteName} Customer Support`;
  const description = `Need help with your ${branding.siteName} order? Get in touch with our support team for inquiries about our accessories, shipping, and returns in Egypt.`;

  return {
    title,
    description,
    alternates: { canonical: '/contact' },
    openGraph: {
      title,
      description,
      url: `${branding.siteUrl.replace(/\/$/, '')}/contact`,
      type: 'website',
    },
  };
}

export default async function ContactPage() {
  const branding = await getSiteBranding();
  const email = branding.contactEmail;
  const phone = branding.contactPhone;
  const whatsappDigits = normalizeWhatsAppDigits(branding.whatsappNumber);

  const methods = [
    email
      ? {
          key: 'email',
          icon: Mail,
          title: 'Email Us',
          description: 'Our friendly team is here to help.',
          href: `mailto:${email}`,
          label: email,
        }
      : null,
    phone
      ? {
          key: 'phone',
          icon: Phone,
          title: 'Call Us',
          description: 'Speak with us about your order.',
          href: `tel:${phone.replace(/[^\d+]/g, '')}`,
          label: phone,
        }
      : null,
    whatsappDigits
      ? {
          key: 'whatsapp',
          icon: MessageCircle,
          title: 'WhatsApp',
          description: 'Chat with us for quick inquiries.',
          href: `https://wa.me/${whatsappDigits}`,
          label: branding.whatsappNumber!,
        }
      : null,
  ].filter((m): m is NonNullable<typeof m> => m != null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center animate-fade-up">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand-accent">
          Support
        </p>
        <h1 className="mt-2 font-(family-name:--font-display) text-4xl font-semibold text-text-primary sm:text-5xl">
          Contact Us
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
          We’d love to hear from you. Whether you have a question about our
          collections, need help with your order, or just want to say hi.
        </p>
      </div>

      {methods.length > 0 ? (
        <div
          className="mt-16 grid gap-8 animate-fade-up sm:grid-cols-2"
          style={{ animationDelay: '100ms' }}
        >
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.key}
                className="flex flex-col items-center rounded-(--radius-lg) border border-border bg-surface-raised p-8 text-center transition-shadow hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-text-primary">
                  {method.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {method.description}
                </p>
                <a
                  href={method.href}
                  className="mt-4 font-medium text-brand-primary hover:underline"
                  {...(method.key === 'whatsapp'
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {method.label}
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <p
          className="mt-16 text-center text-sm text-text-secondary animate-fade-up"
          style={{ animationDelay: '100ms' }}
        >
          Contact details are being updated. Please check back soon.
        </p>
      )}

      <div
        className="mt-12 animate-fade-up rounded-(--radius-lg) border border-border bg-surface-raised p-8"
        style={{ animationDelay: '200ms' }}
      >
        <h2 className="mb-4 border-b border-border pb-4 text-xl font-medium text-text-primary">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-text-primary">
              What are your delivery times?
            </h4>
            <p className="mt-1 text-sm text-text-secondary">
              We typically deliver within 2-4 business days across all
              governorates in Egypt.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-text-primary">
              Do you accept returns?
            </h4>
            <p className="mt-1 text-sm text-text-secondary">
              Yes, we accept returns within 14 days of delivery provided the
              items are unworn and in their original packaging.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-text-primary">
              What payment methods do you accept?
            </h4>
            <p className="mt-1 text-sm text-text-secondary">
              Currently, we accept Cash on Delivery (COD) for all orders within
              Egypt to ensure a secure and hassle-free shopping experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
