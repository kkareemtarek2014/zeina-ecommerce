'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminCategoryWrite,
  AdminProductWrite,
} from '@/shared/contracts/admin-catalog.contract';
import {
  adminCatalogService,
  type AdminProductListParams,
} from '../services/admin-catalog.service';

export const adminKeys = {
  products: (params: AdminProductListParams) =>
    ['admin', 'products', params] as const,
  product: (id: string) => ['admin', 'products', id] as const,
  categories: ['admin', 'categories'] as const,
};

export function useAdminProducts(params: AdminProductListParams) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: () => adminCatalogService.listProducts(params),
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: adminKeys.product(id),
    queryFn: () => adminCatalogService.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: () => adminCatalogService.listCategories(),
  });
}

export function useCreateAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminProductWrite) =>
      adminCatalogService.createProduct(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useUpdateAdminProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminProductWrite) =>
      adminCatalogService.updateProduct(id, input),
    onSuccess: (product) => {
      qc.setQueryData(adminKeys.product(id), product);
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useDeleteAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCatalogService.deleteProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useRestoreAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCatalogService.restoreProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useCreateAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminCategoryWrite) =>
      adminCatalogService.createCategory(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.categories });
    },
  });
}

export function useUpdateAdminCategory(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AdminCategoryWrite>) =>
      adminCatalogService.updateCategory(slug, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.categories });
    },
  });
}

export function useDeleteAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => adminCatalogService.deleteCategory(slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.categories });
    },
  });
}
