'use client';

import { CheckCircle, Truck, MapPin, Check } from 'lucide-react';
import { Button, useToast } from '@/shared/components/ui';
import { type OrderStatus } from '@/shared/contracts/admin-ops.contract';
import { useUpdateAdminOrderStatus } from '../hooks/useAdminOps';
import { ORDER_STATUS_LABELS } from './OrderStatusSelect';

export interface OrderQuickActionsProps {
  orderId: string;
  status: OrderStatus;
  size?: 'sm' | 'md';
  onSuccess?: () => void;
  className?: string;
}

const ACTION_CONFIG: Record<
  OrderStatus,
  { nextStatus: OrderStatus; label: string; icon: typeof CheckCircle } | null
> = {
  placed: { nextStatus: 'confirmed', label: 'Confirm', icon: CheckCircle },
  confirmed: { nextStatus: 'sourced', label: 'Source', icon: CheckCircle },
  sourced: { nextStatus: 'shipped', label: 'Ship', icon: Truck },
  shipped: { nextStatus: 'out_for_delivery', label: 'Dispatch', icon: MapPin },
  out_for_delivery: { nextStatus: 'delivered', label: 'Deliver', icon: Check },
  delivered: null,
  cancelled: null,
};

export function OrderQuickActions({
  orderId,
  status,
  size = 'sm',
  onSuccess,
  className,
}: OrderQuickActionsProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateAdminOrderStatus(orderId);

  const config = ACTION_CONFIG[status];
  if (!config) return null;

  const { nextStatus, label, icon: Icon } = config;

  const handleAdvance = async () => {
    try {
      await updateMutation.mutateAsync({ status: nextStatus });
      toast(
        `Order #${orderId} set to ${ORDER_STATUS_LABELS[nextStatus] ?? nextStatus}`,
        'success'
      );
      onSuccess?.();
    } catch {
      toast(`Failed to update order #${orderId}`, 'error');
    }
  };

  return (
    <Button
      type="button"
      variant="primary"
      size={size}
      isLoading={updateMutation.isPending}
      disabled={updateMutation.isPending}
      onClick={(e) => {
        e.stopPropagation();
        void handleAdvance();
      }}
      className={className}
    >
      <Icon className="size-3.5" />
      <span>{label}</span>
    </Button>
  );
}
