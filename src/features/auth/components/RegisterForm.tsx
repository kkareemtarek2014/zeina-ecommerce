'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { useRegister } from '../hooks/useAuth';
import { registerSchema, type RegisterValues } from '../schema/auth.schema';

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      await registerMutation.mutateAsync(values);
      router.push('/account');
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Registration failed',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {formError && <p className="text-sm text-status-error">{formError}</p>}
      <Input
        label="Full Name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button
        type="submit"
        isLoading={registerMutation.isPending}
        className="mt-2 w-full"
      >
        Create Account
      </Button>
      <p className="mt-4 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-text-primary underline-offset-4 hover:text-brand-accent hover:underline"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
