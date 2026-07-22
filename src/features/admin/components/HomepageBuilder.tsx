'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Dialog,
  useToast,
} from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import type { HomepageBlockDTO } from '@/shared/contracts/homepage.contract';
import {
  HomepageBlockForm,
  TYPE_LABELS,
} from './HomepageBlockForm';
import {
  useAdminHomepageBlocks,
  useCreateHomepageBlock,
  useDeleteHomepageBlock,
  useReorderHomepageBlocks,
  useUpdateHomepageBlock,
} from '../hooks/useAdminHomepage';

function summarizeConfig(block: HomepageBlockDTO): string {
  const c = block.config;
  const title = typeof c.title === 'string' ? c.title : null;
  if (title) return title;
  if (block.type === 'collection' && typeof c.categorySlug === 'string') {
    return c.categorySlug;
  }
  return '—';
}

export function HomepageBuilder() {
  const { toast } = useToast();
  const { data: blocks = [], isLoading, isError } = useAdminHomepageBlocks();
  const createMutation = useCreateHomepageBlock();
  const updateMutation = useUpdateHomepageBlock();
  const deleteMutation = useDeleteHomepageBlock();
  const reorderMutation = useReorderHomepageBlocks();

  const [createOpen, setCreateOpen] = useState(false);
  const [editBlock, setEditBlock] = useState<HomepageBlockDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...blocks].sort((a, b) => a.position - b.position),
    [blocks],
  );

  async function move(id: string, direction: -1 | 1) {
    const ids = ordered.map((b) => b.id);
    const index = ids.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const swapped = [...ids];
    const tmp = swapped[index]!;
    swapped[index] = swapped[next]!;
    swapped[next] = tmp;
    try {
      await reorderMutation.mutateAsync(swapped);
    } catch (err) {
      toast(
        err instanceof AppError ? err.message : 'Reorder failed',
        'error',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-text-secondary">
          Active blocks render on the storefront in this order when the{' '}
          <code className="text-xs">homepage_builder</code> flag is on. Empty
          or inactive → classic home.
        </p>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Add block
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-text-muted">Loading blocks…</p>
      )}
      {isError && (
        <p className="text-sm text-status-error">Failed to load blocks.</p>
      )}

      {!isLoading && ordered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted">
          No homepage blocks yet. Add a hero or featured section to start the
          builder experience.
        </div>
      )}

      <ul className="space-y-3">
        {ordered.map((block, index) => (
          <li
            key={block.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-raised p-4"
          >
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Move up"
                disabled={index === 0 || reorderMutation.isPending}
                onClick={() => void move(block.id, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Move down"
                disabled={
                  index === ordered.length - 1 || reorderMutation.isPending
                }
                onClick={() => void move(block.id, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {TYPE_LABELS[block.type]}
                </span>
                <span
                  className={
                    block.active
                      ? 'rounded-full bg-brand-blush px-2 py-0.5 text-xs text-brand-primary'
                      : 'rounded-full bg-border px-2 py-0.5 text-xs text-text-muted'
                  }
                >
                  {block.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-text-secondary">
                {summarizeConfig(block)}
              </p>
              <p className="mt-0.5 font-mono text-xs text-text-muted">
                {block.id} · pos {block.position}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void updateMutation
                    .mutateAsync({
                      id: block.id,
                      input: { active: !block.active },
                    })
                    .catch((err: unknown) =>
                      toast(
                        err instanceof AppError ? err.message : 'Update failed',
                        'error',
                      ),
                    )
                }
              >
                {block.active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Edit block"
                onClick={() => setEditBlock(block)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Delete block"
                onClick={() => setDeleteId(block.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add homepage block"
        className="max-w-lg"
      >
        <HomepageBlockForm
          mode="create"
          isLoading={createMutation.isPending}
          onSubmit={async (values) => {
            try {
              await createMutation.mutateAsync(values);
              setCreateOpen(false);
              toast('Block created', 'success');
            } catch (err) {
              toast(
                err instanceof AppError ? err.message : 'Create failed',
                'error',
              );
              throw err;
            }
          }}
        />
      </Dialog>

      <Dialog
        open={editBlock !== null}
        onClose={() => setEditBlock(null)}
        title="Edit homepage block"
        className="max-w-lg"
      >
        {editBlock && (
          <HomepageBlockForm
            key={editBlock.id}
            mode="edit"
            initial={editBlock}
            isLoading={updateMutation.isPending}
            onSubmit={async (values) => {
              try {
                await updateMutation.mutateAsync({
                  id: editBlock.id,
                  input: values,
                });
                setEditBlock(null);
                toast('Block updated', 'success');
              } catch (err) {
                toast(
                  err instanceof AppError ? err.message : 'Update failed',
                  'error',
                );
                throw err;
              }
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete block?"
        description="This removes the block from the homepage builder. The classic home is unchanged if no active blocks remain."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          void deleteMutation
            .mutateAsync(deleteId)
            .then(() => {
              setDeleteId(null);
              toast('Block deleted', 'success');
            })
            .catch((err: unknown) =>
              toast(
                err instanceof AppError ? err.message : 'Delete failed',
                'error',
              ),
            );
        }}
      />
    </div>
  );
}
