/**
 * Server pagination utility helpers for uniform query parsing, clamp/offset logic,
 * and paginated response structure creation across services and repos.
 */

export interface PaginationOptions {
  defaultPageSize?: number;
  max?: number;
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  offset: number;
}

/**
 * Normalizes page and pageSize, calculating SQL offset and bounds.
 */
export function normalizePagination(
  params: { page?: number | string | null; pageSize?: number | string | null },
  options: PaginationOptions = {},
): NormalizedPagination {
  const defaultPageSize = options.defaultPageSize ?? 20;
  const max = options.max ?? 100;

  const rawPage = typeof params.page === 'string' ? parseInt(params.page, 10) : params.page;
  const rawSize = typeof params.pageSize === 'string' ? parseInt(params.pageSize, 10) : params.pageSize;

  const page = Math.max(1, isNaN(rawPage ?? NaN) ? 1 : (rawPage as number));
  const pageSize = Math.min(
    max,
    Math.max(1, isNaN(rawSize ?? NaN) ? defaultPageSize : (rawSize as number)),
  );
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Parses page and pageSize from a URL or URLSearchParams.
 */
export function parsePaginationFromUrl(
  urlOrSearchParams: string | URL | URLSearchParams,
  options: PaginationOptions = {},
): NormalizedPagination {
  let searchParams: URLSearchParams;

  if (urlOrSearchParams instanceof URLSearchParams) {
    searchParams = urlOrSearchParams;
  } else if (typeof urlOrSearchParams === 'string') {
    const rawUrl = urlOrSearchParams.startsWith('http')
      ? urlOrSearchParams
      : `http://localhost${urlOrSearchParams.startsWith('/') ? '' : '/'}${urlOrSearchParams}`;
    searchParams = new URL(rawUrl).searchParams;
  } else {
    searchParams = urlOrSearchParams.searchParams;
  }

  const page = searchParams.get('page');
  const pageSize = searchParams.get('pageSize') ?? searchParams.get('limit');

  return normalizePagination({ page, pageSize }, options);
}

/**
 * Builds standard envelope for paginated collections.
 */
export function buildPaginatedResult<T>({
  items,
  total,
  page,
  pageSize,
}: {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
  };
}
