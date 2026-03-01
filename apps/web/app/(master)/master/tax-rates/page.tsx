"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, Plus, History, Pencil, Trash2, Percent } from "lucide-react"
import { format } from "date-fns"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ACTION_COLORS } from "@/lib/design-tokens"
import { TaxRateForm } from "./components/tax-rate-form"
import { TaxRateHistory } from "./components/tax-rate-history"
import type { TaxRate, RateType } from "./components/tax-rate-form"

// ---- Constants ------------------------------------------------------------

const PAGE_SIZE = 10

const RATE_TYPE_LABEL: Record<RateType, string> = {
  PERCENTAGE: "Yuzde",
  FIXED: "Sabit",
  PER_CC: "CC basi",
}

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  PASSENGER: "Binek",
  COMMERCIAL: "Ticari",
  ALL: "Tumu",
}

// ---- API types ------------------------------------------------------------

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

// ---- Rate formatter -------------------------------------------------------

function formatRate(rate: string | number, rateType: RateType): string {
  const num = Number(rate)
  switch (rateType) {
    case "PERCENTAGE":
      return `%${num}`
    case "FIXED":
      return `${num} TL`
    case "PER_CC":
      return `${num} TL/cc`
    default:
      return String(num)
  }
}

function formatEngineCC(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—"
  if (min != null && max != null) return `${min}-${max}cc`
  if (min != null) return `${min}cc+`
  return `0-${max}cc`
}

// ---- Page component -------------------------------------------------------

export default function TaxRatesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ---- State ---------------------------------------------------------------
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [isActiveFilter, setIsActiveFilter] = React.useState<string>("all")

  const [formOpen, setFormOpen] = React.useState(false)
  const [selectedTaxRate, setSelectedTaxRate] = React.useState<TaxRate | null>(null)

  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyTaxRate, setHistoryTaxRate] = React.useState<TaxRate | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingTaxRate, setDeletingTaxRate] = React.useState<TaxRate | null>(null)

  // ---- Query params --------------------------------------------------------
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    }
    if (search.trim()) params.search = search.trim()
    if (isActiveFilter !== "all") params.isActive = isActiveFilter
    return params
  }, [page, search, isActiveFilter])

  // ---- Data fetch ----------------------------------------------------------
  const { data: response, isLoading } = useQuery({
    queryKey: ["tax-rates", queryParams],
    queryFn: async (): Promise<PaginatedResponse<TaxRate>> => {
      const { data } = await api.get<PaginatedResponse<TaxRate>>("/tax-rates", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const taxRates = response?.data ?? []
  const pagination = response?.pagination

  // ---- Delete mutation -----------------------------------------------------
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/tax-rates/${id}`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Basarili",
        description: "Vergi orani silindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] })
      setDeleteDialogOpen(false)
      setDeletingTaxRate(null)
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error)
      toast({ title: "Hata", description: message, variant: "destructive" })
    },
  })

  // ---- Search handler ------------------------------------------------------
  const handleSearch = React.useCallback((query: string) => {
    setSearch(query)
    setPage(1)
  }, [])

  // ---- Action handlers -----------------------------------------------------
  const handleNewClick = () => {
    setSelectedTaxRate(null)
    setFormOpen(true)
  }

  const handleEditClick = (taxRate: TaxRate) => {
    setSelectedTaxRate(taxRate)
    setFormOpen(true)
  }

  const handleHistoryClick = (taxRate: TaxRate) => {
    setHistoryTaxRate(taxRate)
    setHistoryOpen(true)
  }

  const handleDeleteClick = (taxRate: TaxRate) => {
    setDeletingTaxRate(taxRate)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingTaxRate) {
      deleteMutation.mutate(deletingTaxRate.id)
    }
  }

  // ---- Table columns -------------------------------------------------------
  const columns: Column<TaxRate>[] = [
    {
      key: "code",
      label: "Kod",
      render: (value) => (
        <span className="font-mono text-sm font-medium text-gray-900">
          {String(value)}
        </span>
      ),
    },
    {
      key: "name",
      label: "Ad",
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{String(value)}</p>
          {row.nameEn && (
            <p className="text-xs text-gray-500">{row.nameEn}</p>
          )}
        </div>
      ),
    },
    {
      key: "rate",
      label: "Oran",
      render: (value, row) => (
        <span className="font-mono font-semibold text-gray-800">
          {formatRate(value as string | number, row.rateType)}
        </span>
      ),
    },
    {
      key: "rateType",
      label: "Oran Tipi",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {RATE_TYPE_LABEL[value as RateType] ?? String(value)}
        </span>
      ),
    },
    {
      key: "vehicleType",
      label: "Arac Tipi",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? (VEHICLE_TYPE_LABEL[String(value)] ?? String(value)) : "—"}
        </span>
      ),
    },
    {
      key: "minEngineCC",
      label: "Motor Hacmi Araligi",
      render: (_value, row) => (
        <span className="text-sm text-gray-600 font-mono">
          {formatEngineCC(row.minEngineCC, row.maxEngineCC)}
        </span>
      ),
    },
    {
      key: "effectiveFrom",
      label: "Yururluk Basl.",
      render: (value) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {formatTableDate(String(value))}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Durum",
      render: (value) =>
        value ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="secondary">Pasif</Badge>
        ),
    },
    {
      key: "id",
      label: "Islemler",
      render: (_value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Islemler</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleEditClick(row)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Duzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleHistoryClick(row)}
              className="cursor-pointer"
            >
              <History className="mr-2 h-4 w-4" />
              Gecmis
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(row)}
              className={`cursor-pointer ${ACTION_COLORS.destructiveFocus}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // ---- Render --------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vergi Oranlari</h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform genelindeki vergi oranlarini yonetin.
          </p>
        </div>
        <Button onClick={handleNewClick} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Yeni Vergi Orani
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={isActiveFilter}
          onValueChange={(val) => {
            setIsActiveFilter(val)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Durum filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tumu</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data table */}
      <DataTable<TaxRate>
        columns={columns}
        data={taxRates}
        isLoading={isLoading}
        searchPlaceholder="Kod veya ada gore ara..."
        onSearch={handleSearch}
        pagination={
          pagination
            ? {
                page: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
              }
            : undefined
        }
        onPageChange={setPage}
        rowKey="id"
        emptyState={{ icon: Percent, title: "Henüz vergi oranı eklenmemiş", description: "Vergi oranlarını tanımlayarak hesaplamalara başlayın." }}
      />

      {/* Create / Edit form dialog */}
      <TaxRateForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setSelectedTaxRate(null)
        }}
        taxRate={selectedTaxRate}
      />

      {/* History dialog */}
      <TaxRateHistory
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open)
          if (!open) setHistoryTaxRate(null)
        }}
        taxRate={historyTaxRate}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vergi Oranini Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            <strong>{deletingTaxRate?.name}</strong> ({deletingTaxRate?.code}) vergi
            oranini silmek istediginizden emin misiniz? Bu islem geri alinamaz.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Iptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---- Utils ----------------------------------------------------------------

function formatTableDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd.MM.yyyy")
  } catch {
    return dateStr
  }
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response: { data?: { message?: string } } }).response
    return response.data?.message ?? "Bir hata olustu"
  }
  if (error instanceof Error) return error.message
  return "Bir hata olustu"
}
