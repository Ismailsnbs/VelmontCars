"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Eye,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Car,
  User,
  Loader2,
  Calendar,
} from "lucide-react"

import api from "@/lib/api"
import { SEMANTIC_COLORS, FORM_COLORS, ACTION_COLORS, LOADER_COLORS } from "@/lib/design-tokens"
import { useToast } from "@/components/ui/use-toast"
import { ErrorState } from "@/components/ui/error-state"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ---- Constants

const PAGE_SIZE = 20

const PAYMENT_METHODS = [
  { value: "CASH", label: "Nakit" },
  { value: "BANK_TRANSFER", label: "Banka Transferi" },
  { value: "CREDIT_CARD", label: "Kredi Kartı" },
  { value: "INSTALLMENT", label: "Taksit" },
  { value: "OTHER", label: "Diğer" },
] as const

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Nakit",
  BANK_TRANSFER: "Banka Transferi",
  CREDIT_CARD: "Kredi Kartı",
  INSTALLMENT: "Taksit",
  OTHER: "Diğer",
}

// ---- Zod Schemas

const saleFormSchema = z.object({
  vehicleId: z.string().min(1, "Araç seçimi zorunlu"),
  customerId: z.string().min(1, "Müşteri seçimi zorunlu"),
  salePrice: z.number().positive("Satış fiyatı pozitif olmalı"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "INSTALLMENT", "OTHER"]),
  saleDate: z.string().min(1, "Satış tarihi zorunlu"),
  notes: z.string().optional(),
})

type SaleFormValues = z.infer<typeof saleFormSchema>

// ---- Types

interface VehicleForSale {
  id: string
  brand: string
  model: string
  year: number
  fobPrice: number
  totalCost: number | null
  purchasePrice?: number
}

interface CustomerForSale {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

interface SaleVehicle {
  id: string
  brand: string
  model: string
  year: number
  color?: string | null
  vin?: string | null
  engineCC?: number | null
  fuelType?: string | null
  transmission?: string | null
  images: Array<{ url: string }>
}

interface SaleCustomer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  identityNo?: string | null
  address?: string | null
}

interface Sale {
  id: string
  vehicleId: string
  customerId: string
  galleryId: string
  salePrice: number
  totalCost: number
  profit: number
  profitMargin: number
  paymentType: string
  saleDate: string
  notes?: string | null
  createdAt: string
  vehicle: SaleVehicle
  customer: SaleCustomer
}

interface SaleStats {
  totalSales: number
  totalRevenue: number
  totalProfit: number
  averageProfitMargin: number
  currentMonthSales: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ---- Helpers

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr))
}

function getTodayString(): string {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, "0")
  const dd = String(today.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// ---- New Sale Dialog

interface NewSaleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function NewSaleDialog({ open, onClose, onSuccess }: NewSaleDialogProps) {
  const { toast } = useToast()

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      vehicleId: "",
      customerId: "",
      salePrice: 0,
      paymentMethod: "CASH",
      saleDate: getTodayString(),
      notes: "",
    },
  })

  const vehicleId = watch("vehicleId")
  const customerId = watch("customerId")
  const paymentMethod = watch("paymentMethod")

  // Fetch IN_STOCK vehicles
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles-for-sale"],
    queryFn: async (): Promise<{ data: VehicleForSale[] }> => {
      const { data } = await api.get("/vehicles", {
        params: { status: "IN_STOCK", limit: 100 },
      })
      return data
    },
    enabled: open,
    staleTime: 30_000,
  })

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-for-sale"],
    queryFn: async (): Promise<{ data: CustomerForSale[] }> => {
      const { data } = await api.get("/customers", {
        params: { limit: 100 },
      })
      return data
    },
    enabled: open,
    staleTime: 30_000,
  })

  const vehicles = vehiclesData?.data ?? []
  const customers = customersData?.data ?? []

  const createMutation = useMutation({
    mutationFn: async (values: SaleFormValues) => {
      const { data } = await api.post("/sales", values)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Satış oluşturuldu",
        description: "Satış başarıyla kaydedildi.",
        variant: "default",
      })
      reset()
      onClose()
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Satış oluşturulamadı.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (values: SaleFormValues) => {
    createMutation.mutate(values)
  }

  React.useEffect(() => {
    if (!open) {
      reset({
        vehicleId: "",
        customerId: "",
        salePrice: 0,
        paymentMethod: "CASH",
        saleDate: getTodayString(),
        notes: "",
      })
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Satış</DialogTitle>
          <DialogDescription>
            Araç satışı oluşturun. Kar otomatik hesaplanacaktır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Vehicle */}
          <div className="space-y-1.5">
            <Label htmlFor="vehicleId">Araç *</Label>
            <Select
              value={vehicleId}
              onValueChange={(val) =>
                setValue("vehicleId", val, { shouldValidate: true })
              }
              disabled={isSubmitting || vehiclesLoading}
            >
              <SelectTrigger id="vehicleId">
                <SelectValue placeholder={vehiclesLoading ? "Yükleniyor..." : "Araç seçin"} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    Stokta araç bulunmuyor
                  </SelectItem>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.year}) —{" "}
                      <span className="tabular-nums">{formatUSD(Number(vehicle.totalCost ?? vehicle.fobPrice))}</span> maliyet
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.vehicleId && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.vehicleId.message}</p>
            )}
          </div>

          {/* Customer */}
          <div className="space-y-1.5">
            <Label htmlFor="customerId">Müşteri *</Label>
            <Select
              value={customerId}
              onValueChange={(val) =>
                setValue("customerId", val, { shouldValidate: true })
              }
              disabled={isSubmitting || customersLoading}
            >
              <SelectTrigger id="customerId">
                <SelectValue placeholder={customersLoading ? "Yükleniyor..." : "Müşteri seçin"} />
              </SelectTrigger>
              <SelectContent>
                {customers.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    Müşteri bulunamadı
                  </SelectItem>
                ) : (
                  customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.customerId.message}</p>
            )}
          </div>

          {/* Sale Price */}
          <div className="space-y-1.5">
            <Label htmlFor="salePrice">Satış Fiyatı ($) *</Label>
            <Input
              id="salePrice"
              type="number"
              placeholder="0"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              {...register("salePrice", { valueAsNumber: true })}
            />
            {errors.salePrice && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.salePrice.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Ödeme Yöntemi *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(val) =>
                setValue("paymentMethod", val as SaleFormValues["paymentMethod"], {
                  shouldValidate: true,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Sale Date */}
          <div className="space-y-1.5">
            <Label htmlFor="saleDate">Satış Tarihi *</Label>
            <Input
              id="saleDate"
              type="date"
              disabled={isSubmitting}
              {...register("saleDate")}
            />
            {errors.saleDate && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.saleDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Satış hakkında notlar (opsiyonel)"
              rows={2}
              disabled={isSubmitting}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Satışı Oluştur"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---- Sale Detail Dialog

interface SaleDetailDialogProps {
  open: boolean
  onClose: () => void
  saleId: string | null
}

function SaleDetailDialog({ open, onClose, saleId }: SaleDetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["sale-detail", saleId],
    queryFn: async (): Promise<{ data: Sale }> => {
      const { data } = await api.get(`/sales/${saleId}`)
      return data
    },
    enabled: open && !!saleId,
    staleTime: 30_000,
  })

  const sale = data?.data

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Satış Detayı</DialogTitle>
          <DialogDescription>
            Satış bilgileri ve müşteri / araç detayları
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`h-6 w-6 animate-spin ${LOADER_COLORS.muted}`} />
          </div>
        ) : sale ? (
          <div className="space-y-5">
            {/* Vehicle Info */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Car className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm">Araç Bilgileri</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Marka / Model</span>
                <span className="font-medium">
                  {sale.vehicle.brand} {sale.vehicle.model}
                </span>
                <span className="text-gray-500">Yıl</span>
                <span>{sale.vehicle.year}</span>
                {sale.vehicle.vin && (
                  <>
                    <span className="text-gray-500">VIN</span>
                    <span className="font-mono text-xs">{sale.vehicle.vin}</span>
                  </>
                )}
                {sale.vehicle.color && (
                  <>
                    <span className="text-gray-500">Renk</span>
                    <span>{sale.vehicle.color}</span>
                  </>
                )}
                {sale.vehicle.engineCC && (
                  <>
                    <span className="text-gray-500">Motor Hacmi</span>
                    <span>{sale.vehicle.engineCC} cc</span>
                  </>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm">Müşteri Bilgileri</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Ad Soyad</span>
                <span className="font-medium">{sale.customer.name}</span>
                {sale.customer.phone && (
                  <>
                    <span className="text-gray-500">Telefon</span>
                    <span>{sale.customer.phone}</span>
                  </>
                )}
                {sale.customer.email && (
                  <>
                    <span className="text-gray-500">E-posta</span>
                    <span>{sale.customer.email}</span>
                  </>
                )}
                {sale.customer.identityNo && (
                  <>
                    <span className="text-gray-500">TC Kimlik</span>
                    <span>{sale.customer.identityNo}</span>
                  </>
                )}
                {sale.customer.address && (
                  <>
                    <span className="text-gray-500">Adres</span>
                    <span>{sale.customer.address}</span>
                  </>
                )}
              </div>
            </div>

            {/* Financial Info */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-sm">Finansal Bilgiler</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Satış Fiyatı</span>
                <span className="font-bold tabular-nums text-base">{formatUSD(Number(sale.salePrice))}</span>
                <span className="text-gray-500">Toplam Maliyet</span>
                <span className="tabular-nums">{formatUSD(Number(sale.totalCost))}</span>
                <span className="text-gray-500">Kar</span>
                <span
                  className={`font-semibold tabular-nums flex items-center gap-1 ${
                    Number(sale.profit) >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                  }`}
                >
                  {Number(sale.profit) >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatUSD(Number(sale.profit))}
                </span>
                <span className="text-gray-500">Kar Marjı</span>
                <Badge
                  variant={Number(sale.profitMargin) >= 0 ? "default" : "destructive"}
                  className="w-fit tabular-nums"
                >
                  %{Number(sale.profitMargin).toFixed(1)}
                </Badge>
                <span className="text-gray-500">Ödeme Yöntemi</span>
                <span>{PAYMENT_LABELS[sale.paymentType] ?? sale.paymentType}</span>
                <span className="text-gray-500">Satış Tarihi</span>
                <span>{formatDate(sale.saleDate)}</span>
              </div>
              {sale.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">Notlar</p>
                  <p className="text-sm">{sale.notes}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Satış bulunamadı.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Cancel Sale Dialog

interface CancelSaleDialogProps {
  open: boolean
  onClose: () => void
  sale: Sale | null
  onConfirm: () => void
  isLoading: boolean
}

function CancelSaleDialog({
  open,
  onClose,
  sale,
  onConfirm,
  isLoading,
}: CancelSaleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Satışı İptal Et</AlertDialogTitle>
          <AlertDialogDescription>
            {sale && (
              <>
                <strong>
                  {sale.vehicle.brand} {sale.vehicle.model} ({sale.vehicle.year})
                </strong>{" "}
                aracının satışını iptal etmek istediğinize emin misiniz?
                <br />
                <br />
                Bu işlem geri alınamaz. Araç tekrar stoka alınacaktır.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogCancel disabled={isLoading}>Vazgeç</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isLoading}
          className={ACTION_COLORS.destructiveBtn}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              İptal ediliyor...
            </>
          ) : (
            "Satışı İptal Et"
          )}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---- Main Page

export default function SalesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ---- State
  const [page, setPage] = React.useState(1)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  const [newSaleOpen, setNewSaleOpen] = React.useState(false)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedSaleId, setSelectedSaleId] = React.useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false)
  const [cancelingSale, setCancelingSale] = React.useState<Sale | null>(null)

  // ---- Query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    return params
  }, [page, startDate, endDate])

  // ---- Fetch sales
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["sales", queryParams],
    queryFn: async (): Promise<PaginatedResponse<Sale>> => {
      const { data } = await api.get<PaginatedResponse<Sale>>("/sales", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const sales = response?.data ?? []
  const pagination = response?.pagination

  // ---- Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["sales", "stats"],
    queryFn: async (): Promise<{ data: SaleStats }> => {
      const { data } = await api.get("/sales/stats")
      return data
    },
    staleTime: 60_000,
  })

  const stats = statsData?.data

  // ---- Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/sales/${id}/cancel`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Satış iptal edildi",
        description: "Araç tekrar stoka alındı.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      setCancelDialogOpen(false)
      setCancelingSale(null)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Satış iptal edilemedi.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns
  const columns: Column<Sale>[] = [
    {
      key: "vehicleId",
      label: "Araç",
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {row.vehicle.brand} {row.vehicle.model}
          </span>
          <span className="text-xs text-gray-500">{row.vehicle.year}</span>
        </div>
      ),
    },
    {
      key: "customerId",
      label: "Müşteri",
      render: (_v, row) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.customer.name}</span>
          {row.customer.phone && (
            <span className="text-xs text-gray-500">{row.customer.phone}</span>
          )}
        </div>
      ),
    },
    {
      key: "salePrice",
      label: "Satış Fiyatı",
      render: (_v, row) => (
        <span className="text-sm font-semibold tabular-nums">{formatUSD(Number(row.salePrice))}</span>
      ),
    },
    {
      key: "totalCost",
      label: "Maliyet",
      render: (_v, row) => (
        <span className="text-sm tabular-nums text-gray-600">{formatUSD(Number(row.totalCost))}</span>
      ),
    },
    {
      key: "profit",
      label: "Kar",
      render: (_v, row) => {
        const profit = Number(row.profit)
        return (
          <span
            className={`text-sm font-semibold tabular-nums flex items-center gap-1 ${
              profit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
            }`}
          >
            {profit >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {formatUSD(profit)}
          </span>
        )
      },
    },
    {
      key: "profitMargin",
      label: "Kar Marjı",
      render: (_v, row) => {
        const margin = Number(row.profitMargin)
        return (
          <Badge variant={margin >= 0 ? "default" : "destructive"} className="tabular-nums">
            %{margin.toFixed(1)}
          </Badge>
        )
      },
    },
    {
      key: "paymentType",
      label: "Ödeme",
      render: (_v, row) => (
        <Badge variant="outline">
          {PAYMENT_LABELS[row.paymentType] ?? row.paymentType}
        </Badge>
      ),
    },
    {
      key: "saleDate",
      label: "Tarih",
      render: (_v, row) => (
        <span className="text-sm text-gray-600">{formatDate(row.saleDate)}</span>
      ),
    },
    {
      key: "id",
      label: "İşlemler",
      render: (_v, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedSaleId(row.id)
              setDetailOpen(true)
            }}
            title="Detayları Görüntüle"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={ACTION_COLORS.destructiveGhost}
            onClick={() => {
              setCancelingSale(row)
              setCancelDialogOpen(true)
            }}
            title="Satışı İptal Et"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // ---- Handlers
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["sales"] })
  }

  const handleCancelConfirm = () => {
    if (cancelingSale) {
      cancelMutation.mutate(cancelingSale.id)
    }
  }

  const handleClearFilters = () => {
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  if (isError) {
    return (
      <ErrorState
        message="Satış verileri yüklenirken hata oluştu."
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satış Yönetimi</h1>
          <p className="text-sm text-gray-500">Araç satışlarını takip edin ve yönetin</p>
        </div>
        <Button onClick={() => setNewSaleOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Satış
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Satış
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.totalSales}</span>
                <ShoppingCart className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bu Ay Satış
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.currentMonthSales}</span>
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Gelir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold tabular-nums ${SEMANTIC_COLORS.link}`}>
                {formatUSD(stats.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Kar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tabular-nums flex items-center gap-1 ${
                  stats.totalProfit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                }`}
              >
                {stats.totalProfit >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {formatUSD(stats.totalProfit)}
              </div>
              <p className="text-xs tabular-nums text-gray-500 mt-1">
                Ort. Marj: %{stats.averageProfitMargin.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="startDate" className="text-sm whitespace-nowrap">
            Başlangıç:
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
            className="w-[160px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="endDate" className="text-sm whitespace-nowrap">
            Bitiş:
          </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
            className="w-[160px]"
          />
        </div>

        {(startDate || endDate) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={sales}
          isLoading={isLoading}
          rowKey="id"
          pagination={
            pagination
              ? {
                  page: pagination.page,
                  pageSize: PAGE_SIZE,
                  total: pagination.total,
                }
              : undefined
          }
          onPageChange={setPage}
          emptyState={{
            icon: ShoppingCart,
            title: "Henüz satış kaydı yok",
            description: "Yeni satış kaydı oluşturarak başlayın.",
            action: (
              <Button onClick={() => setNewSaleOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Satış
              </Button>
            ),
          }}
          mobileCard={(row) => {
            const profit = Number(row.profit)
            const margin = Number(row.profitMargin)
            return (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {row.vehicle.brand} {row.vehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">{row.vehicle.year}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSaleId(row.id)
                        setDetailOpen(true)
                      }}
                      title="Detayları Görüntüle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={ACTION_COLORS.destructiveGhost}
                      onClick={() => {
                        setCancelingSale(row)
                        setCancelDialogOpen(true)
                      }}
                      title="Satışı İptal Et"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  {row.customer.name}
                  {row.customer.phone && ` — ${row.customer.phone}`}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Satış Fiyatı</span>
                  <span className="font-semibold tabular-nums">{formatUSD(Number(row.salePrice))}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Kar</span>
                  <span
                    className={`font-semibold tabular-nums flex items-center gap-1 ${
                      profit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                    }`}
                  >
                    {profit >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {formatUSD(profit)}
                    <Badge
                      variant={margin >= 0 ? "default" : "destructive"}
                      className="ml-1"
                    >
                      %{margin.toFixed(1)}
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(row.saleDate)}
                  </span>
                  <Badge variant="outline">
                    {PAYMENT_LABELS[row.paymentType] ?? row.paymentType}
                  </Badge>
                </div>
              </div>
            )
          }}
        />
      </div>

      {/* Dialogs */}
      <NewSaleDialog
        open={newSaleOpen}
        onClose={() => setNewSaleOpen(false)}
        onSuccess={handleRefresh}
      />

      <SaleDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedSaleId(null)
        }}
        saleId={selectedSaleId}
      />

      <CancelSaleDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false)
          setCancelingSale(null)
        }}
        sale={cancelingSale}
        onConfirm={handleCancelConfirm}
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}
