'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/stores/authStore';
import { SOCKET_EVENTS } from '@/lib/socket-events';
import { toast } from '@/components/ui/use-toast';

// --- Payload tipleri ---

interface VehiclePayload {
  id?: string;
  brand?: string;
  model?: string;
  plate?: string;
}

interface SalePayload {
  id?: string;
  vehicleName?: string;
  amount?: number;
}

interface StockPayload {
  id?: string;
  productName?: string;
  currentStock?: number;
}

interface TaxRatePayload {
  id?: string;
  taxName?: string;
  rate?: number;
}

interface NotificationPayload {
  id?: string;
  title?: string;
  message?: string;
}

// --- Helper ---

function vehicleLabel(data: VehiclePayload): string {
  const parts = [data.brand, data.model].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Araç';
}

/**
 * Dashboard layout'a mount edilir.
 * Socket event'lerini dinleyerek toast gösterir ve ilgili query cache'lerini geçersiz kılar.
 */
export function useSocketNotifications(): void {
  const { on } = useSocket();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // U-FE2: Socket bağlantısı auth tamamlanmadan kurulmamalı
    if (!isAuthenticated) return;

    // --- Vehicle events ---

    const unsubVehicleCreated = on(SOCKET_EVENTS.VEHICLE_CREATED, (raw) => {
      const data = raw as VehiclePayload;
      toast({
        title: 'Yeni Araç Eklendi',
        description: `${vehicleLabel(data)} stoka eklendi.`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    const unsubVehicleUpdated = on(SOCKET_EVENTS.VEHICLE_UPDATED, (raw) => {
      const data = raw as VehiclePayload;
      toast({
        title: 'Araç Güncellendi',
        description: `${vehicleLabel(data)} bilgileri güncellendi.`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    });

    const unsubVehicleSold = on(SOCKET_EVENTS.VEHICLE_SOLD, (raw) => {
      const data = raw as VehiclePayload;
      toast({
        title: 'Araç Satildi',
        description: `${vehicleLabel(data)} satisi tamamlandi.`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    const unsubVehicleStatusChanged = on(SOCKET_EVENTS.VEHICLE_STATUS_CHANGED, (raw) => {
      const data = raw as VehiclePayload;
      toast({
        title: 'Araç Durumu Degisti',
        description: `${vehicleLabel(data)} durumu guncellendi.`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    });

    // --- Sale events ---

    const unsubSaleCreated = on(SOCKET_EVENTS.SALE_CREATED, (raw) => {
      const data = raw as SalePayload;
      toast({
        title: 'Yeni Satis',
        description: `${data.vehicleName ?? 'Arac'} satisi kaydedildi.`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    const unsubSaleCancelled = on(SOCKET_EVENTS.SALE_CANCELLED, (raw) => {
      const data = raw as SalePayload;
      toast({
        title: 'Satis Iptal Edildi',
        description: `${data.vehicleName ?? 'Arac'} satisi iptal edildi.`,
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    // --- Stock events ---

    const unsubStockLow = on(SOCKET_EVENTS.STOCK_LOW, (raw) => {
      const data = raw as StockPayload;
      toast({
        title: 'Dusuk Stok Uyarisi',
        description: `${data.productName ?? 'Urun'} stoku kritik seviyede! (${data.currentStock ?? 0} adet)`,
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    });

    const unsubStockMovement = on(SOCKET_EVENTS.STOCK_MOVEMENT, () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    });

    // --- Calculator events ---

    const unsubCalculationSaved = on(SOCKET_EVENTS.CALCULATION_SAVED, () => {
      queryClient.invalidateQueries({ queryKey: ['calculations'] });
    });

    // --- Master panel events ---

    const unsubTaxRateChanged = on(SOCKET_EVENTS.TAX_RATE_CHANGED, (raw) => {
      const data = raw as TaxRatePayload;
      toast({
        title: 'Vergi Orani Degisti',
        description: `${data.taxName ?? 'Vergi'} orani guncellendi. Hesaplamalar etkilenebilir.`,
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['rates'] });
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
    });

    const unsubExchangeRateUpdated = on(SOCKET_EVENTS.EXCHANGE_RATE_UPDATED, () => {
      toast({
        title: 'Doviz Kuru Guncellendi',
        description: 'Guncel doviz kurlari sisteme yuklendi.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['rates'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    });

    // --- Notification events ---

    const unsubNotificationNew = on(SOCKET_EVENTS.NOTIFICATION_NEW, (raw) => {
      const data = raw as NotificationPayload;
      toast({
        title: data.title ?? 'Yeni Bildirim',
        description: data.message ?? 'Yeni bir bildiriminiz var.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Cleanup — tüm listener'ları kaldır
    return () => {
      unsubVehicleCreated();
      unsubVehicleUpdated();
      unsubVehicleSold();
      unsubVehicleStatusChanged();
      unsubSaleCreated();
      unsubSaleCancelled();
      unsubStockLow();
      unsubStockMovement();
      unsubCalculationSaved();
      unsubTaxRateChanged();
      unsubExchangeRateUpdated();
      unsubNotificationNew();
    };
  }, [on, queryClient, isAuthenticated]);
}
