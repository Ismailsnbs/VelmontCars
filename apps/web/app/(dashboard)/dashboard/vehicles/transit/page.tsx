"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Car, PackageCheck, MoreHorizontal, Eye, Ship } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ErrorState } from "@/components/ui/error-state"
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
} from "@/lib/design-tokens"

// ---- Constants

const PAGE_SIZE = 10

// ---- Types

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
  fobPrice: number
  fobCurrency: string
  status: "TRANSIT"
  estimatedArrival: string | null
  originCountry?: OriginCountry
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr))
}

// ---- Page Component

export default function TransitVehiclesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = React.useState(1)
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
  const [movingVehicle, setMovingVehicle] = React.useState<Vehicle | null>(null)

  // ---- Fetch transit vehicles
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicles", { status: "TRANSIT", page, limit: PAGE_SIZE }],
    queryFn: async (): Promise<PaginatedResponse<Vehicle>> => {
      const { data } = await api.get<PaginatedResponse<Vehicle>>("/vehicles", {
        params: { status: "TRANSIT", page, limit: PAGE_SIZE },
      })
      return data
    },
    staleTime: 30_000,
  })

  const vehicles = response?.data ?? []
  const pagination = response?.pagination

  // ---- Move to stock mutation
  const moveToStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/vehicles/${id}/move-to-stock`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Basarili",
        description: "Arac stoga alindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      setConfirmDialogOpen(false)
      setMovingVehicle(null)
    },
    onError: (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string } } }
      toast({
        title: "Hata",
        description: apiError?.response?.data?.message || "Arac stoga alinamadi.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns
  const columns: Column<Vehicle>[] = [
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
      label: "Yil",
      render: (_value, row) => (
        <span className="text-sm">{row.year}</span>
      ),
    },
    {
      key: "originCountry",
      label: "Mensei Ulke",
      render: (_value, row) => (
        <span className="text-sm">
          {row.originCountry ? row.originCountry.name : "-"}
        </span>
      ),
    },
    {
      key: "estimatedArrival",
      label: "Tahmini Varis",
      render: (_value, row) => (
        <span className="text-sm tabular-nums">
          {formatDate(row.estimatedArrival)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Durum",
      render: () => (
        <Badge
          variant={STATUS_BADGE_VARIANT["TRANSIT"]}
          className={STATUS_BADGE_CLASSES["TRANSIT"]}
        >
          {TOKEN_STATUS_LABELS["TRANSIT"]}
        </Badge>
      ),
    },
    {
      key: "id",
      label: "Islemler",
      render: (_value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Islemler</span>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-green-600 focus:text-green-600"
              onClick={() => {
                setMovingVehicle(row)
                setConfirmDialogOpen(true)
              }}
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              Stoga Al
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isError) {
    return (
      <ErrorState
        message="Transit arac verileri yuklenirken hata olustu."
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
            <Ship className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Transit Araclar</h1>
            <p className="text-sm text-gray-500">
              Yolda olan araclarinizi takip edin
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/vehicles">Tum Araclara Don</Link>
        </Button>
      </div>

      {/* Summary badge */}
      {!isLoading && pagination && (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={STATUS_BADGE_CLASSES["TRANSIT"]}
          >
            {pagination.total} transit arac
          </Badge>
        </div>
      )}

      {/* Table */}
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
            title: "Transit arac bulunmuyor",
            description: "Simdilik yolda olan arac yok.",
          }}
          mobileCard={(row) => (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {row.brand} {row.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.year}
                    {row.originCountry ? ` · ${row.originCountry.name}` : ""}
                  </p>
                </div>
                <Badge
                  variant={STATUS_BADGE_VARIANT["TRANSIT"]}
                  className={STATUS_BADGE_CLASSES["TRANSIT"]}
                >
                  {TOKEN_STATUS_LABELS["TRANSIT"]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Tahmini Varis: {formatDate(row.estimatedArrival)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/vehicles/${row.id}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      setMovingVehicle(row)
                      setConfirmDialogOpen(true)
                    }}
                  >
                    <PackageCheck className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Move to Stock Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Stoga Al</DialogTitle>
            <DialogDescription>
              {movingVehicle && (
                <>
                  <strong>
                    {movingVehicle.brand} {movingVehicle.model} (
                    {movingVehicle.year})
                  </strong>{" "}
                  aracini stoga almak istiyor musunuz? Aracin durumu
                  <strong> Transit</strong> durumundan{" "}
                  <strong>Stokta</strong> durumuna gececek.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false)
                setMovingVehicle(null)
              }}
              disabled={moveToStockMutation.isPending}
            >
              Iptal
            </Button>
            <Button
              className="border-green-600 bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                if (movingVehicle) {
                  moveToStockMutation.mutate(movingVehicle.id)
                }
              }}
              disabled={moveToStockMutation.isPending}
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              {moveToStockMutation.isPending ? "Isleniyor..." : "Stoga Al"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
