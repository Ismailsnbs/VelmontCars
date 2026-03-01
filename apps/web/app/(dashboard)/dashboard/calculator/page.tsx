"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Calculator,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  TrendingUp,
} from "lucide-react"

import { useApiMutation, useApiQuery } from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { CALCULATOR_COLORS, FORM_COLORS } from "@/lib/design-tokens"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear()

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
] as const

const VEHICLE_TYPE_OPTIONS = [
  { value: "PASSENGER", label: "Binek" },
  { value: "COMMERCIAL", label: "Ticari" },
] as const

const PROFIT_MARGINS = [
  { label: "%15 Kar", rate: 0.15 },
  { label: "%20 Kar", rate: 0.2 },
  { label: "%25 Kar", rate: 0.25 },
] as const

const PAGE_SIZE = 10

const FIF_RANGES = [
  { range: "0 – 1.000 cc", rate: "%15" },
  { range: "1.001 – 1.600 cc", rate: "%18" },
  { range: "1.601 – 2.000 cc", rate: "%22" },
  { range: "2.001 – 2.500 cc", rate: "%25" },
  { range: "2.500+ cc", rate: "%30" },
] as const

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const calculatorSchema = z.object({
  fobPrice: z
    .number({ invalid_type_error: "Gecerli bir tutar giriniz" })
    .positive("FOB fiyati pozitif olmali"),
  fobCurrency: z.string().default("USD"),
  originCountryId: z.string().min(1, "Mense ulke seciniz"),
  engineCC: z
    .number({ invalid_type_error: "Gecerli bir deger giriniz" })
    .int()
    .positive()
    .max(20000),
  vehicleType: z.enum(["PASSENGER", "COMMERCIAL"]),
  modelYear: z
    .number({ invalid_type_error: "Gecerli bir yil giriniz" })
    .int()
    .min(1900)
    .max(CURRENT_YEAR + 1),
  shippingCost: z
    .number({ invalid_type_error: "Gecerli bir tutar giriniz" })
    .min(0)
    .default(0),
  insuranceCost: z
    .number({ invalid_type_error: "Gecerli bir tutar giriniz" })
    .min(0)
    .default(0),
})

type CalculatorFormValues = z.infer<typeof calculatorSchema>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OriginCountry {
  id: string
  name: string
  code: string
}

interface TaxBreakdownItem {
  name: string
  rate: number | null
  amount: number
  currency: string
}

interface CalculationResult {
  id?: string
  inputs: {
    fobPrice: number
    fobCurrency: string
    shippingCost: number
    insuranceCost: number
    cif: number
    cifUsd: number
  }
  taxes: TaxBreakdownItem[]
  totalTaxes: number
  totalCost: number
  totalCostTry: number
  exchangeRate: number
  vehicleInfo: {
    brand?: string
    model?: string
    year: number
    engineCC: number
    vehicleType: string
    originCountry: string
  }
  createdAt?: string
}

interface ExchangeRateInfo {
  currency: string
  rate: number
  updatedAt: string
}

interface TaxRateInfo {
  name: string
  rate: number
  type: string
}

interface ActiveRates {
  exchangeRates: ExchangeRateInfo[]
  taxRates: TaxRateInfo[]
}

interface HistoryItem {
  id: string
  vehicleInfo: {
    brand?: string
    model?: string
    year: number
    engineCC: number
  }
  inputs: {
    fobPrice: number
    fobCurrency: string
    cifUsd: number
  }
  totalCost: number
  totalCostTry: number
  createdAt: string
  savedToVehicle: boolean
}

interface HistoryPage {
  data: HistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface SaveToVehiclePayload {
  vehicleId: string
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Active tax/exchange rates sidebar card */
function ActiveRatesPanel({ rates }: { rates: ActiveRates | undefined }) {
  if (!rates) return null

  const usdRate = rates.exchangeRates.find((r) => r.currency === "USD")

  return (
    <Card className={CALCULATOR_COLORS.infoCard}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold ${CALCULATOR_COLORS.infoTitle} flex items-center gap-2`}>
          <TrendingUp className="h-4 w-4" />
          Aktif Oranlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className={`text-xs font-medium ${CALCULATOR_COLORS.infoLabel} mb-1.5`}>Doviz Kurlari</p>
          <div className="space-y-1">
            {rates.exchangeRates.map((er) => (
              <div key={er.currency} className="flex justify-between text-xs">
                <span className="text-gray-600">{er.currency}/TL</span>
                <span className="font-semibold tabular-nums text-gray-900">
                  {Number(er.rate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {usdRate && (
          <p className="text-xs text-gray-400">
            Guncelleme: {formatDate(usdRate.updatedAt)}
          </p>
        )}

        <Separator className={CALCULATOR_COLORS.infoSeparator} />

        <div>
          <p className={`text-xs font-medium ${CALCULATOR_COLORS.infoLabel} mb-1.5`}>Vergi Oranlari</p>
          <div className="space-y-1">
            {rates.taxRates.slice(0, 6).map((tr) => (
              <div key={tr.name} className="flex justify-between text-xs">
                <span className="text-gray-600">{tr.name}</span>
                <span className="font-semibold text-gray-900">%{tr.rate}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Result display after calculation */
function CalculationResultPanel({
  result,
  onReset,
  onSaveToVehicle,
}: {
  result: CalculationResult
  onReset: () => void
  onSaveToVehicle: () => void
}) {
  const downloadPdf = async (calcId: string) => {
    try {
      const token = localStorage.getItem('accessToken') ?? ''

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/calculator/${calcId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) throw new Error('PDF indirilemedi')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hesaplama-${calcId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Card 1 — Input values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Giris Degerleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">FOB Fiyati</p>
              <p className="font-semibold text-sm">
                {formatUSD(result.inputs.fobPrice)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">Nakliye</p>
              <p className="font-semibold text-sm">
                {formatUSD(result.inputs.shippingCost)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">Sigorta</p>
              <p className="font-semibold text-sm">
                {formatUSD(result.inputs.insuranceCost)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">CIF (USD)</p>
              <p className={`font-bold tabular-nums text-sm ${CALCULATOR_COLORS.cifValue}`}>
                {formatUSD(result.inputs.cifUsd)}
              </p>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>
              Mense:{" "}
              <strong className="text-gray-700">
                {result.vehicleInfo.originCountry}
              </strong>
            </span>
            <span>
              Motor:{" "}
              <strong className="text-gray-700">
                {result.vehicleInfo.engineCC} cc
              </strong>
            </span>
            <span>
              Tip:{" "}
              <strong className="text-gray-700">
                {result.vehicleInfo.vehicleType === "PASSENGER" ? "Binek" : "Ticari"}
              </strong>
            </span>
            <span>
              Kur:{" "}
              <strong className="tabular-nums text-gray-700">
                1 USD ={" "}
                {Number(result.exchangeRate).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                TL
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 — Tax breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            Vergi Dokumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {result.taxes.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {item.name}
                  {item.rate !== null && (
                    <span className="ml-1.5 text-xs text-gray-400">
                      (%{item.rate})
                    </span>
                  )}
                </span>
                <span className="font-medium tabular-nums">
                  {formatUSD(item.amount)}
                </span>
              </div>
            ))}

            <Separator className="my-2" />

            <div className="flex items-center justify-between font-semibold text-sm">
              <span>Toplam Vergiler</span>
              <span className={`tabular-nums ${CALCULATOR_COLORS.taxTotal}`}>{formatUSD(result.totalTaxes)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Final result + suggested prices */}
      <Card className={CALCULATOR_COLORS.resultCard}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-base font-semibold flex items-center gap-2 ${CALCULATOR_COLORS.resultTitle}`}>
            <Calculator className="h-4 w-4" />
            Toplam Maliyet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div>
              <p className={`text-xs ${CALCULATOR_COLORS.resultLabel} mb-0.5`}>USD</p>
              <p className={`text-2xl font-bold tabular-nums ${CALCULATOR_COLORS.resultValue}`}>
                {formatUSD(result.totalCost)}
              </p>
            </div>
            <ChevronRight className={`hidden sm:block h-5 w-5 ${CALCULATOR_COLORS.chevronRight} mb-1.5`} />
            <div>
              <p className={`text-xs ${CALCULATOR_COLORS.resultLabel} mb-0.5`}>TL</p>
              <p className={`text-2xl font-bold tabular-nums ${CALCULATOR_COLORS.resultValue}`}>
                {formatTRY(result.totalCostTry)}
              </p>
            </div>
          </div>

          <Separator className={CALCULATOR_COLORS.resultSeparator} />

          <div>
            <p className={`text-xs font-medium ${CALCULATOR_COLORS.resultLabel} mb-2`}>
              Onerilen Satis Fiyatlari
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PROFIT_MARGINS.map((m) => (
                <div
                  key={m.rate}
                  className={`rounded-lg border ${CALCULATOR_COLORS.resultBorder} bg-white p-2.5 text-center`}
                >
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className="font-bold text-xs sm:text-sm tabular-nums">
                    {formatUSD(result.totalCost * (1 + m.rate))}
                  </p>
                  <p className="text-xs text-gray-400 tabular-nums mt-0.5">
                    {formatTRY(result.totalCostTry * (1 + m.rate))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!result.id}
          onClick={() => {
            if (result.id) {
              downloadPdf(result.id)
            }
          }}
        >
          <Download className="h-4 w-4" />
          PDF Indir
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSaveToVehicle}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Araca Kaydet
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-2 ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Yeni Hesaplama
        </Button>
      </div>
    </div>
  )
}

/** History item detail modal */
function HistoryDetailModal({
  item,
  open,
  onClose,
}: {
  item: HistoryItem | null
  open: boolean
  onClose: () => void
}) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hesaplama Detayi</DialogTitle>
          <DialogDescription>
            {formatDate(item.createdAt)} tarihinde yapilan hesaplama
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Arac</p>
              <p className="font-medium">
                {item.vehicleInfo.brand ?? "-"} {item.vehicleInfo.model ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Motor Hacmi</p>
              <p className="font-medium">{item.vehicleInfo.engineCC} cc</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">FOB Fiyati</p>
              <p className="font-medium">{formatUSD(item.inputs.fobPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CIF (USD)</p>
              <p className="font-medium">{formatUSD(item.inputs.cifUsd)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Toplam Maliyet (USD)</p>
              <p className={`text-lg font-bold tabular-nums ${CALCULATOR_COLORS.totalCostValue}`}>
                {formatUSD(item.totalCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Toplam Maliyet (TL)</p>
              <p className={`text-lg font-bold tabular-nums ${CALCULATOR_COLORS.totalCostValue}`}>
                {formatTRY(item.totalCostTry)}
              </p>
            </div>
          </div>

          {item.savedToVehicle && (
            <Badge className={CALCULATOR_COLORS.savedBadge}>
              Araca Kaydedildi
            </Badge>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Save-to-vehicle dialog */
function SaveToVehicleDialog({
  calculationId,
  open,
  onClose,
}: {
  calculationId: string | undefined
  open: boolean
  onClose: () => void
}) {
  const [vehicleId, setVehicleId] = React.useState("")
  const { toast } = useToast()

  const endpoint = calculationId
    ? `/calculator/${calculationId}/save-to-vehicle`
    : "/calculator/save-to-vehicle"

  const saveMutation = useApiMutation<unknown, SaveToVehiclePayload>(
    endpoint,
    "post",
    {
      onSuccess: () => {
        onClose()
        setVehicleId("")
      },
    }
  )

  const handleSave = () => {
    if (!vehicleId.trim()) {
      toast({
        title: "Hata",
        description: "Lutfen bir arac ID'si giriniz.",
        variant: "destructive",
      })
      return
    }
    saveMutation.mutate({ vehicleId: vehicleId.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Araca Kaydet</DialogTitle>
          <DialogDescription>
            Hesaplama sonucunu kaydetmek istediginiz aracin ID&apos;sini giriniz.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Input
            placeholder="Arac ID"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saveMutation.isPending}
          >
            Iptal
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Calculation form — uses register/setValue/watch/errors pattern (project convention)
// ---------------------------------------------------------------------------

function CalculationForm({
  countries,
  isPending,
  onSubmit,
}: {
  countries: OriginCountry[]
  isPending: boolean
  onSubmit: (values: CalculatorFormValues) => void
}) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      fobCurrency: "USD",
      vehicleType: "PASSENGER",
      shippingCost: 0,
      insuranceCost: 0,
    },
  })

  const fobCurrency = watch("fobCurrency")
  const vehicleType = watch("vehicleType")
  const originCountryId = watch("originCountryId")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Arac Bilgileri</CardTitle>
        <CardDescription>
          Hesaplama icin arac ve fiyat bilgilerini giriniz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* FOB + Currency */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="fobPrice">FOB Fiyati *</Label>
              <Input
                id="fobPrice"
                type="number"
                placeholder="6000"
                step="0.01"
                min="0"
                disabled={isPending}
                {...register("fobPrice", { valueAsNumber: true })}
              />
              {errors.fobPrice && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.fobPrice.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fobCurrency">Para Birimi</Label>
              <Select
                value={fobCurrency}
                onValueChange={(val) =>
                  setValue("fobCurrency", val, { shouldValidate: true })
                }
                disabled={isPending}
              >
                <SelectTrigger id="fobCurrency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shipping + Insurance */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shippingCost">Nakliye Ucreti (USD)</Label>
              <Input
                id="shippingCost"
                type="number"
                placeholder="600"
                step="0.01"
                min="0"
                disabled={isPending}
                {...register("shippingCost", { valueAsNumber: true })}
              />
              {errors.shippingCost && (
                <p className={`text-xs ${FORM_COLORS.error}`}>
                  {errors.shippingCost.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="insuranceCost">Sigorta Ucreti (USD)</Label>
              <Input
                id="insuranceCost"
                type="number"
                placeholder="100"
                step="0.01"
                min="0"
                disabled={isPending}
                {...register("insuranceCost", { valueAsNumber: true })}
              />
              {errors.insuranceCost && (
                <p className={`text-xs ${FORM_COLORS.error}`}>
                  {errors.insuranceCost.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Origin country + Vehicle type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="originCountryId">Mense Ulke *</Label>
              <Select
                value={originCountryId ?? ""}
                onValueChange={(val) =>
                  setValue("originCountryId", val, { shouldValidate: true })
                }
                disabled={isPending}
              >
                <SelectTrigger id="originCountryId">
                  <SelectValue placeholder="Ulke secin..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.originCountryId && (
                <p className={`text-xs ${FORM_COLORS.error}`}>
                  {errors.originCountryId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vehicleType">Arac Tipi *</Label>
              <Select
                value={vehicleType}
                onValueChange={(val) =>
                  setValue("vehicleType", val as "PASSENGER" | "COMMERCIAL", {
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger id="vehicleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleType && (
                <p className={`text-xs ${FORM_COLORS.error}`}>
                  {errors.vehicleType.message}
                </p>
              )}
            </div>
          </div>

          {/* Engine CC + Model year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="engineCC">Motor Hacmi (cc) *</Label>
              <Input
                id="engineCC"
                type="number"
                placeholder="1600"
                min="1"
                max="20000"
                disabled={isPending}
                {...register("engineCC", { valueAsNumber: true })}
              />
              {errors.engineCC && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.engineCC.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modelYear">Model Yili *</Label>
              <Input
                id="modelYear"
                type="number"
                placeholder={String(CURRENT_YEAR)}
                min="1900"
                max={CURRENT_YEAR + 1}
                disabled={isPending}
                {...register("modelYear", { valueAsNumber: true })}
              />
              {errors.modelYear && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.modelYear.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hesaplaniyor...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Hesapla
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CalculatorPage() {
  // ---- State
  const [activeTab, setActiveTab] = React.useState("new")
  const [calculationResult, setCalculationResult] =
    React.useState<CalculationResult | null>(null)
  const [historyPage, setHistoryPage] = React.useState(1)
  const [selectedHistoryItem, setSelectedHistoryItem] =
    React.useState<HistoryItem | null>(null)
  const [historyDetailOpen, setHistoryDetailOpen] = React.useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)

  // ---- API queries
  const { data: activeRatesRaw, isError: ratesError, refetch: refetchRates } = useApiQuery<ActiveRates>(
    ["calculator", "rates"],
    "/calculator/rates"
  )
  const activeRates = activeRatesRaw as ActiveRates | undefined

  const { data: countriesRaw, isError: countriesError, refetch: refetchCountries } = useApiQuery<OriginCountry[]>(
    ["countries", "active"],
    "/countries/active"
  )
  const countries = (countriesRaw as OriginCountry[] | undefined) ?? []

  // History query — enabled only when history tab is active
  const { data: historyDataRaw, isLoading: historyLoading } =
    useApiQuery<HistoryPage>(
      ["calculator", "history", String(historyPage)],
      "/calculator/history",
      { page: historyPage, limit: PAGE_SIZE },
      { enabled: activeTab === "history" }
    )
  const historyData = historyDataRaw as HistoryPage | undefined

  const historyItems: HistoryItem[] = historyData?.data ?? []
  const historyPagination = historyData?.pagination

  // ---- Calculate mutation
  const calculateMutation = useApiMutation<CalculationResult, CalculatorFormValues>(
    "/calculator/calculate",
    "post",
    {
      onSuccess: (response) => {
        setCalculationResult(response.data)
      },
    }
  )

  // ---- Handlers
  const handleSubmit = (values: CalculatorFormValues) => {
    setCalculationResult(null)
    calculateMutation.mutate(values)
  }

  const handleReset = () => {
    setCalculationResult(null)
  }

  const handleHistoryRowClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item)
    setHistoryDetailOpen(true)
  }

  // ---- History table columns
  const historyColumns: Column<HistoryItem>[] = [
    {
      key: "createdAt",
      label: "Tarih",
      render: (_v, row) => (
        <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "vehicleInfo",
      label: "Arac",
      render: (_v, row) => (
        <div className="text-sm">
          <p className="font-medium">
            {row.vehicleInfo.brand ?? "-"} {row.vehicleInfo.model ?? ""}
          </p>
          <p className="text-xs text-gray-400">
            {row.vehicleInfo.year} / {row.vehicleInfo.engineCC} cc
          </p>
        </div>
      ),
    },
    {
      key: "inputs",
      label: "FOB / CIF",
      render: (_v, row) => (
        <div className="text-sm tabular-nums">
          <p>{formatUSD(row.inputs.fobPrice)}</p>
          <p className="text-xs text-gray-400">
            CIF: {formatUSD(row.inputs.cifUsd)}
          </p>
        </div>
      ),
    },
    {
      key: "totalCost",
      label: "Toplam Maliyet",
      render: (_v, row) => (
        <div className="text-sm tabular-nums">
          <p className={`font-semibold ${CALCULATOR_COLORS.totalCostValue}`}>{formatUSD(row.totalCost)}</p>
          <p className="text-xs text-gray-400">{formatTRY(row.totalCostTry)}</p>
        </div>
      ),
    },
    {
      key: "savedToVehicle",
      label: "Durum",
      render: (_v, row) =>
        row.savedToVehicle ? (
          <Badge className={`${CALCULATOR_COLORS.savedBadge} text-xs`}>
            Kaydedildi
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Taslak
          </Badge>
        ),
    },
    {
      key: "id",
      label: "Detay",
      render: (_v, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHistoryRowClick(row)}
          className="text-xs h-7"
        >
          Goruntule
        </Button>
      ),
    },
  ]

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (ratesError || countriesError) {
    return (
      <ErrorState
        message="Vergi oranları ve döviz kurları yüklenirken hata oluştu."
        onRetry={() => { refetchRates(); refetchCountries() }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Ithalat Maliyet Hesaplayici</h1>
        <p className="text-sm text-gray-500">
          KKTC gumruk vergilerini hesaplayin ve araca kaydedin
        </p>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new" className="gap-2">
            <Calculator className="h-4 w-4" />
            Yeni Hesaplama
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Hesaplama Gecmisi
          </TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------------------- */}
        {/* TAB: New calculation                                               */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="new" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left / main column */}
            <div className="lg:col-span-2 space-y-6">
              {!calculationResult ? (
                <CalculationForm
                  countries={countries}
                  isPending={calculateMutation.isPending}
                  onSubmit={handleSubmit}
                />
              ) : (
                <CalculationResultPanel
                  result={calculationResult}
                  onReset={handleReset}
                  onSaveToVehicle={() => setSaveDialogOpen(true)}
                />
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <ActiveRatesPanel rates={activeRates} />

              {/* FIF reference table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    FIF Oranlari Referans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-xs">
                    {FIF_RANGES.map((row) => (
                      <div
                        key={row.range}
                        className="flex justify-between text-gray-600"
                      >
                        <span>{row.range}</span>
                        <span className="font-semibold">{row.rate}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* TAB: History                                                       */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hesaplama Gecmisi</CardTitle>
              <CardDescription>
                Daha once yapilan hesaplamalari goruntuleyin ve detay alin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable<HistoryItem>
                columns={historyColumns}
                data={historyItems}
                isLoading={historyLoading}
                rowKey="id"
                pagination={
                  historyPagination
                    ? {
                        page: historyPagination.page,
                        pageSize: PAGE_SIZE,
                        total: historyPagination.total,
                      }
                    : undefined
                }
                onPageChange={setHistoryPage}
                emptyState={{ icon: Calculator, title: "Henüz hesaplama yapılmamış", description: "İthalat maliyet hesaplayıcısını kullanarak başlayın." }}
                mobileCard={(row) => (
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">
                          {row.vehicleInfo.brand ?? "-"} {row.vehicleInfo.model ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.vehicleInfo.year} / {row.vehicleInfo.engineCC} cc
                        </p>
                      </div>
                      {row.savedToVehicle ? (
                        <Badge className={`${CALCULATOR_COLORS.savedBadge} text-xs`}>
                          Kaydedildi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Taslak
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        FOB:{" "}
                        <span className="font-mono font-semibold text-foreground tabular-nums">
                          {formatUSD(row.inputs.fobPrice)}
                        </span>
                      </span>
                      <span>
                        CIF:{" "}
                        <span className="font-mono text-foreground tabular-nums">
                          {formatUSD(row.inputs.cifUsd)}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs tabular-nums">
                      <span className={`font-bold ${CALCULATOR_COLORS.totalCostValue}`}>
                        {formatUSD(row.totalCost)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {formatTRY(row.totalCostTry)}
                      </span>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SaveToVehicleDialog
        calculationId={calculationResult?.id}
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
      />

      <HistoryDetailModal
        item={selectedHistoryItem}
        open={historyDetailOpen}
        onClose={() => {
          setHistoryDetailOpen(false)
          setSelectedHistoryItem(null)
        }}
      />
    </div>
  )
}
