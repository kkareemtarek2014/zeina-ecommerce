import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Zaya collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-(family-name:--font-display) text-3xl font-bold text-brand-primary sm:text-4xl">
        Privacy Policy
      </h1>
      <div className="mt-8 space-y-6 text-text-secondary">
        <p>
          This privacy policy sets out how we use and protect any information that you give us when you use this website.
        </p>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">1. What we collect</h2>
          <p className="mt-2">
            We may collect the following information: name, contact information including email address, demographic information such as postcode, preferences and interests, and other information relevant to customer surveys and/or offers.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">2. What we do with the information we gather</h2>
          <p className="mt-2">
            We require this information to understand your needs and provide you with a better service, and in particular for the following reasons: Internal record keeping, we may use the information to improve our products and services.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">3. Security</h2>
          <p className="mt-2">
            We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure, we have put in place suitable physical, electronic and managerial procedures to safeguard and secure the information we collect online.
          </p>
        </section>
      </div>
    </div>
  );
}
