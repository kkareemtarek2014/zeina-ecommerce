'use client';

import { useEffect, useId, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui';
import type { AdminSettingsDTO } from '@/shared/contracts/admin-config.contract';
import {
  AnnouncementItemsSchema,
  type AnnouncementItem,
} from '@/shared/contracts/storefront-branding.contract';
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

export type SettingsFormValues = z.infer<typeof formSchema> & {
  announcementItems: AnnouncementItem[];
};

interface SettingsFormProps {
  initial: AdminSettingsDTO;
  onSubmit: (values: SettingsFormValues) => Promise<void>;
  isLoading?: boolean;
  /** Server field errors (Zod flatten) shown after a failed save. */
  serverFieldErrors?: Record<string, string[] | undefined>;
}

function emptyToNull(v: string | undefined): string | null {
  const t = v?.trim() ?? '';
  return t ? t : null;
}

const SETTINGS_TABS = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'brand', label: 'Brand' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'contact', label: 'Contact & Social' },
  { id: 'seo', label: 'SEO & Footer' },
  { id: 'bridal', label: 'Bridal' },
  { id: 'cron', label: 'Cron Jobs' },
  { id: 'operations', label: 'Operations' },
] as const;

type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

/** Field → tab lookup so failed validation jumps to (and flags) the right tab. */
const TAB_FIELDS: Record<SettingsTabId, readonly string[]> = {
  pricing: [
    'profitMargin',
    'freeShippingThreshold',
    'lowStockThreshold',
    'usdEgpRate',
    'bulkShippingUsd',
    'customsDutyRate',
    'vatRate',
    'handlingFeeEgp',
    'targetMargin',
    'priceRoundingEgp',
  ],
  brand: ['siteName', 'siteTagline', 'siteUrl', 'logoUrl', 'faviconUrl'],
  announcements: ['announcementItems'],
  contact: [
    'contactEmail',
    'contactPhone',
    'whatsappNumber',
    'socialInstagram',
    'socialFacebook',
    'socialTiktok',
    'shippingEtaLocal',
    'shippingEtaDropship',
    'instagramHandle',
    'instagramPostUrls',
  ],
  seo: ['seoDefaultTitle', 'seoDefaultDescription', 'footerText'],
  bridal: [
    'bridalPageEnabled',
    'bridalShowCollections',
    'bridalShowPersonalization',
    'bridalShowTiers',
    'bridalShowFinalCta',
    'bridalShowHomeSpotlight',
    'bridalCustomEnabled',
  ],
  cron: ['unpaidOrderTimeoutMinutes', 'pendingReminderHours'],
  operations: ['maintenanceMode'],
};

function tabForField(field: string): SettingsTabId | null {
  for (const tab of SETTINGS_TABS) {
    if (TAB_FIELDS[tab.id].includes(field)) return tab.id;
  }
  return null;
}

function newAnnouncementId(): string {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function AnnouncementRowsEditor({
  items,
  onChange,
  error,
}: {
  items: AnnouncementItem[];
  onChange: (next: AnnouncementItem[]) => void;
  error?: string;
}) {
  const baseId = useId();

  const update = (index: number, patch: Partial<AnnouncementItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    if (!row) return;
    next.splice(target, 0, row);
    onChange(next.map((item, i) => ({ ...item, sortOrder: i })));
  };

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-muted">
          Up to 5 active. Links: internal path (`/shop`) or https URL.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...items,
              {
                id: newAnnouncementId(),
                text: '',
                active: activeCount < 5,
                sortOrder: items.length,
              },
            ])
          }
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-(--radius) border border-dashed border-border px-3 py-4 text-sm text-text-muted">
          No announcements yet. Active items rotate in the storefront header.
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="space-y-2 rounded-lg border border-border bg-surface-raised p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-primary"
                  checked={item.active}
                  onChange={(e) => update(index, { active: e.target.checked })}
                />
                Active
              </label>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  className="rounded-(--radius) p-1.5 text-text-muted hover:bg-brand-blush hover:text-text-primary disabled:opacity-40"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className="rounded-(--radius) p-1.5 text-text-muted hover:bg-brand-blush hover:text-text-primary disabled:opacity-40"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove announcement"
                  className="rounded-(--radius) p-1.5 text-status-error hover:bg-brand-blush"
                  onClick={() =>
                    onChange(
                      items
                        .filter((_, i) => i !== index)
                        .map((row, i) => ({ ...row, sortOrder: i })),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${baseId}-text-${item.id}`}
                  className="text-sm font-medium text-text-secondary"
                >
                  Text (max 80)
                </label>
                <input
                  id={`${baseId}-text-${item.id}`}
                  value={item.text}
                  maxLength={80}
                  onChange={(e) => update(index, { text: e.target.value })}
                  className="rounded-(--radius) border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${baseId}-href-${item.id}`}
                  className="text-sm font-medium text-text-secondary"
                >
                  Link (optional)
                </label>
                <input
                  id={`${baseId}-href-${item.id}`}
                  value={item.href ?? ''}
                  placeholder="/shop or https://…"
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    update(index, { href: v ? v : undefined });
                  }}
                  className="rounded-(--radius) border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-status-error">{error}</p> : null}
    </div>
  );
}

export function SettingsForm({
  initial,
  onSubmit,
  isLoading,
  serverFieldErrors,
}: SettingsFormProps) {
  const [mediaTarget, setMediaTarget] = useState<'logo' | 'favicon' | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<SettingsTabId>('pricing');
  const [announcementItems, setAnnouncementItems] = useState<AnnouncementItem[]>(
    () =>
      [...(initial.announcementItems ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
      ),
  );
  const [announcementError, setAnnouncementError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as Resolver<z.infer<typeof formSchema>>,
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

  const fieldError = (key: string) =>
    serverFieldErrors?.[key]?.[0] ?? undefined;

  // After a failed save, jump to the first tab with a server-reported error.
  useEffect(() => {
    if (!serverFieldErrors) return;
    const key = Object.keys(serverFieldErrors).find(
      (k) => serverFieldErrors[k]?.length,
    );
    const tab = key ? tabForField(key) : null;
    if (tab) setActiveTab(tab);
  }, [serverFieldErrors]);

  const errorFields = new Set<string>([
    ...Object.keys(errors),
    ...Object.keys(serverFieldErrors ?? {}).filter(
      (k) => serverFieldErrors?.[k]?.length,
    ),
  ]);
  if (announcementError) errorFields.add('announcementItems');
  const tabHasError = (tab: SettingsTabId) =>
    TAB_FIELDS[tab].some((f) => errorFields.has(f));

  return (
    <>
      <form
        className="max-w-2xl space-y-6"
        noValidate
        onSubmit={handleSubmit(
          async (values) => {
          const normalized = announcementItems.map((item, i) => ({
            ...item,
            text: item.text.trim(),
            href: item.href?.trim() || undefined,
            sortOrder: i,
          }));
          const parsed = AnnouncementItemsSchema.safeParse(normalized);
          if (!parsed.success) {
            const first =
              parsed.error.issues[0]?.message ?? 'Invalid announcements';
            setAnnouncementError(first);
            setActiveTab('announcements');
            return;
          }
          setAnnouncementError(undefined);
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
            announcementItems: parsed.data,
          });
          },
          (fieldErrors) => {
            // Client validation failed — jump to the first tab with an error.
            const first = Object.keys(fieldErrors)[0];
            const tab = first ? tabForField(first) : null;
            if (tab) setActiveTab(tab);
          },
        )}
      >
        <Tabs
          defaultValue="pricing"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SettingsTabId)}
        >
          <TabsList>
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                <span className="inline-flex items-center gap-1.5">
                  {tab.label}
                  {tabHasError(tab.id) ? (
                    <span
                      className="size-1.5 rounded-full bg-status-error"
                      aria-label="This tab has validation errors"
                    />
                  ) : null}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="pricing" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="brand" className="space-y-6">
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
            <div className="min-w-48 flex-1">
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
            <div className="min-w-48 flex-1">
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
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Announcement bar
          </legend>
          <AnnouncementRowsEditor
            items={announcementItems}
            onChange={setAnnouncementItems}
            error={announcementError ?? fieldError('announcementItems')}
          />
        </fieldset>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Contact & social
          </legend>
          <Input
            label="Contact email"
            type="email"
            error={errors.contactEmail?.message ?? fieldError('contactEmail')}
            {...register('contactEmail')}
          />
          <Input
            label="Contact phone"
            error={errors.contactPhone?.message ?? fieldError('contactPhone')}
            {...register('contactPhone')}
          />
          <Input
            label="WhatsApp number"
            placeholder="2010xxxxxxxx"
            error={
              errors.whatsappNumber?.message ?? fieldError('whatsappNumber')
            }
            {...register('whatsappNumber')}
          />
          <Input
            label="Instagram"
            placeholder="https://instagram.com/…"
            error={
              errors.socialInstagram?.message ?? fieldError('socialInstagram')
            }
            {...register('socialInstagram')}
          />
          <Input
            label="Facebook"
            placeholder="https://facebook.com/…"
            error={
              errors.socialFacebook?.message ?? fieldError('socialFacebook')
            }
            {...register('socialFacebook')}
          />
          <Input
            label="TikTok"
            placeholder="https://tiktok.com/…"
            error={errors.socialTiktok?.message ?? fieldError('socialTiktok')}
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
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="cron" className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-text-primary">
            Cron Jobs & Scheduled Tasks
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
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
        <label className="flex items-start gap-3 rounded-lg border border-border bg-brand-blush/20 px-4 py-3 text-sm">
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
          </TabsContent>

          <TabsContent value="bridal" className="space-y-6">
        <fieldset className="space-y-3 rounded-lg border border-border bg-brand-blush/10 p-4">
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
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button type="submit" isLoading={isLoading}>
            Save settings
          </Button>
          <p className="text-xs text-text-muted">
            Saving applies changes from every tab.
          </p>
        </div>
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
