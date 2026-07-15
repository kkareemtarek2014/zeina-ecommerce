'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { Button, SearchInput, useToast } from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { adminCatalogService } from '../services/admin-catalog.service';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media', q],
    queryFn: () =>
      adminCatalogService.listMedia({ page: 1, pageSize: 48, q: q || undefined }),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close media picker"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-surface-raised p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">
            Media library
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              Upload
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              const uploaded = await adminCatalogService.uploadMedia(file);
              toast('Image uploaded', 'success');
              void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
              onSelect(uploaded.url);
              onClose();
            } catch (err) {
              toast(
                err instanceof AppError ? err.message : 'Upload failed',
                'error',
              );
            } finally {
              setUploading(false);
              if (fileRef.current) fileRef.current.value = '';
            }
          }}
        />
        <div className="mt-3">
          <SearchInput
            aria-label="Search media"
            placeholder="Search filename…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : (data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-muted">
              No media yet. Upload an image with the button above.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data?.items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="aspect-square w-full overflow-hidden rounded-(--radius) border border-border hover:border-brand-primary"
                    onClick={() => {
                      onSelect(m.url);
                      onClose();
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={m.alt ?? m.filename}
                      className="size-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
