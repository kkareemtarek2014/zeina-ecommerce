import { Metadata } from 'next';
import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { SITE } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Contact Us | Zaya Customer Support`,
  description:
    'Need help with your Zaya order? Get in touch with our support team for inquiries about our accessories, shipping, and returns in Egypt.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: `Contact Us | Zaya Customer Support`,
    description:
      'Need help with your Zaya order? Get in touch with our support team for inquiries about our accessories, shipping, and returns in Egypt.',
    url: `${SITE.url}/contact`,
    type: 'website',
  },
};

export default function ContactPage() {
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
          We’d love to hear from you. Whether you have a question about our collections, need help with your order, or just want to say hi.
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
        {/* Contact Method 1 */}
        <div className="flex flex-col items-center p-8 text-center rounded-(--radius-lg) border border-border bg-surface-raised transition-shadow hover:shadow-md">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
            <Mail className="size-6" />
          </div>
          <h3 className="mt-4 font-medium text-text-primary text-lg">Email Us</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Our friendly team is here to help.
          </p>
          <a href="mailto:support@Zaya.com" className="mt-4 font-medium text-brand-primary hover:underline">
            support@Zaya.com
          </a>
        </div>

        {/* Contact Method 2 */}
        <div className="flex flex-col items-center p-8 text-center rounded-(--radius-lg) border border-border bg-surface-raised transition-shadow hover:shadow-md">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
            <MessageCircle className="size-6" />
          </div>
          <h3 className="mt-4 font-medium text-text-primary text-lg">WhatsApp</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Chat with us for quick inquiries.
          </p>
          <a href="tel:+201234567890" className="mt-4 font-medium text-brand-primary hover:underline">
            +20 123 456 7890
          </a>
        </div>
      </div>

      <div className="mt-12 rounded-(--radius-lg) bg-surface-raised p-8 animate-fade-up border border-border" style={{ animationDelay: '200ms' }}>
        <h2 className="text-xl font-medium text-text-primary mb-4 border-b border-border pb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-text-primary">What are your delivery times?</h4>
            <p className="mt-1 text-sm text-text-secondary">
              We typically deliver within 2-4 business days across all governorates in Egypt.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-text-primary">Do you accept returns?</h4>
            <p className="mt-1 text-sm text-text-secondary">
              Yes, we accept returns within 14 days of delivery provided the items are unworn and in their original packaging.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-text-primary">What payment methods do you accept?</h4>
            <p className="mt-1 text-sm text-text-secondary">
              Currently, we accept Cash on Delivery (COD) for all orders within Egypt to ensure a secure and hassle-free shopping experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
