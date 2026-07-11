import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Terms and conditions for shopping at Zaya — orders, delivery and payment across Egypt.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-(family-name:--font-display) text-3xl font-bold text-brand-primary sm:text-4xl">
        Terms and Conditions
      </h1>
      <div className="mt-8 space-y-6 text-text-secondary">
        <p>
          Welcome to our website. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use.
        </p>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">2. Use License</h2>
          <p className="mt-2">
            Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">3. Disclaimer</h2>
          <p className="mt-2">
            The materials on our website are provided on an “as is” basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>
      </div>
    </div>
  );
}
