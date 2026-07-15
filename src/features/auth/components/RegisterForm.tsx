'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AppError } from '@/shared/contracts/errors';
import { useRegister } from '../hooks/useAuth';
import { registerSchema, type RegisterValues } from '../schema/auth.schema';
import { SocialAuthButtons } from './SocialAuthButtons';

const inputCls =
  'h-11 w-full rounded-(--radius) border border-border bg-surface-raised px-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20';

export function RegisterForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="mx-auto w-full max-w-2xl px-4 lg:px-0">
      <div className="flex flex-col gap-5 rounded-(--radius-lg) border border-border bg-surface-raised px-5 py-6 shadow-sm md:px-8">
        <h1 className="w-full border-b border-border pb-5 text-center font-(family-name:--font-display) text-2xl font-semibold text-text-primary">
          Create Account
        </h1>

        {formError && (
          <div className="rounded-(--radius) border border-status-error/30 bg-status-error/10 p-3 text-center text-sm text-status-error">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-name"
              className="text-sm font-medium text-text-secondary"
            >
              Full Name <span className="ms-0.5 text-text-muted">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              aria-invalid={!!errors.name}
              className={inputCls}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-status-error">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-email"
              className="text-sm font-medium text-text-secondary"
            >
              Email <span className="ms-0.5 text-text-muted">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={inputCls}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-status-error">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reg-password"
              className="text-sm font-medium text-text-secondary"
            >
              Password <span className="ms-0.5 text-text-muted">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className={`${inputCls} pe-11`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-status-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            aria-label="Create account"
            className="w-full rounded-(--radius) bg-brand-primary px-6 py-2.5 text-base font-semibold text-text-inverse transition-all duration-300 hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="border-b border-border-strong pb-0.5 font-medium text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              Sign In
            </Link>
          </p>
        </form>

        <SocialAuthButtons />
      </div>
    </div>
  );
}
