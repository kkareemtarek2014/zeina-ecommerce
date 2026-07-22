'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload } from 'lucide-react';
import {
  AdminPageHeader,
  adminCatalogService,
} from '@/features/admin';
import type { AdminMediaDTO } from '@/shared/contracts/admin-catalog.contract';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Input,
  Pagination,
  SearchInput,
  useToast,
} from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';

const PAGE_SIZE = 24;

function dimensionsLabel(row: AdminMediaDTO): string | null {
  if (row.width == null || row.height == null) return null;
  return `${row.width}×${row.height}`;
}

export default function AdminMediaPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaDTO | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [savingAltId, setSavingAltId] = useState<string | null>(null);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, q: q || undefined }),
    [page, q],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'media', params],
    queryFn: () => adminCatalogService.listMedia(params),
  });

  const columns: DataTableColumn<AdminMediaDTO>[] = [
    {
      key: 'preview',
      header: '',
      className: 'w-16',
      cell: (row) => (
        <div className="relative size-12 overflow-hidden rounded-(--radius) bg-brand-blush/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.url}
            alt={row.alt ?? row.filename}
            width={row.width ?? undefined}
            height={row.height ?? undefined}
            className="size-full object-cover"
          />
        </div>
      ),
    },
    {
      key: 'filename',
      header: 'File',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.filename}</p>
          <p className="truncate text-xs text-text-muted">{row.url}</p>
        </div>
      ),
    },
    {
      key: 'meta',
      header: 'Meta',
      cell: (row) => {
        const dims = dimensionsLabel(row);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">{row.mime}</Badge>
            {dims ? <Badge tone="muted">{dims}</Badge> : null}
            <span className="text-xs text-text-muted">
              {Math.round(row.size / 1024)} KB
              {row.folder ? ` · ${row.folder}` : ''}
            </span>
          </div>
        );
      },
    },
    {
      key: 'alt',
      header: 'Alt text',
      cell: (row) => {
        const value = altDrafts[row.id] ?? row.alt ?? '';
        return (
          <div className="flex min-w-[12rem] max-w-xs items-end gap-2">
            <div className="flex-1">
              <Input
                aria-label={`Alt text for ${row.filename}`}
                value={value}
                maxLength={200}
                placeholder="Describe the image"
                className="h-9"
                onChange={(e) =>
                  setAltDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={savingAltId === row.id}
              disabled={(row.alt ?? '') === value.trim()}
              onClick={async () => {
                setSavingAltId(row.id);
                try {
                  const next = value.trim() ? value.trim() : null;
                  await adminCatalogService.updateMediaAlt(row.id, next);
                  toast('Alt text saved', 'success');
                  setAltDrafts((prev) => {
                    const next = { ...prev };
                    delete next[row.id];
                    return next;
                  });
                  void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
                } catch (err) {
                  toast(
                    err instanceof AppError ? err.message : 'Could not save alt',
                    'error',
                  );
                } finally {
                  setSavingAltId(null);
                }
              }}
            >
              Save
            </Button>
          </div>
        );
      },
    },
    {
      key: 'when',
      header: 'Uploaded',
      cell: (row) => (
        <time className="whitespace-nowrap text-xs text-text-muted">
          {new Date(row.createdAt).toLocaleString()}
        </time>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20 text-right',
      cell: (row) => (
        <button
          type="button"
          aria-label={`Delete ${row.filename}`}
          className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Media"
        subtitle="JPEG / PNG / WebP are stored as optimized WebP. SVG passes through. GIF and HEIC are rejected."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Media' },
        ]}
        action={
          <>
            <Button
              type="button"
              isLoading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" />
              Upload
            </Button>
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
                  await adminCatalogService.uploadMedia(file);
                  toast('Image uploaded', 'success');
                  void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
                } catch (err) {
                  toast(
                    err instanceof Error ? err.message : 'Upload failed',
                    'error',
                  );
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <SearchInput
            aria-label="Search media"
            placeholder="Search filename…"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setQ(qDraft.trim());
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPage(1);
            setQ(qDraft.trim());
          }}
        >
          Search
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-status-error">Failed to load media.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(r) => r.id}
            emptyMessage="No media yet. Upload an image to get started."
          />
        )}
      </div>

      {data && data.total > 0 ? (
        <Pagination
          className="mt-4"
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={setPage}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="Delete media?"
        description="Blocked if this URL is still used on a product or category."
        confirmLabel="Delete"
        danger
        isLoading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await adminCatalogService.deleteMedia(deleteTarget.id);
            toast('Media deleted', 'success');
            setDeleteTarget(null);
            void qc.invalidateQueries({ queryKey: ['admin', 'media'] });
          } catch (err) {
            toast(
              err instanceof AppError ? err.message : 'Could not delete',
              'error',
            );
            setDeleteTarget(null);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
