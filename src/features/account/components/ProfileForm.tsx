'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { FormSkeleton, Button, Input } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { useProfile, useUpdateProfile } from '../hooks/useAccount';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'Enter a valid Egyptian mobile'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
    },
  });

  if (isLoading || !profile) {
    return <FormSkeleton fields={3} />;
  }

  const onSubmit = async (values: ProfileFormValues) => {
    setFormError(null);
    setSaved(false);
    try {
      await updateMutation.mutateAsync({
        fullName: values.fullName,
        phone: values.phone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save profile',
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-4"
      noValidate
    >
      {formError && <p className="text-sm text-status-error">{formError}</p>}
      <Input
        label="Full name"
        placeholder="Mariam Ahmed"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Mobile number"
        placeholder="01012345678"
        inputMode="numeric"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Input
        label="Email"
        type="email"
        value={profile.email}
        disabled
        readOnly
        autoComplete="email"
      />
      <p className="text-xs text-text-muted -mt-2">
        Email cannot be changed here.
      </p>
      <Button type="submit" isLoading={updateMutation.isPending}>
        {saved ? (
          <>
            <Check className="size-4" /> Saved
          </>
        ) : (
          'Save changes'
        )}
      </Button>
    </form>
  );
}
