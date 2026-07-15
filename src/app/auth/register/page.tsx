import { Metadata } from 'next';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Register a new Zaya account.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
