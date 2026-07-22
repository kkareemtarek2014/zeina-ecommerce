import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Sqoosh account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 lg:px-0">
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface-raised px-5 py-6 shadow-sm md:px-8">
        <h1 className="w-full border-b border-border pb-5 text-center font-(family-name:--font-display) text-2xl font-semibold text-text-primary">
          Reset Password
        </h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
