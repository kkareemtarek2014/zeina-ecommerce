'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  useAdminGovernorates,
  useAdminShippingZones,
  useCreateGovernorate,
  useUpdateGovernorate,
  useDeleteGovernorate,
  useUpdateZoneFee,
} from '@/features/admin';
import type { AdminGovernorateDTO } from '@/shared/contracts/product.contract';
import type { ShippingZoneDTO } from '@/shared/contracts/admin-config.contract';
import {
  adminGovernorateUpdateSchema,
  adminGovernorateWriteSchema,
  type AdminGovernorateWrite,
} from '@/shared/contracts/admin-config.contract';
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Dialog,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@/shared/components/ui';
import { AppError } from '@/shared/contracts/errors';
import { formatEGP } from '@/shared/utils/price';

const ZONE_OPTIONS = [
  { value: 'cairo_giza', label: 'Cairo & Giza' },
  { value: 'near', label: 'Nearby governorates' },
  { value: 'far', label: 'Far governorates' },
] as const;

const createSchema = adminGovernorateWriteSchema;
const editSchema = adminGovernorateUpdateSchema;

type CreateValues = AdminGovernorateWrite;
type EditValues = {
  name?: string;
  zone?: AdminGovernorateDTO['zone'];
  bostaCityId?: string;
  bostaZone?: string;
  bostaDistrict?: string;
};

function ZoneFeeRow({ zone }: { zone: ShippingZoneDTO }) {
  const { toast } = useToast();
  const updateFee = useUpdateZoneFee();
  const [fee, setFee] = useState(String(zone.fee));
  const dirty = Number(fee) !== zone.fee;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-(--radius) border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{zone.label}</p>
        <p className="text-xs text-text-muted">{zone.zone}</p>
      </div>
      <div className="w-32">
        <Input
          label="Fee (EGP)"
          type="number"
          min={0}
          step="1"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!dirty || updateFee.isPending}
        isLoading={updateFee.isPending}
        onClick={() => {
          const parsed = Number(fee);
          if (!Number.isInteger(parsed) || parsed < 0) {
            toast('Enter a valid fee', 'error');
            return;
          }
          updateFee.mutate(
            { zone: zone.zone, fee: parsed },
            {
              onSuccess: () => toast('Zone fee updated', 'success'),
              onError: (err) =>
                toast(
                  err instanceof AppError ? err.message : 'Update failed',
                  'error',
                ),
            },
          );
        }}
      >
        Save
      </Button>
      <p className="w-full text-xs text-text-muted sm:w-auto">
        Current: {formatEGP(zone.fee)}
      </p>
    </div>
  );
}

export default function AdminLocationsPage() {
  const { toast } = useToast();
  const { data: governorates = [], isLoading, isError } = useAdminGovernorates();
  const { data: zones = [], isLoading: zonesLoading } = useAdminShippingZones();
  const createMutation = useCreateGovernorate();
  const updateMutation = useUpdateGovernorate();
  const deleteMutation = useDeleteGovernorate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<AdminGovernorateDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema) as Resolver<CreateValues>,
    defaultValues: {
      id: '',
      name: '',
      zone: 'near',
      bostaCityId: '',
      bostaZone: '',
      bostaDistrict: '',
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema) as Resolver<EditValues>,
    defaultValues: {
      name: '',
      zone: 'near',
      bostaCityId: '',
      bostaZone: '',
      bostaDistrict: '',
    },
  });

  const openEdit = (row: AdminGovernorateDTO) => {
    setEditRow(row);
    editForm.reset({
      name: row.name,
      zone: row.zone,
      bostaCityId: row.bostaCityId ?? '',
      bostaZone: row.bostaZone ?? '',
      bostaDistrict: row.bostaDistrict ?? '',
    });
  };

  const columns: DataTableColumn<AdminGovernorateDTO>[] = [
    {
      key: 'id',
      header: 'ID',
      cell: (row) => (
        <span className="font-mono text-xs">{row.id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      cell: (row) => row.name,
    },
    {
      key: 'zone',
      header: 'Zone',
      cell: (row) =>
        ZONE_OPTIONS.find((z) => z.value === row.zone)?.label ?? row.zone,
    },
    {
      key: 'bosta',
      header: 'Bosta city',
      cell: (row) => (
        <span className="font-mono text-xs text-text-muted">
          {row.bostaCityId ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-brand-primary"
            onClick={() => openEdit(row)}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-(--radius) text-text-secondary hover:bg-brand-blush/50 hover:text-status-error"
            onClick={() => setDeleteId(row.id)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Locations"
        subtitle="Manage governorates and shipping zone fees."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Locations' },
        ]}
      />


      <Tabs defaultValue="governorates" className="mt-6">
        <TabsList>
          <TabsTrigger value="governorates">Governorates</TabsTrigger>
          <TabsTrigger value="zones">Shipping zones</TabsTrigger>
        </TabsList>

        <TabsContent value="governorates">
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              onClick={() => {
                createForm.reset({
                  id: '',
                  name: '',
                  zone: 'near',
                  bostaCityId: '',
                  bostaZone: '',
                  bostaDistrict: '',
                });
                setCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add governorate
            </Button>
          </div>
          {isLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-status-error">Failed to load governorates.</p>
          ) : (
            <DataTable
              columns={columns}
              rows={governorates}
              rowKey={(r) => r.id}
              emptyMessage="No governorates yet."
            />
          )}
        </TabsContent>

        <TabsContent value="zones">
          {zonesLoading ? (
            <p className="text-sm text-text-muted">Loading…</p>
          ) : (
            <div className="space-y-3">
              {zones.map((z: ShippingZoneDTO) => (
                <ZoneFeeRow key={z.zone} zone={z} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add governorate"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={createMutation.isPending}
              onClick={() => {
                void createForm.handleSubmit((values) => {
                  createMutation.mutate(values, {
                    onSuccess: () => {
                      toast('Governorate created', 'success');
                      setCreateOpen(false);
                    },
                    onError: (err) =>
                      toast(
                        err instanceof AppError ? err.message : 'Create failed',
                        'error',
                      ),
                  });
                })();
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="ID"
            placeholder="new_gov"
            error={createForm.formState.errors.id?.message}
            {...createForm.register('id')}
          />
          <Input
            label="Name"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <Select
            label="Zone"
            error={createForm.formState.errors.zone?.message}
            {...createForm.register('zone')}
          >
            {ZONE_OPTIONS.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </Select>
          <Input
            label="Bosta city ID"
            placeholder="Matches Bosta city name/id"
            error={createForm.formState.errors.bostaCityId?.message}
            {...createForm.register('bostaCityId')}
          />
          <Input
            label="Bosta zone (optional)"
            error={createForm.formState.errors.bostaZone?.message}
            {...createForm.register('bostaZone')}
          />
          <Input
            label="Bosta district (optional)"
            error={createForm.formState.errors.bostaDistrict?.message}
            {...createForm.register('bostaDistrict')}
          />
        </div>
      </Dialog>

      <Dialog
        open={editRow != null}
        onClose={() => setEditRow(null)}
        title="Edit governorate"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={updateMutation.isPending}
              onClick={() => {
                if (!editRow) return;
                void editForm.handleSubmit((values) => {
                  updateMutation.mutate(
                    { id: editRow.id, input: values },
                    {
                      onSuccess: () => {
                        toast('Governorate updated', 'success');
                        setEditRow(null);
                      },
                      onError: (err) =>
                        toast(
                          err instanceof AppError ? err.message : 'Update failed',
                          'error',
                        ),
                    },
                  );
                })();
              }}
            >
              Save
            </Button>
          </>
        }
      >
        {editRow ? (
          <div className="space-y-4">
            <Input label="ID" value={editRow.id} disabled readOnly />
            <Input
              label="Name"
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name')}
            />
            <Select
              label="Zone"
              error={editForm.formState.errors.zone?.message}
              {...editForm.register('zone')}
            >
              {ZONE_OPTIONS.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </Select>
            <Input
              label="Bosta city ID"
              error={editForm.formState.errors.bostaCityId?.message}
              {...editForm.register('bostaCityId')}
            />
            <Input
              label="Bosta zone (optional)"
              error={editForm.formState.errors.bostaZone?.message}
              {...editForm.register('bostaZone')}
            />
            <Input
              label="Bosta district (optional)"
              error={editForm.formState.errors.bostaDistrict?.message}
              {...editForm.register('bostaDistrict')}
            />
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        title="Delete governorate?"
        description="Removes this governorate from checkout. Blocked if used on existing orders."
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => {
              toast('Governorate deleted', 'success');
              setDeleteId(null);
            },
            onError: (err) => {
              toast(
                err instanceof AppError ? err.message : 'Could not delete',
                'error',
              );
              setDeleteId(null);
            },
          });
        }}
      />
    </div>
  );
}
