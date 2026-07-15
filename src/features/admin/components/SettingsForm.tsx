'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/shared/components/ui';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import { MediaPicker } from './MediaPicker';

const formSchema = z.object({
  profitMargin: z.coerce
    .number()
    .min(0.2, 'Minimum 20%')
    .max(0.3, 'Maximum 30%'),
  freeShippingThreshold: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  usdEgpRate: z.coerce.number().positive(),
  bulkShippingUsd: z.coerce.number().min(0),
  customsDutyRate: z.coerce.number().min(0).max(1),
  vatRate: z.coerce.number().min(0).max(1),
  handlingFeeEgp: z.coerce.number().int().min(0),
  targetMargin: z.coerce.number().min(0).max(2),
  priceRoundingEgp: z.coerce.number().int().min(1).max(100),
  siteName: z.string().trim().min(1),
  siteTagline: z.string().trim().min(1),
  siteUrl: z.string().trim().url('Enter a valid URL'),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  faviconUrl: z.string().trim().optional().or(z.literal('')),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  whatsappNumber: z.string().trim().optional().or(z.literal('')),
  socialInstagram: z.string().trim().optional().or(z.literal('')),
  socialFacebook: z.string().trim().optional().or(z.literal('')),
  socialTiktok: z.string().trim().optional().or(z.literal('')),
  shippingEtaLocal: z.string().trim().min(1).max(80),
  shippingEtaDropship: z.string().trim().min(1).max(80),
  instagramHandle: z.string().trim().optional().or(z.literal('')),
  instagramPostUrls: z.string().optional(),
  seoDefaultTitle: z.string().trim().optional().or(z.literal('')),
  seoDefaultDescription: z.string().trim().optional().or(z.literal('')),
  footerText: z.string().trim().optional().or(z.literal('')),
  maintenanceMode: z.boolean(),
  bridalPageEnabled: z.boolean(),
  bridalShowCollections: z.boolean(),
  bridalShowPersonalization: z.boolean(),
  bridalShowTiers: z.boolean(),
  bridalShowFinalCta: z.boolean(),
  bridalShowHomeSpotlight: z.boolean(),
  bridalCustomEnabled: z.boolean(),
  unpaidOrderTimeoutMinutes: z.coerce.number().int().min(5).max(10080),
  pendingReminderHours: z.coerce.number().int().min(1).max(720),
});

type FormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading?: boolean;
}

function emptyToNull(v: string | undefined): string | null {
  const t = v?.trim() ?? '';
  return t ? t : null;
}

export function SettingsForm({ initial, onSubmit, isLoading }: SettingsFormProps) {
  const [mediaTarget, setMediaTarget] = useState<'logo' | 'favicon' | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      profitMargin: initial.profitMargin,
      freeShippingThreshold: initial.freeShippingThreshold,
      lowStockThreshold: initial.lowStockThreshold,
      usdEgpRate: initial.usdEgpRate,
      bulkShippingUsd: initial.bulkShippingUsd,
      customsDutyRate: initial.customsDutyRate,
      vatRate: initial.vatRate,
      handlingFeeEgp: initial.handlingFeeEgp,
      targetMargin: initial.targetMargin,
      priceRoundingEgp: initial.priceRoundingEgp,
      siteName: initial.siteName,
      siteTagline: initial.siteTagline,
      siteUrl: initial.siteUrl,
      logoUrl: initial.logoUrl ?? '',
      faviconUrl: initial.faviconUrl ?? '',
      contactEmail: initial.contactEmail ?? '',
      contactPhone: initial.contactPhone ?? '',
      whatsappNumber: initial.whatsappNumber ?? '',
      socialInstagram: initial.socialInstagram ?? '',
      socialFacebook: initial.socialFacebook ?? '',
      socialTiktok: initial.socialTiktok ?? '',
      shippingEtaLocal: initial.shippingEtaLocal,
      shippingEtaDropship: initial.shippingEtaDropship,
      instagramHandle: initial.instagramHandle ?? '',
      instagramPostUrls: (initial.instagramPostUrls ?? []).join('\n'),
      seoDefaultTitle: initial.seoDefaultTitle ?? '',
      seoDefaultDescription: initial.seoDefaultDescription ?? '',
      footerText: initial.footerText ?? '',
      maintenanceMode: initial.maintenanceMode,
      bridalPageEnabled: initial.bridalPageEnabled,
      bridalShowCollections: initial.bridalShowCollections,
      bridalShowPersonalization: initial.bridalShowPersonalization,
      bridalShowTiers: initial.bridalShowTiers,
      bridalShowFinalCta: initial.bridalShowFinalCta,
      bridalShowHomeSpotlight: initial.bridalShowHomeSpotlight,
      bridalCustomEnabled: initial.bridalCustomEnabled,
      unpaidOrderTimeoutMinutes: initial.unpaidOrderTimeoutMinutes,
      pendingReminderHours: initial.pendingReminderHours,
    },
  });

  const logoUrl = watch('logoUrl');
  const faviconUrl = watch('faviconUrl');

  return (
    <>
      <form
        className="max-w-xl space-y-6"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          await onSubmit({
            ...values,
            logoUrl: emptyToNull(values.logoUrl) ?? '',
            faviconUrl: emptyToNull(values.faviconUrl) ?? '',
            contactEmail: emptyToNull(values.contactEmail) ?? '',
            contactPhone: emptyToNull(values.contactPhone) ?? '',
            whatsappNumber: emptyToNull(values.whatsappNumber) ?? '',
            socialInstagram: emptyToNull(values.socialInstagram) ?? '',
            socialFacebook: emptyToNull(values.socialFacebook) ?? '',
            socialTiktok: emptyToNull(values.socialTiktok) ?? '',
            seoDefaultTitle: emptyToNull(values.seoDefaultTitle) ?? '',
            seoDefaultDescription:
              emptyToNull(values.seoDefaultDescription) ?? '',
            footerText: emptyToNull(values.footerText) ?? '',
          });
        })}
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Pricing & inventory
          </legend>
          <Input
            label="Profit margin"
            type="number"
            step="0.01"
            min={0.2}
            max={0.3}
            error={errors.profitMargin?.message}
            {...register('profitMargin')}
          />
          <Input
            label="Free shipping threshold (EGP)"
            type="number"
            step="1"
            min={0}
            error={errors.freeShippingThreshold?.message}
            {...register('freeShippingThreshold')}
          />
          <Input
            label="Low-stock threshold"
            type="number"
            step="1"
            min={0}
            error={errors.lowStockThreshold?.message}
            {...register('lowStockThreshold')}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Landed-cost engine
          </legend>
          <p className="text-xs text-text-muted">
            Used when <code className="text-xs">dynamic_pricing</code> is ON
            and a product has a USD base. Currently{' '}
            {initial.dynamicPricingEnabled ? 'enabled' : 'disabled'} in feature
            flags. Verify rates against current regulations before go-live.
          </p>
          <Input
            label="USD → EGP rate"
            type="number"
            step="0.0001"
            min={0}
            error={errors.usdEgpRate?.message}
            {...register('usdEgpRate')}
          />
          <Input
            label="Bulk shipping (USD / item)"
            type="number"
            step="0.01"
            min={0}
            error={errors.bulkShippingUsd?.message}
            {...register('bulkShippingUsd')}
          />
          <Input
            label="Customs duty rate (e.g. 0.105)"
            type="number"
            step="0.001"
            min={0}
            max={1}
            error={errors.customsDutyRate?.message}
            {...register('customsDutyRate')}
          />
          <Input
            label="VAT rate (e.g. 0.14)"
            type="number"
            step="0.001"
            min={0}
            max={1}
            error={errors.vatRate?.message}
            {...register('vatRate')}
          />
          <Input
            label="Handling fee (EGP)"
            type="number"
            step="1"
            min={0}
            error={errors.handlingFeeEgp?.message}
            {...register('handlingFeeEgp')}
          />
          <Input
            label="Target margin on landed cost"
            type="number"
            step="0.01"
            min={0}
            max={2}
            error={errors.targetMargin?.message}
            {...register('targetMargin')}
          />
          <Input
            label="Price rounding (EGP)"
            type="number"
            step="1"
            min={1}
            error={errors.priceRoundingEgp?.message}
            {...register('priceRoundingEgp')}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Brand
          </legend>
          <Input
            label="Site name"
            error={errors.siteName?.message}
            {...register('siteName')}
          />
          <Input
            label="Site tagline"
            error={errors.siteTagline?.message}
            {...register('siteTagline')}
          />
          <Input
            label="Site URL"
            type="url"
            placeholder="https://example.com"
            error={errors.siteUrl?.message}
            {...register('siteUrl')}
          />
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1">
              <Input
                label="Logo URL"
                error={errors.logoUrl?.message}
                {...register('logoUrl')}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMediaTarget('logo')}
            >
              From library
            </Button>
          </div>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-12 w-auto rounded-(--radius) border border-border object-contain"
            />
          ) : null}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1">
              <Input
                label="Favicon URL"
                error={errors.faviconUrl?.message}
                {...register('faviconUrl')}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMediaTarget('favicon')}
            >
              From library
            </Button>
          </div>
          {faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconUrl}
              alt=""
              className="size-8 rounded-(--radius) border border-border object-contain"
            />
          ) : null}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Contact & social
          </legend>
          <Input
            label="Contact email"
            type="email"
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />
          <Input
            label="Contact phone"
            error={errors.contactPhone?.message}
            {...register('contactPhone')}
          />
          <Input
            label="WhatsApp number"
            placeholder="2010xxxxxxxx"
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
          <Input
            label="Instagram"
            placeholder="@zaya or URL"
            error={errors.socialInstagram?.message}
            {...register('socialInstagram')}
          />
          <Input
            label="Facebook"
            error={errors.socialFacebook?.message}
            {...register('socialFacebook')}
          />
          <Input
            label="TikTok"
            error={errors.socialTiktok?.message}
            {...register('socialTiktok')}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Merchandising & social proof
          </legend>
          <Input
            label="Shipping ETA — local stock"
            error={errors.shippingEtaLocal?.message}
            {...register('shippingEtaLocal')}
          />
          <Input
            label="Shipping ETA — dropship"
            error={errors.shippingEtaDropship?.message}
            {...register('shippingEtaDropship')}
          />
          <Input
            label="Instagram handle (social proof)"
            placeholder="@zaya"
            error={errors.instagramHandle?.message}
            {...register('instagramHandle')}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="ig-posts"
              className="text-sm font-medium text-text-secondary"
            >
              Instagram post URLs (one per line)
            </label>
            <textarea
              id="ig-posts"
              rows={4}
              className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
              {...register('instagramPostUrls')}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            SEO & footer
          </legend>
          <Input
            label="Default SEO title"
            error={errors.seoDefaultTitle?.message}
            {...register('seoDefaultTitle')}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="seo-desc"
              className="text-sm font-medium text-text-secondary"
            >
              Default SEO description
            </label>
            <textarea
              id="seo-desc"
              rows={3}
              className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
              {...register('seoDefaultDescription')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="footer-text"
              className="text-sm font-medium text-text-secondary"
            >
              Footer text
            </label>
            <textarea
              id="footer-text"
              rows={2}
              className="rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
              {...register('footerText')}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Automation (cron)
          </legend>
          <Input
            label="Unpaid order timeout (minutes)"
            type="number"
            step="1"
            min={5}
            error={errors.unpaidOrderTimeoutMinutes?.message}
            {...register('unpaidOrderTimeoutMinutes')}
          />
          <p className="text-xs text-text-muted">
            Auto-cancel card/wallet orders still pending past this window. COD
            is never auto-cancelled.
          </p>
          <Input
            label="Pending order reminder (hours)"
            type="number"
            step="1"
            min={1}
            error={errors.pendingReminderHours?.message}
            {...register('pendingReminderHours')}
          />
          <p className="text-xs text-text-muted">
            Daily job notifies admins when orders stay placed/confirmed longer
            than this.
          </p>
        </fieldset>

        <label className="flex items-start gap-3 rounded-(--radius-lg) border border-border bg-brand-blush/20 px-4 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-primary"
            {...register('maintenanceMode')}
          />
          <span>
            <span className="font-medium text-text-primary">
              Maintenance mode
            </span>
            <span className="mt-0.5 block text-text-secondary">
              Storefront shows a maintenance page. Admin dashboard stays
              reachable.
            </span>
          </span>
        </label>

        <fieldset className="space-y-3 rounded-(--radius-lg) border border-border bg-brand-blush/10 p-4">
          <legend className="px-1 text-sm font-semibold text-text-primary">
            Bridal page
          </legend>

          <label className="flex items-start gap-3 rounded-(--radius) border border-brand-accent/30 bg-surface-raised px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-brand-primary"
              {...register('bridalPageEnabled')}
            />
            <span>
              <span className="font-medium text-text-primary">
                Bridal landing page (master)
              </span>
              <span className="mt-0.5 block text-text-secondary">
                Show the /bride page and its links in the storefront. When
                off, visitors see a &ldquo;coming soon&rdquo; page and every
                section below is hidden too.
              </span>
            </span>
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  field: 'bridalShowCollections',
                  label: 'Collections grid',
                  hint: 'Tiaras, veils, jewelry & gift box cards',
                },
                {
                  field: 'bridalShowPersonalization',
                  label: 'Personalization section',
                  hint: 'Engraving / names / custom steps',
                },
                {
                  field: 'bridalShowTiers',
                  label: 'Price tiers',
                  hint: 'The 250–1,500+ EGP pricing cards',
                },
                {
                  field: 'bridalShowFinalCta',
                  label: 'Final CTA banner',
                  hint: 'Bottom “Let’s make it sparkle” band',
                },
                {
                  field: 'bridalShowHomeSpotlight',
                  label: 'Homepage spotlight',
                  hint: 'Bridal section on the home page',
                },
                {
                  field: 'bridalCustomEnabled',
                  label: 'Custom requests',
                  hint: '/bride/custom page + all custom CTAs',
                },
              ] as const
            ).map((item) => (
              <label
                key={item.field}
                className="flex items-start gap-3 rounded-(--radius) border border-border bg-surface-raised px-4 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-brand-primary"
                  {...register(item.field)}
                />
                <span>
                  <span className="font-medium text-text-primary">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-secondary">
                    {item.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button type="submit" isLoading={isLoading}>
          Save settings
        </Button>
      </form>

      <MediaPicker
        open={mediaTarget != null}
        onClose={() => setMediaTarget(null)}
        onSelect={(url) => {
          if (mediaTarget === 'logo') setValue('logoUrl', url);
          if (mediaTarget === 'favicon') setValue('faviconUrl', url);
        }}
      />
    </>
  );
}
