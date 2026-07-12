import 'server-only';
import {
  adminUserWriteSchema,
  type AdminOrderDTO,
  type AdminUserDetailDTO,
  type AdminUserDTO,
} from '@/shared/contracts/admin-ops.contract';
import type { Paginated } from '@/shared/contracts/admin-catalog.contract';
import { getRequestDb } from '@/server/db/request';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/server/http/errors';
import * as usersRepo from '@/server/repositories/users.repo';
import * as ordersRepo from '@/server/repositories/orders.repo';
import type { UserRow } from '@/server/repositories/users.repo';
import { toAdminOrderDTO } from '@/server/services/admin-orders.service';
import { ok } from '@/server/http/envelope';
import { writeAuditLog } from '@/server/services/audit.service';

function toAdminUserDTO(row: UserRow, ordersCount: number): AdminUserDTO {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    ...(row.phone ? { phone: row.phone } : {}),
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    ordersCount,
  };
}

export async function listAdminUsers(url: URL) {
  const db = await getRequestDb();
  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20') || 20;
  const q = url.searchParams.get('q') ?? undefined;
  const roleRaw = url.searchParams.get('role');
  let role: 'customer' | 'admin' | undefined;
  if (roleRaw === 'customer' || roleRaw === 'admin') role = roleRaw;
  else if (roleRaw) throw new ValidationError('Invalid role filter');

  const { rows, total, page: p, pageSize: ps } = await usersRepo.listAdminUsers(
    db,
    { q, role, page, pageSize },
  );

  const data: Paginated<AdminUserDTO> = {
    items: rows.map((r) => toAdminUserDTO(r, r.ordersCount)),
    page: p,
    pageSize: ps,
    total,
    totalPages: Math.max(1, Math.ceil(total / ps)),
  };
  return ok(data);
}

export async function getAdminUser(id: string): Promise<AdminUserDetailDTO> {
  const db = await getRequestDb();
  const user = await usersRepo.findUserById(db, id);
  if (!user) throw new NotFoundError('User not found');

  const ordersCount = await ordersRepo.countOrdersByUserId(db, id);
  const recent = await ordersRepo.findOrdersByUserId(db, id, 10);
  const recentOrders: AdminOrderDTO[] = recent.map(({ order, items }) =>
    toAdminOrderDTO(order, items),
  );

  return {
    ...toAdminUserDTO(user, ordersCount),
    recentOrders,
  };
}

export async function updateAdminUser(
  id: string,
  body: unknown,
  actorId: string,
): Promise<AdminUserDTO> {
  const parsed = adminUserWriteSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.flatten());
  }
  if (Object.keys(parsed.data).length === 0) {
    throw new ValidationError('No fields to update');
  }

  const db = await getRequestDb();
  const existing = await usersRepo.findUserById(db, id);
  if (!existing) throw new NotFoundError('User not found');

  const nextRole = parsed.data.role;
  if (nextRole !== undefined && nextRole !== existing.role) {
    if (id === actorId && nextRole === 'customer') {
      throw new ConflictError('You cannot demote your own admin account');
    }
    if (existing.role === 'admin' && nextRole === 'customer') {
      const admins = await usersRepo.countAdmins(db);
      if (admins <= 1) {
        throw new ConflictError('Cannot demote the last admin');
      }
    }
  }

  const updated = await usersRepo.updateUserAdmin(db, id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    role: parsed.data.role,
  });
  if (!updated) throw new NotFoundError('User not found');

  await writeAuditLog({
    actorId,
    action: 'update',
    entity: 'user',
    entityId: id,
  });

  const ordersCount = await ordersRepo.countOrdersByUserId(db, id);
  return toAdminUserDTO(updated, ordersCount);
}

export async function deleteAdminUser(
  id: string,
  actorId: string,
): Promise<{ ok: true }> {
  if (id === actorId) {
    throw new ConflictError('You cannot delete your own account');
  }

  const db = await getRequestDb();
  const existing = await usersRepo.findUserById(db, id);
  if (!existing) throw new NotFoundError('User not found');

  if (existing.role === 'admin') {
    const admins = await usersRepo.countAdmins(db);
    if (admins <= 1) {
      throw new ConflictError('Cannot delete the last admin');
    }
  }

  const removed = await usersRepo.deleteUser(db, id);
  if (!removed) throw new NotFoundError('User not found');

  await writeAuditLog({
    actorId,
    action: 'delete',
    entity: 'user',
    entityId: id,
  });

  return { ok: true };
}
