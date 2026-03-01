'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import {
  Building2,
  DollarSign,
  Globe,
  Receipt,
  ScrollText,
  TrendingUp,
} from 'lucide-react';

import api from '@/lib/api';
import { STAT_CARD_ACCENTS, SEMANTIC_COLORS } from '@/lib/design-tokens';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface GalleryResponse {
  success: boolean;
  data: Array<unknown>;
  total: number;
}

interface TaxRateResponse {
  success: boolean;
  data: Array<unknown>;
  total: number;
}

interface ExchangeRateResponse {
  data: Array<{ id: string; currencyCode: string; buyRate: number; sellRate: number; fetchedAt: string }>;
}

interface CountryResponse {
  success: boolean;
  data: Array<unknown>;
  total: number;
}

interface AuditLogResponse {
  data: Array<{
    id: string;
    action: string;
    entityType: string;
    performedBy: string;
    performedAt: string;
  }>;
}

export default function MasterDashboard() {
  // Fetch statistics
  const { data: galleriesData, isLoading: galleriesLoading } = useQuery<GalleryResponse>({
    queryKey: ['galleries-stats'],
    queryFn: () => api.get('/galleries', { params: { limit: 1 } }).then((res) => res.data),
  });

  const { data: taxRatesData, isLoading: taxRatesLoading } = useQuery<TaxRateResponse>({
    queryKey: ['tax-rates-stats'],
    queryFn: () => api.get('/tax-rates', { params: { limit: 1 } }).then((res) => res.data),
  });

  const { data: exchangeRatesData, isLoading: exchangeRatesLoading } =
    useQuery<ExchangeRateResponse>({
      queryKey: ['exchange-rates-stats'],
      queryFn: () => api.get('/exchange-rates').then((res) => res.data),
    });

  const { data: countriesData, isLoading: countriesLoading } = useQuery<CountryResponse>({
    queryKey: ['countries-stats'],
    queryFn: () => api.get('/countries', { params: { limit: 1 } }).then((res) => res.data),
  });

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery<AuditLogResponse>({
    queryKey: ['audit-logs-recent'],
    queryFn: () => api.get('/audit-logs', { params: { limit: 5 } }).then((res) => res.data),
  });

  const galleryCount = galleriesData?.total ?? 0;
  const taxRateCount = taxRatesData?.total ?? 0;
  const exchangeRateCount = exchangeRatesData?.data?.length ?? 0;
  const countryCount = countriesData?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Platform yönetim paneli ve istatistikleri</p>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Galleries */}
        <Link href="/master/galleries">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Galeri</CardTitle>
              <Building2 className={`h-4 w-4 ${STAT_CARD_ACCENTS.gallery.color}`} />
            </CardHeader>
            <CardContent>
              {galleriesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{galleryCount}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Aktif galerilerin sayısı</p>
            </CardContent>
          </Card>
        </Link>

        {/* Active Tax Rates */}
        <Link href="/master/tax-rates">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Vergi Oranları</CardTitle>
              <Receipt className={`h-4 w-4 ${STAT_CARD_ACCENTS.taxRates.color}`} />
            </CardHeader>
            <CardContent>
              {taxRatesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{taxRateCount}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Tanımlı vergi oranları</p>
            </CardContent>
          </Card>
        </Link>

        {/* Exchange Rates */}
        <Link href="/master/exchange-rates">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Döviz Kurları</CardTitle>
              <DollarSign className={`h-4 w-4 ${STAT_CARD_ACCENTS.exchangeRates.color}`} />
            </CardHeader>
            <CardContent>
              {exchangeRatesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{exchangeRateCount}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Aktif döviz kurları</p>
            </CardContent>
          </Card>
        </Link>

        {/* Countries */}
        <Link href="/master/countries">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kayıtlı Ülkeler</CardTitle>
              <Globe className={`h-4 w-4 ${STAT_CARD_ACCENTS.countries.color}`} />
            </CardHeader>
            <CardContent>
              {countriesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{countryCount}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Sistem içindeki ülkeler</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Exchange Rate Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Döviz Kurları Özeti
          </CardTitle>
          <CardDescription>
            {exchangeRatesData && exchangeRatesData.data?.length > 0
              ? `Son güncelleme: ${formatDistanceToNow(
                  new Date(exchangeRatesData.data[0].fetchedAt),
                  { locale: tr, addSuffix: true }
                )}`
              : 'Veriler yüklenemedi'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exchangeRatesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : exchangeRatesData && exchangeRatesData.data?.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {exchangeRatesData.data.map((rate) => (
                <div key={rate.id} className="p-4 border rounded-lg">
                  <div className="font-semibold text-lg text-center mb-3">{rate.currencyCode}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alış:</span>
                      <span className="font-medium">{Number(rate.buyRate).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Satış:</span>
                      <span className="font-medium">{Number(rate.sellRate).toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Döviz kuru verisi bulunamadı
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Son Aktiviteler
          </CardTitle>
          <CardDescription>Platform üzerindeki son 5 işlem</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : auditLogsData && auditLogsData.data?.length > 0 ? (
            <div className="space-y-4">
              {auditLogsData.data.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {log.entityType}
                      </Badge>
                      <span className="font-medium text-sm">{log.action}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tarafından: {log.performedBy}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDistanceToNow(new Date(log.performedAt), {
                      locale: tr,
                      addSuffix: true,
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Henüz aktivite kaydı yok
            </div>
          )}
          <Link
            href="/master/audit-logs"
            className={`text-sm ${SEMANTIC_COLORS.link} hover:underline mt-4 inline-block`}
          >
            Tüm aktiviteleri görüntüle →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
