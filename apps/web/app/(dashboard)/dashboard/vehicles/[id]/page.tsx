"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Edit,
  Trash2,
  PackageCheck,
  Tag,
  Car,
  Globe,
  Calculator,
  ShoppingBag,
  Image,
  FileText,
  Receipt,
  History,
} from "lucide-react"
import api from "@/lib/api"
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS as TOKEN_STATUS_LABELS,
  SEMANTIC_COLORS,
  ACTION_COLORS,
  VEHICLE_ACTION_COLORS,
} from "@/lib/design-tokens"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/shared/data-table"
import { VehicleImageSection } from "@/components/vehicles/vehicle-image-section"

// ---- Types ---------------------------------------------------------------

interface OriginCountry {
  id: string
  name: string
  code: string
}

interface VehicleImage {
  id: string
  url: string
  isMain: boolean
  order: number
}

interface VehicleDocument {
  id: string
  type: string
  fileName: string
  url: string
  uploadedAt: string
}

interface VehicleExpense {
  id: string
  type: string
  amount: number
  currency: string
  description: string | null
  date: string
}

interface ImportCalculation {
  id: string
  cifValue: number
  customsDuty: number
  fif: number
  kdv: number
  gkk: number
  rihtim: number
  genelFif: number
  bandrol: number
  totalImportCost: number
  currency: string
  calculatedAt: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  engineCC: number
  bodyType: string | null
  color: string | null
  vin: string | null
  mileage: number | null
  fuelType: string | null
  transmission: string | null
  originCountry: OriginCountry
  fobPrice: number
  fobCurrency: string
  shippingCost: number | null
  insuranceCost: number | null
  cifValue: number | null
  customsDuty: number | null
  fif: number | null
  kdv: number | null
  gkk: number | null
  totalImportCost: number | null
  additionalExpenses: number | null
  totalCost: number | null
  salePrice: number | null
  profit: number | null
  profitMargin: number | null
  status: "TRANSIT" | "IN_STOCK" | "RESERVED" | "SOLD"
  estimatedArrival: string | null
  description: string | null
  images: VehicleImage[]
  documents: VehicleDocument[]
  expenses: VehicleExpense[]
  importCalculations: ImportCalculation[]
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ---- Constants -----------------------------------------------------------

const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINE: "Benzin",
  DIESEL: "Dizel",
  HYBRID: "Hibrit",
  ELECTRIC: "Elektrik",
  LPG: "LPG",
}

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manuel",
  AUTOMATIC: "Otomatik",
  CVT: "CVT",
}

// ---- Helpers -------------------------------------------------------------

function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value == null) return "-"
  return (
    value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " " +
    currency
  )
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("tr-TR")
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  return new Date(value).toLocaleString("tr-TR")
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    return resp?.data?.message ?? "Bir hata oluştu"
  }
  if (error instanceof Error) return error.message
  return "Bir hata oluştu"
}

// ---- Info Row Helper -------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{value ?? "-"}</p>
    </div>
  )
}

// ---- Component -----------------------------------------------------------

export default function VehicleDetailPage() {
  const params = useParams()
  const vehicleId = params.id as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "images")

  const {
    data: vehicle,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Vehicle>>(`/vehicles/${vehicleId}`)
      return data.data
    },
    enabled: Boolean(vehicleId),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/vehicles/${vehicleId}`)
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Araç silindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      router.push("/dashboard/vehicles")
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })

  const statusChangeMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { data } = await api.put<ApiResponse<Vehicle>>(`/vehicles/${vehicleId}`, {
        status: newStatus,
      })
      return data
    },
    onSuccess: (_, newStatus) => {
      toast({
        title: "Başarılı",
        description: `Araç durumu güncellendi: ${TOKEN_STATUS_LABELS[newStatus as keyof typeof TOKEN_STATUS_LABELS] ?? newStatus}`,
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })

  const handleDelete = () => {
    if (window.confirm("Bu aracı silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate()
    }
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/vehicles">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </Link>
        <Card>
          <CardContent className={`pt-6 text-center ${SEMANTIC_COLORS.loss}`}>
            Araç bulunamadı
          </CardContent>
        </Card>
      </div>
    )
  }

  const isActionPending =
    deleteMutation.isPending || statusChangeMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/vehicles">
            <Button variant="outline" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </Button>
          </Link>
          {isLoading ? (
            <Skeleton className="h-9 w-72" />
          ) : vehicle ? (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </h1>
              <Badge className={STATUS_BADGE_CLASSES[vehicle.status as keyof typeof STATUS_BADGE_CLASSES] ?? ""}>
                {TOKEN_STATUS_LABELS[vehicle.status as keyof typeof TOKEN_STATUS_LABELS] ?? vehicle.status}
              </Badge>
            </div>
          ) : null}
        </div>

        {!isLoading && vehicle && (
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/dashboard/vehicles/${vehicleId}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Düzenle
              </Button>
            </Link>

            {vehicle.status === "TRANSIT" && (
              <Button
                variant="outline"
                className={`gap-2 ${VEHICLE_ACTION_COLORS.stockIn}`}
                onClick={() => statusChangeMutation.mutate("IN_STOCK")}
                disabled={isActionPending}
              >
                <PackageCheck className="h-4 w-4" />
                Stoğa Al
              </Button>
            )}

            {vehicle.status === "IN_STOCK" && (
              <Button
                variant="outline"
                className={`gap-2 ${VEHICLE_ACTION_COLORS.reserve}`}
                onClick={() => statusChangeMutation.mutate("RESERVED")}
                disabled={isActionPending}
              >
                <Tag className="h-4 w-4" />
                Satışa Çıkar
              </Button>
            )}

            <Button
              variant="outline"
              className={`gap-2 ${ACTION_COLORS.destructiveOutline}`}
              onClick={handleDelete}
              disabled={isActionPending}
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </Button>
          </div>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))
            ) : vehicle ? (
              <>
                <InfoRow label="Marka" value={vehicle.brand} />
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Yıl" value={vehicle.year} />
                <InfoRow
                  label="Motor Hacmi"
                  value={vehicle.engineCC ? `${vehicle.engineCC} cc` : null}
                />
                <InfoRow label="Renk" value={vehicle.color} />
                <InfoRow label="Şasi No" value={vehicle.vin} />
                <InfoRow
                  label="Kilometre"
                  value={
                    vehicle.mileage != null
                      ? vehicle.mileage.toLocaleString("tr-TR") + " km"
                      : null
                  }
                />
                <InfoRow
                  label="Yakıt Tipi"
                  value={
                    vehicle.fuelType
                      ? FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType
                      : null
                  }
                />
                <InfoRow
                  label="Vites"
                  value={
                    vehicle.transmission
                      ? TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission
                      : null
                  }
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Menşe & Fiyat */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Menşe &amp; Fiyat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))
            ) : vehicle ? (
              <>
                <InfoRow
                  label="Menşe Ülke"
                  value={vehicle.originCountry?.name}
                />
                <InfoRow
                  label="FOB Fiyat"
                  value={formatCurrency(vehicle.fobPrice, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="Nakliye"
                  value={formatCurrency(vehicle.shippingCost, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="Sigorta"
                  value={formatCurrency(vehicle.insuranceCost, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="Tahmini Varış"
                  value={formatDate(vehicle.estimatedArrival)}
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Maliyet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              İthalat Maliyeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))
            ) : vehicle ? (
              <>
                <InfoRow
                  label="CIF Değeri"
                  value={formatCurrency(vehicle.cifValue, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="Gümrük Vergisi"
                  value={formatCurrency(vehicle.customsDuty, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="KDV"
                  value={formatCurrency(vehicle.kdv, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="FIF"
                  value={formatCurrency(vehicle.fif, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="GKK"
                  value={formatCurrency(vehicle.gkk, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="Ek Giderler"
                  value={formatCurrency(vehicle.additionalExpenses, vehicle.fobCurrency)}
                />
                <div className="border-t pt-3">
                  <InfoRow
                    label="Toplam İthalat Maliyeti"
                    value={
                      <span className="text-base font-bold text-primary">
                        {formatCurrency(vehicle.totalImportCost, vehicle.fobCurrency)}
                      </span>
                    }
                  />
                </div>
                <InfoRow
                  label="Toplam Maliyet"
                  value={
                    <span className="text-base font-bold">
                      {formatCurrency(vehicle.totalCost, vehicle.fobCurrency)}
                    </span>
                  }
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Satış */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Satış Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))
            ) : vehicle ? (
              <>
                <InfoRow
                  label="Satış Fiyatı"
                  value={formatCurrency(vehicle.salePrice, vehicle.fobCurrency)}
                />
                <InfoRow
                  label="Kar"
                  value={
                    vehicle.profit != null ? (
                      <span
                        className={`${vehicle.profit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss} font-semibold`}
                      >
                        {formatCurrency(vehicle.profit, vehicle.fobCurrency)}
                      </span>
                    ) : null
                  }
                />
                <InfoRow
                  label="Kar Marjı"
                  value={
                    vehicle.profitMargin != null
                      ? `%${vehicle.profitMargin.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : null
                  }
                />
                <InfoRow
                  label="Durum"
                  value={
                    <Badge className={STATUS_BADGE_CLASSES[vehicle.status as keyof typeof STATUS_BADGE_CLASSES] ?? ""}>
                      {TOKEN_STATUS_LABELS[vehicle.status as keyof typeof TOKEN_STATUS_LABELS] ?? vehicle.status}
                    </Badge>
                  }
                />
                {vehicle.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Açıklama</p>
                    <p className="mt-0.5 text-sm">{vehicle.description}</p>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="images" className="gap-2">
                <Image className="h-4 w-4" />
                Görseller
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                Belgeler
              </TabsTrigger>
              <TabsTrigger value="expenses" className="gap-2">
                <Receipt className="h-4 w-4" />
                Giderler
              </TabsTrigger>
              <TabsTrigger value="calculations" className="gap-2">
                <History className="h-4 w-4" />
                Geçmiş
              </TabsTrigger>
            </TabsList>

            {/* Görseller */}
            <TabsContent value="images">
              <VehicleImageSection vehicleId={vehicleId} />
            </TabsContent>

            {/* Belgeler */}
            <TabsContent value="documents">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <DataTable<VehicleDocument>
                  columns={[
                    { key: "type", label: "Tür" },
                    { key: "fileName", label: "Dosya Adı" },
                    {
                      key: "uploadedAt",
                      label: "Yükleme Tarihi",
                      render: (value) =>
                        formatDateTime(value as string | undefined),
                    },
                    {
                      key: "url",
                      label: "İndir",
                      render: (value) => (
                        <a
                          href={value as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          İndir
                        </a>
                      ),
                    },
                  ]}
                  data={vehicle?.documents ?? []}
                  rowKey="id"
                  emptyState={{ icon: FileText, title: "Henüz evrak eklenmemiş", description: "Araç evraklarını buradan yükleyebilirsiniz." }}
                />
              )}
            </TabsContent>

            {/* Giderler */}
            <TabsContent value="expenses">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <DataTable<VehicleExpense>
                  columns={[
                    { key: "type", label: "Tür" },
                    {
                      key: "amount",
                      label: "Tutar",
                      render: (value, row) =>
                        formatCurrency(value as number, row.currency),
                    },
                    {
                      key: "description",
                      label: "Açıklama",
                      render: (value) => (value as string | null) ?? "-",
                    },
                    {
                      key: "date",
                      label: "Tarih",
                      render: (value) => formatDate(value as string | undefined),
                    },
                  ]}
                  data={vehicle?.expenses ?? []}
                  rowKey="id"
                  emptyState={{ icon: Receipt, title: "Henüz gider kaydı yok", description: "Araca ait giderleri buradan ekleyebilirsiniz." }}
                />
              )}
            </TabsContent>

            {/* Hesaplama Geçmişi */}
            <TabsContent value="calculations">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : vehicle?.importCalculations &&
                vehicle.importCalculations.length > 0 ? (
                <div className="space-y-4">
                  {vehicle.importCalculations.map((calc, index) => (
                    <Card key={calc.id} className="border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                          Hesaplama #{index + 1} —{" "}
                          {formatDateTime(calc.calculatedAt)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">CIF</p>
                            <p className="font-medium">
                              {formatCurrency(calc.cifValue, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gümrük</p>
                            <p className="font-medium">
                              {formatCurrency(calc.customsDuty, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">KDV</p>
                            <p className="font-medium">
                              {formatCurrency(calc.kdv, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">FIF</p>
                            <p className="font-medium">
                              {formatCurrency(calc.fif, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">GKK</p>
                            <p className="font-medium">
                              {formatCurrency(calc.gkk, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rıhtım</p>
                            <p className="font-medium">
                              {formatCurrency(calc.rihtim, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Genel FIF</p>
                            <p className="font-medium">
                              {formatCurrency(calc.genelFif, calc.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-semibold">
                              Toplam
                            </p>
                            <p className="font-bold text-primary">
                              {formatCurrency(
                                calc.totalImportCost,
                                calc.currency
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Henüz hesaplama yapılmamış
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
