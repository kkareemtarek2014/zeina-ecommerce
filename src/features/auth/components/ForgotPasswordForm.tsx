'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { useForgotPassword } from '../hooks/useAuth';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '../schema/auth.schema';

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const forgotMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null);
    try {
      await forgotMutation.mutateAsync(values);
      setSentTo(values.email);
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to send reset link',
      );
    }
  };

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-text-secondary">
          We have sent a password reset link to{' '}
          <span className="font-medium text-text-primary">{sentTo}</span>.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="mt-4 w-full">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {formError && <p className="text-sm text-status-error">{formError}</p>}
      <p className="mb-2 text-sm text-text-secondary">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button
        type="submit"
        isLoading={forgotMutation.isPending}
        className="mt-2 w-full"
      >
        Send Reset Link
      </Button>
      <p className="mt-4 text-center text-sm text-text-muted">
        Remember your password?{' '}
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
