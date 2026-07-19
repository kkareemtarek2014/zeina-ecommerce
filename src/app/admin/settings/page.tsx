'use client';

import { useState } from 'react';
import {
  AdminBreadcrumbs,
  IntegrationsStatusPanel,
  SettingsForm,
  useAdminSettings,
  useUpdateAdminSettings,
} from '@/features/admin';
import { useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

function fieldErrorsFromDetails(
  details: unknown,
): Record<string, string[] | undefined> | undefined {
  if (!details || typeof details !== 'object') return undefined;
  const fieldErrors = (details as { fieldErrors?: unknown }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return undefined;
  return fieldErrors as Record<string, string[] | undefined>;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useAdminSettings();
  const updateMutation = useUpdateAdminSettings();
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string[] | undefined> | undefined
  >();

  return (
    <div>
      <AdminBreadcrumbs
        items={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
      />
      <h1 className="font-display text-3xl font-semibold text-text-primary">
        Settings
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Profit margin, branding, contact, SEO, maintenance, and cron automation.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError || !data ? (
          <p className="text-sm text-status-error">Failed to load settings.</p>
        ) : (
          <>
            <SettingsForm
              initial={data}
              isLoading={updateMutation.isPending}
              serverFieldErrors={serverFieldErrors}
              onSubmit={async (values) => {
                try {
                  setServerFieldErrors(undefined);
                  const n = (v: string | undefined) => {
                    const t = v?.trim() ?? '';
                    return t ? t : null;
                  };
                  await updateMutation.mutateAsync({
                    profitMargin: values.profitMargin,
                    freeShippingThreshold: values.freeShippingThreshold,
                    lowStockThreshold: values.lowStockThreshold,
                    usdEgpRate: values.usdEgpRate,
                    bulkShippingUsd: values.bulkShippingUsd,
                    customsDutyRate: values.customsDutyRate,
                    vatRate: values.vatRate,
                    handlingFeeEgp: values.handlingFeeEgp,
                    targetMargin: values.targetMargin,
                    priceRoundingEgp: values.priceRoundingEgp,
                    siteName: values.siteName,
                    siteTagline: values.siteTagline,
                    siteUrl: values.siteUrl,
                    logoUrl: n(values.logoUrl),
                    faviconUrl: n(values.faviconUrl),
                    contactEmail: n(values.contactEmail),
                    contactPhone: n(values.contactPhone),
                    whatsappNumber: n(values.whatsappNumber),
                    socialInstagram: n(values.socialInstagram),
                    socialFacebook: n(values.socialFacebook),
                    socialTiktok: n(values.socialTiktok),
                    shippingEtaLocal: values.shippingEtaLocal,
                    shippingEtaDropship: values.shippingEtaDropship,
                    instagramHandle: n(values.instagramHandle),
                    instagramPostUrls: (values.instagramPostUrls ?? '')
                      .split('\n')
                      .map((u) => u.trim())
                      .filter(Boolean),
                    seoDefaultTitle: n(values.seoDefaultTitle),
                    seoDefaultDescription: n(values.seoDefaultDescription),
                    footerText: n(values.footerText),
                    announcementItems: values.announcementItems,
                    maintenanceMode: values.maintenanceMode,
                    unpaidOrderTimeoutMinutes: values.unpaidOrderTimeoutMinutes,
                    pendingReminderHours: values.pendingReminderHours,
                  });
                  toast('Settings saved', 'success');
                } catch (err) {
                  if (err instanceof AppError) {
                    const fields = fieldErrorsFromDetails(err.details);
                    setServerFieldErrors(fields);
                    const firstFieldMsg = fields
                      ? Object.values(fields).flat().find(Boolean)
                      : undefined;
                    toast(firstFieldMsg ?? err.message, 'error');
                    return;
                  }
                  toast('Save failed', 'error');
                }
              }}
            />
            <IntegrationsStatusPanel />
          </>
        )}
      </div>
    </div>
  );
}
