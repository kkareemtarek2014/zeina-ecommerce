import { z } from 'zod';

/**
 * Standard query schema for paginated API requests.
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Generic builder for paginated response schemas.
 */
export const createPaginatedResponseSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

/**
 * Legacy alias for createPaginatedResponseSchema for backwards compatibility.
 */
export const paginatedSchema = createPaginatedResponseSchema;

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
