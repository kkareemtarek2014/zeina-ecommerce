'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BridalRequest {
  id: string;
  fullName: string;
  phone: string;
  weddingDate?: string;
  description: string;
  /** File metadata only — actual upload needs the backend (see API.md). */
  fileName?: string;
  fileType?: string;
  createdAt: string;
  status: 'pending' | 'answered';
}

interface BridalRequestsState {
  requests: BridalRequest[];
  submitRequest: (
    draft: Omit<BridalRequest, 'id' | 'createdAt' | 'status'>,
  ) => BridalRequest;
}

function generateRequestId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BR-${stamp}-${random}`;
}

/**
 * Client-side request log — stands in for the backend API.
 * When the dashboard exists, submitRequest() will POST the form
 * (multipart, including the photo/video) instead.
 */
export const useBridalRequestsStore = create<BridalRequestsState>()(
  persist(
    (set) => ({
      requests: [],

      submitRequest: (draft) => {
        const request: BridalRequest = {
          ...draft,
          id: generateRequestId(),
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        set((state) => ({ requests: [request, ...state.requests] }));
        return request;
      },
    }),
    { name: 'Zaya-bridal-requests' },
  ),
);
