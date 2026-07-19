import { Metadata } from 'next';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Log in to your Sqoosh account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
