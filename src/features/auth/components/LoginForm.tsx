'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { useLogin } from '../hooks/useAuth';
import { loginSchema, type LoginValues } from '../schema/auth.schema';

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await loginMutation.mutateAsync(values);
      router.push('/account');
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Login failed',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {formError && <p className="text-sm text-status-error">{formError}</p>}
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-text-muted underline-offset-4 hover:text-brand-accent hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" isLoading={loginMutation.isPending} className="w-full">
        Sign In
      </Button>
      <p className="mt-4 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/register"
          className="font-medium text-text-primary underline-offset-4 hover:text-brand-accent hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
