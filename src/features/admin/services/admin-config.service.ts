import { api } from '@/shared/lib/api-client';
import type {
  AdminPromoDTO,
  AdminPromoWrite,
  AdminPromoUpdate,
  AdminSettingsDTO,
  AdminSettingsWrite,
  AdminGovernorateWrite,
  ShippingZoneDTO,
  StorefrontConfigDTO,
} from '@/shared/contracts/admin-config.contract';
import type {
  AdminGovernorateDTO,
  GovernorateDTO,
} from '@/shared/contracts/product.contract';

export const storefrontConfigService = {
  get(): Promise<StorefrontConfigDTO> {
    return api.get('/api/storefront-config');
  },
};

export const adminLocationsService = {
  listGovernorates(): Promise<AdminGovernorateDTO[]> {
    return api.get('/api/admin/locations/governorates');
  },
  listStorefrontGovernorates(): Promise<GovernorateDTO[]> {
    return api.get('/api/locations/governorates');
  },
  createGovernorate(
    input: AdminGovernorateWrite,
  ): Promise<AdminGovernorateDTO> {
    return api.post('/api/admin/locations/governorates', input);
  },
  updateGovernorate(
    id: string,
    input: {
      name?: string;
      zone?: GovernorateDTO['zone'];
      bostaCityId?: string | null;
      bostaZone?: string | null;
      bostaDistrict?: string | null;
    },
  ): Promise<AdminGovernorateDTO> {
    return api.put(`/api/admin/governorates/${encodeURIComponent(id)}`, input);
  },
  deleteGovernorate(id: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/governorates/${encodeURIComponent(id)}`);
  },
  listZones(): Promise<ShippingZoneDTO[]> {
    return api.get('/api/admin/shipping-zones');
  },
  updateZoneFee(zone: string, fee: number): Promise<ShippingZoneDTO> {
    return api.put(
      `/api/admin/shipping-zones/${encodeURIComponent(zone)}`,
      { fee },
    );
  },
};

export const adminPromosService = {
  list(): Promise<AdminPromoDTO[]> {
    return api.get('/api/admin/promos');
  },
  create(input: AdminPromoWrite): Promise<AdminPromoDTO> {
    return api.post('/api/admin/promos', input);
  },
  update(
    code: string,
    input: AdminPromoUpdate,
  ): Promise<AdminPromoDTO> {
    return api.put(`/api/admin/promos/${encodeURIComponent(code)}`, input);
  },
  toggle(code: string, active: boolean): Promise<AdminPromoDTO> {
    return api.patch(`/api/admin/promos/${encodeURIComponent(code)}`, {
      active,
    });
  },
  delete(code: string): Promise<{ ok: true }> {
    return api.del(`/api/admin/promos/${encodeURIComponent(code)}`);
  },
};

export const adminSettingsService = {
  get(): Promise<AdminSettingsDTO> {
    return api.get('/api/admin/settings');
  },
  update(input: AdminSettingsWrite): Promise<AdminSettingsDTO> {
    return api.put('/api/admin/settings', input);
  },
};
