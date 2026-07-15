'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { AccountListSkeleton, Button, Input, Select } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { GOVERNORATES, getGovernorate } from '@/shared/data/governorates.data';
import {
  useAddresses,
  useAddAddress,
  useRemoveAddress,
} from '../hooks/useAccount';

const addressSchema = z.object({
  label: z.string().trim().min(2, 'e.g. Home, Work'),
  governorate: z
    .string()
    .refine(
      (v) => GOVERNORATES.some((g) => g.id === v),
      'Please select a governorate',
    ),
  city: z.string().trim().min(2, 'Please enter your city / area'),
  street: z.string().trim().min(5, 'Street, building and apartment'),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function AddressBook() {
  const { data: addresses = [], isLoading } = useAddresses();
  const addMutation = useAddAddress();
  const removeMutation = useRemoveAddress();
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { governorate: '' },
  });

  const onSubmit = async (values: AddressFormValues) => {
    setFormError(null);
    try {
      await addMutation.mutateAsync(values);
      reset({ label: '', governorate: '', city: '', street: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof AppError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save address',
      );
    }
  };

  if (isLoading) {
    return <AccountListSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6">
      {addresses.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <MapPin className="size-12 text-border-strong" />
          <p className="text-sm text-text-secondary">
            No saved addresses yet.
          </p>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"
            >
              <div className="text-sm">
                <p className="font-semibold">{address.label}</p>
                <p className="mt-1 text-text-secondary">
                  {address.street}, {address.city},{' '}
                  {getGovernorate(address.governorate)?.name ??
                    address.governorate}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete address ${address.label}`}
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(address.id)}
                className="text-text-muted transition-colors hover:text-status-error disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-md space-y-4 rounded-lg border border-border bg-surface-raised p-5"
          noValidate
        >
          {formError && (
            <p className="text-sm text-status-error">{formError}</p>
          )}
          <Input
            label="Label"
            placeholder="Home"
            error={errors.label?.message}
            {...register('label')}
          />
          <Select
            label="Governorate"
            error={errors.governorate?.message}
            {...register('governorate')}
          >
            <option value="" disabled>
              Select governorate…
            </option>
            {GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Input
            label="City / Area"
            placeholder="Maadi"
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            label="Street address"
            placeholder="Street, building, floor, apartment"
            error={errors.street?.message}
            {...register('street')}
          />
          <div className="flex gap-2">
            <Button type="submit" isLoading={addMutation.isPending}>
              Save address
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Add address
        </Button>
      )}
    </div>
  );
}
