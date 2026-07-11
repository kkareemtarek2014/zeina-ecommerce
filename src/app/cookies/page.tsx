import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How Zaya uses cookies and local storage in your browser.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-(family-name:--font-display) text-3xl font-bold text-brand-primary sm:text-4xl">
        Cookie Policy
      </h1>
      <div className="mt-8 space-y-6 text-text-secondary">
        <p>
          This Cookie Policy explains what cookies are and how we use them. You should read this policy to understand what cookies are, how we use them, the types of cookies we use i.e, the information we collect using cookies and how that information is used and how to control the cookie preferences.
        </p>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">1. What are cookies?</h2>
          <p className="mt-2">
            Cookies are small text files that are used to store small pieces of information. The cookies are stored on your device when the website is loaded on your browser. These cookies help us make the website function properly, make the website more secure, provide better user experience, and understand how the website performs and to analyze what works and where it needs improvement.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text-primary">2. How do we use cookies?</h2>
          <p className="mt-2">
            As most of the online services, our website uses cookies first-party and third-party cookies for a number of purposes. The first-party cookies are mostly necessary for the website to function the right way, and they do not collect any of your personally identifiable data.
          </p>
        </section>
      </div>
    </div>
  );
}
