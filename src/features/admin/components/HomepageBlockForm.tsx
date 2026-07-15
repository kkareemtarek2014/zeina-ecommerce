'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/shared/components/ui';
import { MediaPicker } from './MediaPicker';
import {
  HERO_DEFAULT_PRIMARY,
  HERO_DEFAULT_SECONDARY,
  BUNDLES_PATH,
} from '@/shared/lib/feature-links';
import {
  HOMEPAGE_BLOCK_TYPES,
  type HomepageBlockDTO,
  type HomepageBlockType,
  type HomepageBlockWrite,
} from '@/shared/contracts/homepage.contract';

const TYPE_LABELS: Record<HomepageBlockType, string> = {
  hero: 'Hero',
  featured: 'Featured products',
  new_arrivals: 'New arrivals',
  collection: 'Collection',
  promo: 'Promo banner',
};

interface HomepageBlockFormProps {
  mode: 'create' | 'edit';
  initial?: HomepageBlockDTO;
  onSubmit: (values: HomepageBlockWrite) => Promise<void>;
  isLoading?: boolean;
}

function defaultConfig(type: HomepageBlockType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return {
        title: 'Adorn every day',
        subtitle: 'Curated accessories for the modern Egyptian woman.',
        image: '/images/hero.svg',
        ctaLabel: HERO_DEFAULT_PRIMARY.label,
        ctaHref: HERO_DEFAULT_PRIMARY.href,
        secondaryCtaLabel: HERO_DEFAULT_SECONDARY.label,
        secondaryCtaHref: HERO_DEFAULT_SECONDARY.href,
      };
    case 'featured':
      return { title: 'Featured Pieces', productIds: [] };
    case 'new_arrivals':
      return { title: 'New arrivals', limit: 8 };
    case 'collection':
      return {
        title: 'Shop the collection',
        categorySlug: 'jewelry',
        description: '',
      };
    case 'promo':
      return {
        title: 'Free shipping from 1,500 EGP',
        body: 'Delivered across Egypt — cash on delivery.',
        ctaLabel: 'Shop now',
        ctaHref: '/shop',
      };
  }
}

function str(config: Record<string, unknown>, key: string): string {
  const v = config[key];
  return typeof v === 'string' ? v : '';
}

function num(config: Record<string, unknown>, key: string): string {
  const v = config[key];
  return typeof v === 'number' ? String(v) : '';
}

function productIdsText(config: Record<string, unknown>): string {
  const v = config.productIds;
  if (!Array.isArray(v)) return '';
  return v.filter((x): x is string => typeof x === 'string').join(', ');
}

/** Shared image URL + MediaPicker affordance for hero / promo blocks. */
function ImageUrlField({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1">
        <Input
          label="Image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Button type="button" variant="secondary" onClick={onPick}>
        Media
      </Button>
    </div>
  );
}

export function HomepageBlockForm({
  mode,
  initial,
  onSubmit,
  isLoading,
}: HomepageBlockFormProps) {
  const [type, setType] = useState<HomepageBlockType>(
    initial?.type ?? 'hero',
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => (initial?.config as Record<string, unknown>) ?? defaultConfig('hero'),
  );
  const [productIdsRaw, setProductIdsRaw] = useState(() =>
    productIdsText(
      (initial?.config as Record<string, unknown>) ?? defaultConfig('hero'),
    ),
  );
  const [pickerField, setPickerField] = useState<'image' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function onTypeChange(next: HomepageBlockType) {
    setType(next);
    const nextConfig = defaultConfig(next);
    setConfig(nextConfig);
    setProductIdsRaw(productIdsText(nextConfig));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = { ...config };

    if (type === 'featured') {
      payload.productIds = productIdsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (type === 'new_arrivals') {
      const limit = Number(num(config, 'limit') || 8);
      payload.limit = Number.isFinite(limit) ? limit : 8;
    }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') delete payload[key];
    }

    try {
      await onSubmit({ type, config: payload, active });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save block');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Block type"
        value={type}
        onChange={(e) => onTypeChange(e.target.value as HomepageBlockType)}
        disabled={mode === 'edit'}
      >
        {HOMEPAGE_BLOCK_TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABELS[t]}
          </option>
        ))}
      </Select>

      {(type === 'hero' ||
        type === 'featured' ||
        type === 'new_arrivals' ||
        type === 'collection' ||
        type === 'promo') && (
        <Input
          label="Title"
          value={str(config, 'title')}
          onChange={(e) => patch('title', e.target.value)}
          required={type === 'hero' || type === 'promo'}
        />
      )}

      {type === 'hero' && (
        <>
          <Input
            label="Subtitle"
            value={str(config, 'subtitle')}
            onChange={(e) => patch('subtitle', e.target.value)}
          />
          <ImageUrlField
            value={str(config, 'image')}
            onChange={(v) => patch('image', v)}
            onPick={() => setPickerField('image')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Primary CTA label"
              value={str(config, 'ctaLabel')}
              onChange={(e) => patch('ctaLabel', e.target.value)}
            />
            <Input
              label="Primary CTA href"
              value={str(config, 'ctaHref')}
              onChange={(e) => patch('ctaHref', e.target.value)}
              placeholder={HERO_DEFAULT_PRIMARY.href}
            />
            <Input
              label="Secondary CTA label"
              value={str(config, 'secondaryCtaLabel')}
              onChange={(e) => patch('secondaryCtaLabel', e.target.value)}
            />
            <Input
              label="Secondary CTA href"
              value={str(config, 'secondaryCtaHref')}
              onChange={(e) => patch('secondaryCtaHref', e.target.value)}
              placeholder={HERO_DEFAULT_SECONDARY.href}
            />
          </div>
          <p className="text-xs text-text-muted">
            Defaults deep-link to shop sorts: New In →{' '}
            <code className="text-[0.7rem]">{HERO_DEFAULT_PRIMARY.href}</code>, Best
            Sellers →{' '}
            <code className="text-[0.7rem]">{HERO_DEFAULT_SECONDARY.href}</code>.
          </p>
        </>
      )}

      {type === 'featured' && (
        <div className="space-y-1.5">
          <Input
            label="Product IDs (comma-separated, empty = featured flag)"
            value={productIdsRaw}
            onChange={(e) => setProductIdsRaw(e.target.value)}
          />
          <p className="text-xs text-text-muted">
            Leave empty to use products marked featured.
          </p>
        </div>
      )}

      {type === 'new_arrivals' && (
        <Input
          label="Limit"
          type="number"
          min={1}
          max={24}
          value={num(config, 'limit') || '8'}
          onChange={(e) => patch('limit', e.target.value)}
        />
      )}

      {type === 'collection' && (
        <>
          <Input
            label="Category slug"
            value={str(config, 'categorySlug')}
            onChange={(e) => patch('categorySlug', e.target.value)}
            required
          />
          <Input
            label="Description"
            value={str(config, 'description')}
            onChange={(e) => patch('description', e.target.value)}
          />
        </>
      )}

      {type === 'promo' && (
        <>
          <Input
            label="Body"
            value={str(config, 'body')}
            onChange={(e) => patch('body', e.target.value)}
          />
          <ImageUrlField
            value={str(config, 'image')}
            onChange={(v) => patch('image', v)}
            onPick={() => setPickerField('image')}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="CTA label"
              value={str(config, 'ctaLabel')}
              onChange={(e) => patch('ctaLabel', e.target.value)}
            />
            <Input
              label="CTA href"
              value={str(config, 'ctaHref')}
              onChange={(e) => patch('ctaHref', e.target.value)}
              placeholder="/shop"
            />
          </div>
          <p className="text-xs text-text-muted">
            Bundles promo: set CTA href to{' '}
            <code className="text-[0.7rem]">{BUNDLES_PATH}</code> when the{' '}
            <code className="text-[0.7rem]">bundles</code> flag is ON. The
            storefront hides that CTA while the flag is off.
          </p>
        </>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Active (visible on storefront when builder flag is on)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : mode === 'create' ? 'Add block' : 'Save'}
      </Button>

      <MediaPicker
        open={pickerField !== null}
        onClose={() => setPickerField(null)}
        onSelect={(url) => {
          if (pickerField) patch(pickerField, url);
          setPickerField(null);
        }}
      />
    </form>
  );
}

export { TYPE_LABELS };
