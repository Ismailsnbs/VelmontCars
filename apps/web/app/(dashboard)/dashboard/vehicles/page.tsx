"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import Image from "next/image"
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Search,
  Car,
} from "lucide-react"
import api from "@/lib/api"
import { MobileFAB } from "@/components/shared/sidebar"
import { useToast } from "@/components/ui/use-toast"
import { ErrorState } from "@/components/ui/error-state"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  STATUS_BADGE_CLASSES,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS as TOKEN_STATUS_LABELS,
  ACTION_COLORS,
  type VehicleStatus,
} from "@/lib/design-tokens"

// ---- Constants

const PAGE_SIZE = 10

const STATUS_TAB_VALUE = [
  { value: "ALL", label: "Tümü" },
  { value: "TRANSIT", label: "Transit" },
  { value: "IN_STOCK", label: "Stokta" },
  { value: "RESERVED", label: "Rezerve" },
  { value: "SOLD", label: "Satıldı" },
] as const

const CURRENT_YEAR = new Date().getFullYear()

const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i)

const BRAND_OPTIONS = [
  "Toyota",
  "Honda",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Peugeot",
  "Renault",
  "Fiat",
  "Opel",
  "Skoda",
  "Seat",
  "Volvo",
]

// ---- Types

interface VehicleImage {
  id: string
  url: string
  isMain: boolean
}

interface OriginCountry {
  id: string
  name: string
  code: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  vin: string | null
  color: string | null
  mileage: number | null
  fuelType: string | null
  transmission: string | null
  engineCC: number
  bodyType: string | null
  fobPrice: number
  fobCurrency: string
  status: VehicleStatus
  totalCost: number | null
  salePrice: number | null
  galleryId: string
  originCountry?: OriginCountry
  images?: VehicleImage[]
  createdAt: string
  updatedAt: string
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

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMainImage(images?: VehicleImage[]): string | null {
  if (!images || images.length === 0) return null
  const main = images.find((img) => img.isMain)
  return main ? main.url : images[0].url
}

// ---- Page component

export default function VehiclesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ---- State
  const [page, setPage] = React.useState(1)
  const [statusTab, setStatusTab] = React.useState("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [brandFilter, setBrandFilter] = React.useState("all")
  const [yearFromFilter, setYearFromFilter] = React.useState("all")
  const [yearToFilter, setYearToFilter] = React.useState("all")

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingVehicle, setDeletingVehicle] = React.useState<Vehicle | null>(null)

  // ---- Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [statusTab, brandFilter, yearFromFilter, yearToFilter])

  // ---- Query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    }
    if (statusTab !== "ALL") params.status = statusTab
    if (debouncedSearch) params.search = debouncedSearch
    if (brandFilter !== "all") params.brand = brandFilter
    if (yearFromFilter !== "all") params.yearFrom = yearFromFilter
    if (yearToFilter !== "all") params.yearTo = yearToFilter
    return params
  }, [page, statusTab, debouncedSearch, brandFilter, yearFromFilter, yearToFilter])

  // ---- Data fetch
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", queryParams],
    queryFn: async (): Promise<PaginatedResponse<Vehicle>> => {
      const { data } = await api.get<PaginatedResponse<Vehicle>>("/vehicles", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const vehicles = response?.data ?? []
  const pagination = response?.pagination

  // ---- Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/vehicles/${id}`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Araç silindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setDeleteDialogOpen(false)
      setDeletingVehicle(null)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Araç silinemedi.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns
  const columns: Column<Vehicle>[] = [
    {
      key: "images",
      label: "Görsel",
      width: "16",
      render: (_value, row) => {
        const imageUrl = getMainImage(row.images)
        return (
          <div className="h-12 w-16 overflow-hidden rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`${row.brand} ${row.model}`}
                width={64}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <Car className="h-5 w-5 text-gray-300" />
            )}
          </div>
        )
      },
    },
    {
      key: "brand",
      label: "Marka / Model",
      render: (_value, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm leading-tight">
            {row.brand} {row.model}
          </span>
          {row.vin && (
            <span className="text-xs text-gray-400 font-mono">{row.vin}</span>
          )}
        </div>
      ),
    },
    {
      key: "year",
      label: "Yıl",
      render: (_value, row) => (
        <span className="text-sm">{row.year}</span>
      ),
    },
    {
      key: "engineCC",
      label: "Motor",
      render: (_value, row) => (
        <span className="text-sm whitespace-nowrap">
          {row.engineCC.toLocaleString("tr-TR")} cc
        </span>
      ),
    },
    {
      key: "fobPrice",
      label: "FOB Fiyat",
      render: (_value, row) => (
        <span className="text-sm font-medium tabular-nums whitespace-nowrap">
          {formatCurrency(row.fobPrice, row.fobCurrency)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Durum",
      render: (_value, row) => (
        <Badge
          variant={STATUS_BADGE_VARIANT[row.status]}
          className={STATUS_BADGE_CLASSES[row.status]}
        >
          {TOKEN_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "İşlemler",
      render: (_value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">İşlemler</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/vehicles/${row.id}`}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Detay
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/vehicles/${row.id}/edit`}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={ACTION_COLORS.destructiveFocus}
              onClick={() => {
                setDeletingVehicle(row)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // ---- Handlers
  const handleDelete = () => {
    if (deletingVehicle) {
      deleteMutation.mutate(deletingVehicle.id)
    }
  }

  if (isError) {
    return (
      <ErrorState message="Araç verileri yüklenirken hata oluştu." onRetry={() => refetch()} />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Araçlar</h1>
          <p className="text-sm text-gray-500">Araç stoğunuzu yönetin</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Araç
          </Link>
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={statusTab}
        onValueChange={(value) => {
          setStatusTab(value)
        }}
      >
        <TabsList className="h-auto flex-wrap gap-1">
          {STATUS_TAB_VALUE.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Marka, model veya şasi no ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Brand filter */}
        <div className="w-[160px]">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Marka" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Markalar</SelectItem>
              {BRAND_OPTIONS.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year from filter */}
        <div className="w-[130px]">
          <Select value={yearFromFilter} onValueChange={setYearFromFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Yıldan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Yıldan</SelectItem>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year to filter */}
        <div className="w-[130px]">
          <Select value={yearToFilter} onValueChange={setYearToFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Yıla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Yıla</SelectItem>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset filters */}
        {(brandFilter !== "all" ||
          yearFromFilter !== "all" ||
          yearToFilter !== "all" ||
          searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setBrandFilter("all")
              setYearFromFilter("all")
              setYearToFilter("all")
              setStatusTab("ALL")
            }}
          >
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={vehicles}
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
            icon: Car,
            title: "Henüz araç eklenmemiş",
            description: "Araç stoğunuza yeni araç ekleyerek başlayın.",
            action: (
              <Button asChild>
                <Link href="/dashboard/vehicles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Araç
                </Link>
              </Button>
            ),
          }}
          mobileCard={(row) => (
            <Link href={`/dashboard/vehicles/${row.id}`} className="block rounded-lg border p-4 hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{row.brand} {row.model}</p>
                  <p className="text-xs text-muted-foreground">{row.year} &middot; {row.engineCC.toLocaleString("tr-TR")} cc</p>
                </div>
                <Badge variant={STATUS_BADGE_VARIANT[row.status]} className={STATUS_BADGE_CLASSES[row.status]}>
                  {TOKEN_STATUS_LABELS[row.status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium tabular-nums">{formatCurrency(row.fobPrice, row.fobCurrency)}</p>
            </Link>
          )}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Aracı Sil</DialogTitle>
            <DialogDescription>
              {deletingVehicle && (
                <>
                  <strong>
                    {deletingVehicle.brand} {deletingVehicle.model} (
                    {deletingVehicle.year})
                  </strong>{" "}
                  aracını silmek istediğinizden emin misiniz? Bu işlem geri
                  alınamaz.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeletingVehicle(null)
              }}
              disabled={deleteMutation.isPending}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile FAB */}
      <MobileFAB href="/dashboard/vehicles/new" label="Yeni Araç Ekle" />
    </div>
  )
}
