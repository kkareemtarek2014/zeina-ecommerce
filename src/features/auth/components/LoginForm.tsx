'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AppError } from '@/shared/contracts/errors';
import { useLogin } from '../hooks/useAuth';
import { loginSchema, type LoginValues } from '../schema/auth.schema';
import { AuthIllustration } from './AuthIllustration';
import { SocialAuthButtons } from './SocialAuthButtons';

const inputCls =
  'h-11 w-full rounded-(--radius) border border-border bg-surface-raised px-4 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20';

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="mx-auto w-full max-w-4xl px-4 lg:px-0">
      <div className="grid gap-6 lg:grid-cols-2 ">
  

        {/* Login card */}
        <div className="order-1 lg:order-1">
          <div className="flex h-full flex-col items-center gap-5 rounded-lg border border-border bg-surface-raised px-5 py-6 shadow-sm md:px-8">
            <h1 className="w-full border-b border-border pb-5 text-center font-display text-2xl font-semibold text-text-primary">
              Welcome Back
            </h1>

            {formError && (
              <div className="w-full rounded-(--radius) border border-status-error/30 bg-status-error/10 p-3 text-center text-sm text-status-error">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex w-full flex-1 flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email-login"
                  className="text-sm font-medium text-text-secondary"
                >
                  Email <span className="ms-0.5 text-text-muted">*</span>
                </label>
                <input
                  id="email-login"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={inputCls}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-status-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password-login"
                  className="text-sm font-medium text-text-secondary"
                >
                  Password <span className="ms-0.5 text-text-muted">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    className={`${inputCls} pe-11`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-status-error">
                    {errors.password.message}
                  </p>
                )}
                <div className="flex w-full justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-text-muted underline-offset-4 transition-colors hover:text-brand-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                aria-label="Sign in"
                className="mt-auto w-full rounded-(--radius) bg-brand-primary px-6 py-2.5 text-base font-semibold text-text-inverse transition-all duration-300 hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <SocialAuthButtons />
          </div>
        </div>
              {/* Register promo panel */}
        <div className="order-2 rounded-lg border border-border bg-brand-blush/40 p-6 lg:order-2">
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <h2 className="w-full border-b border-border pb-4 font-display text-2xl font-semibold text-text-primary">
              New to Zaya?
            </h2>
            <div className="flex flex-col items-center gap-5 pt-2 lg:pb-4">
              <AuthIllustration />
              <p className="text-sm leading-relaxed text-text-secondary lg:px-6">
                Create an account to save your favourites, track orders, and
                check out faster next time.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="mt-auto flex w-full items-center justify-center rounded-(--radius) border-2 border-brand-primary px-6 py-2.5 text-base font-semibold text-brand-primary transition-colors duration-300 hover:bg-brand-primary hover:text-text-inverse"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
