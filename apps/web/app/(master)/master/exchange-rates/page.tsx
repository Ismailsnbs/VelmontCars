"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { SOURCE_BADGE_COLORS, FORM_COLORS } from "@/lib/design-tokens"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BulkUpdateDialog } from "./components/bulk-update-dialog"
import { Loader2, RefreshCw, Settings, Clock, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExchangeRate {
  id: string
  currencyCode: string
  currencyName: string
  buyRate: number | string
  sellRate: number | string
  source: string
  fetchedAt: string
  isActive: boolean
}

interface ExchangeRateSettings {
  id: string
  updateMode: "manual" | "auto"
  apiProvider: string | null
  apiKey: string | null
  updateInterval: number
  lastAutoUpdate: string | null
}

interface ExchangeRateHistory {
  id: string
  currencyCode: string
  buyRate: number | string
  sellRate: number | string
  source: string
  fetchedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ─── Zod Schema for Settings ─────────────────────────────────────────────────

const settingsSchema = z
  .object({
    updateMode: z.enum(["manual", "auto"]),
    apiProvider: z.string().optional(),
    apiKey: z.string().optional(),
    updateInterval: z
      .number({ invalid_type_error: "Sayı girin" })
      .min(1, "En az 1 dakika olmalı")
      .max(1440, "En fazla 1440 dakika (24 saat)"),
  })
  .superRefine((data, ctx) => {
    if (data.updateMode === "auto") {
      if (!data.apiProvider || data.apiProvider.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apiProvider"],
          message: "API Sağlayıcı zorunludur",
        })
      }
      if (!data.apiKey || data.apiKey.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apiKey"],
          message: "API Anahtarı zorunludur",
        })
      }
    }
  })

type SettingsFormValues = z.infer<typeof settingsSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRate = (rate: number | string): string =>
  Number(rate).toFixed(4)

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: tr })
  } catch {
    return "-"
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function SourceBadge({ source }: { source: string }) {
  if (source === "api") {
    return (
      <Badge className={SOURCE_BADGE_COLORS.apiWithHover}>
        API
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">Manuel</Badge>
  )
}

// ─── Tab: Güncel Kurlar ──────────────────────────────────────────────────────

function CurrentRatesTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  const { data: rates = [], isLoading } = useQuery<ExchangeRate[]>({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExchangeRate[]>>("/exchange-rates")
      return data.data
    },
    staleTime: 60 * 1000,
  })

  const { mutate: fetchFromApi, isPending: isFetching } = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<unknown>>("/exchange-rates/fetch")
      return data
    },
    onSuccess: () => {
      toast({ title: "Basarili", description: "Kurlar API'den guncellendi." })
      queryClient.invalidateQueries({ queryKey: ["exchange-rates"] })
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "API'den kur cekme basarisiz.",
        variant: "destructive",
      })
    },
  })

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Guncel Doviz Kurlari</h2>
          <p className="text-sm text-gray-500">
            {rates.length} aktif kur listeleniyor
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkDialogOpen(true)}
            disabled={isLoading || rates.length === 0}
          >
            Manuel Guncelle
          </Button>
          <Button
            size="sm"
            onClick={() => fetchFromApi()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            API'den Cek
          </Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Kod</TableHead>
              <TableHead>Doviz Adi</TableHead>
              <TableHead className="text-right">Alis</TableHead>
              <TableHead className="text-right">Satis</TableHead>
              <TableHead className="w-28">Kaynak</TableHead>
              <TableHead className="w-44">Son Guncelleme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={6} />
              ))
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-gray-500 py-10 text-sm"
                >
                  Kur verisi bulunamadi
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <span className="font-mono font-bold text-sm">
                      {rate.currencyCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{rate.currencyName}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatRate(rate.buyRate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatRate(rate.sellRate)}
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={rate.source} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(rate.fetchedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : rates.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-sm text-gray-500">
            Kur verisi bulunamadi
          </div>
        ) : (
          rates.map((rate) => (
            <div key={rate.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono font-bold text-sm">{rate.currencyCode}</p>
                  <p className="text-xs text-gray-500">{rate.currencyName}</p>
                </div>
                <SourceBadge source={rate.source} />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Alis:{" "}
                  <span className="font-mono font-semibold text-gray-900 tabular-nums">
                    {formatRate(rate.buyRate)}
                  </span>
                </span>
                <span>
                  Satis:{" "}
                  <span className="font-mono font-semibold text-gray-900 tabular-nums">
                    {formatRate(rate.sellRate)}
                  </span>
                </span>
              </div>
              <p className="text-xs text-gray-400">{formatDate(rate.fetchedAt)}</p>
            </div>
          ))
        )}
      </div>

      <BulkUpdateDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        currentRates={rates}
      />
    </>
  )
}

// ─── Tab: Ayarlar ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<ExchangeRateSettings>({
    queryKey: ["exchange-rate-settings"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExchangeRateSettings>>(
        "/exchange-rates/settings"
      )
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      updateMode: "manual",
      apiProvider: "",
      apiKey: "",
      updateInterval: 60,
    },
  })

  // Populate form when settings load from API
  useEffect(() => {
    if (settings) {
      reset({
        updateMode: settings.updateMode,
        apiProvider: settings.apiProvider ?? "",
        apiKey: settings.apiKey ?? "",
        updateInterval: settings.updateInterval,
      })
    }
  }, [settings, reset])

  const updateMode = watch("updateMode")

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const { data } = await api.put<ApiResponse<ExchangeRateSettings>>(
        "/exchange-rates/settings",
        values
      )
      return data
    },
    onSuccess: () => {
      toast({ title: "Basarili", description: "Ayarlar kaydedildi." })
      queryClient.invalidateQueries({ queryKey: ["exchange-rate-settings"] })
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (values: SettingsFormValues) => {
    saveSettings(values)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          Guncelleme Ayarlari
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Update Mode */}
          <div className="space-y-2">
            <Label htmlFor="updateMode">Guncelleme Modu</Label>
            <Select
              defaultValue={settings?.updateMode ?? "manual"}
              onValueChange={(val) =>
                setValue("updateMode", val as "manual" | "auto", {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="updateMode">
                <SelectValue placeholder="Mod secin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="auto">Otomatik</SelectItem>
              </SelectContent>
            </Select>
            {errors.updateMode && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.updateMode.message}</p>
            )}
          </div>

          {/* Auto mode fields */}
          {updateMode === "auto" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiProvider">API Saglayici</Label>
                <Input
                  id="apiProvider"
                  placeholder="orn. exchangeratesapi"
                  {...register("apiProvider")}
                />
                {errors.apiProvider && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>
                    {errors.apiProvider.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Anahtari</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="API anahtarinizi girin"
                  {...register("apiKey")}
                />
                {errors.apiKey && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>
                    {errors.apiKey.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateInterval">Guncelleme Araligi</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="updateInterval"
                    type="number"
                    min={1}
                    max={1440}
                    className="w-28"
                    {...register("updateInterval", { valueAsNumber: true })}
                  />
                  <span className="text-sm text-gray-500">dakika</span>
                </div>
                {errors.updateInterval && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>
                    {errors.updateInterval.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Last Auto Update info */}
          {settings?.lastAutoUpdate && (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium">Son Otomatik Guncelleme:</span>{" "}
                {formatDate(settings.lastAutoUpdate)}
              </span>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kaydet
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Tab: Gecmis ─────────────────────────────────────────────────────────────

const HISTORY_LIMIT = 30

function HistoryTab() {
  const [selectedCode, setSelectedCode] = useState<string>("")

  const { data: rates = [] } = useQuery<ExchangeRate[]>({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExchangeRate[]>>("/exchange-rates")
      return data.data
    },
    staleTime: 60 * 1000,
  })

  const { data: history = [], isLoading: isHistoryLoading } = useQuery<
    ExchangeRateHistory[]
  >({
    queryKey: ["exchange-rate-history", selectedCode],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExchangeRateHistory[]>>(
        `/exchange-rates/history/${selectedCode}`,
        { params: { limit: HISTORY_LIMIT } }
      )
      return data.data
    },
    enabled: !!selectedCode,
    staleTime: 30 * 1000,
  })

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-48">
          <Select onValueChange={setSelectedCode} value={selectedCode}>
            <SelectTrigger>
              <SelectValue placeholder="Doviz secin" />
            </SelectTrigger>
            <SelectContent>
              {rates.map((rate) => (
                <SelectItem key={rate.currencyCode} value={rate.currencyCode}>
                  {rate.currencyCode} — {rate.currencyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedCode && (
          <p className="text-sm text-gray-500">
            Son {HISTORY_LIMIT} kayit gosteriliyor
          </p>
        )}
      </div>

      {!selectedCode ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <TrendingUp className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Gecmisi goruntulenek icin bir doviz secin</p>
        </div>
      ) : (
        <div className="rounded-md border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Alis</TableHead>
                <TableHead className="text-right">Satis</TableHead>
                <TableHead className="w-28">Kaynak</TableHead>
                <TableHead className="w-44">Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isHistoryLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={4} />
                ))
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-10 text-sm"
                  >
                    Bu doviz icin kayit bulunamadi
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-right font-mono text-sm">
                      {formatRate(entry.buyRate)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatRate(entry.sellRate)}
                    </TableCell>
                    <TableCell>
                      <SourceBadge source={entry.source} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(entry.fetchedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExchangeRatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doviz Kurlari</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform genelinde kullanilan doviz kurlarini yonetin
        </p>
      </div>

      <Tabs defaultValue="rates">
        <TabsList>
          <TabsTrigger value="rates">Guncel Kurlar</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="history">Gecmis</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="mt-4">
          <CurrentRatesTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
