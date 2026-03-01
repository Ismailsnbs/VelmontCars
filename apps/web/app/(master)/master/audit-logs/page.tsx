"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import api from "@/lib/api"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// ---- Constants

const PAGE_SIZE = 10

const ENTITY_TYPE_LABEL: Record<string, string> = {
  TaxRate: "Vergi Oranı",
  Country: "Ülke",
  ExchangeRate: "Döviz Kuru",
  Gallery: "Galeri",
  Notification: "Bildirim",
  User: "Kullanıcı",
  Product: "Ürün",
  Vehicle: "Araç",
  Sale: "Satış",
}

// ---- API types

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  performedBy: string
  performedAt: string
  ipAddress?: string
  userAgent?: string
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

// ---- Badge utilities

function getEntityTypeBadgeVariant(entityType: string): "default" | "secondary" | "destructive" | "outline" {
  switch (entityType) {
    case "TaxRate":
      return "default"
    case "ExchangeRate":
      return "secondary"
    case "Gallery":
      return "default"
    case "User":
      return "destructive"
    case "Notification":
      return "outline"
    default:
      return "secondary"
  }
}

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("CREATE") || action.includes("CREATED")) {
    return "default"
  }
  if (action.includes("UPDATE") || action.includes("UPDATED")) {
    return "secondary"
  }
  if (action.includes("DELETE") || action.includes("DELETED")) {
    return "destructive"
  }
  return "outline"
}

// ---- Page component

export default function AuditLogsPage() {
  // ---- State
  const [page, setPage] = React.useState(1)
  const [entityTypeFilter, setEntityTypeFilter] = React.useState<string>("all")
  const [actionSearch, setActionSearch] = React.useState<string>("")

  // ---- Query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    }
    if (entityTypeFilter !== "all") params.entityType = entityTypeFilter
    if (actionSearch) params.action = actionSearch
    return params
  }, [page, entityTypeFilter, actionSearch])

  // ---- Data fetch
  const { data: response, isLoading } = useQuery({
    queryKey: ["audit-logs", queryParams],
    queryFn: async (): Promise<PaginatedResponse<AuditLog>> => {
      const { data } = await api.get<PaginatedResponse<AuditLog>>("/audit-logs", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const auditLogs = response?.data ?? []
  const pagination = response?.pagination

  // ---- Columns (using DataTable's Column<T> interface: key, label, render)
  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      label: "İşlem",
      render: (_value, row) => (
        <Badge variant={getActionBadgeVariant(row.action)}>
          {row.action}
        </Badge>
      ),
    },
    {
      key: "entityType",
      label: "Varlık Türü",
      render: (_value, row) => (
        <Badge variant={getEntityTypeBadgeVariant(row.entityType)}>
          {ENTITY_TYPE_LABEL[row.entityType] || row.entityType}
        </Badge>
      ),
    },
    {
      key: "entityId",
      label: "Varlık ID",
      render: (_value, row) => (
        <span className="font-mono text-xs text-gray-600 truncate max-w-[200px] block">
          {row.entityId}
        </span>
      ),
    },
    {
      key: "performedBy",
      label: "Yapan Kişi",
      render: (_value, row) => <span className="font-medium">{row.performedBy}</span>,
    },
    {
      key: "performedAt",
      label: "Tarih & Saat",
      render: (_value, row) =>
        format(new Date(row.performedAt as string), "dd MMM yyyy HH:mm:ss", { locale: tr }),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Denetim Günlüğü</h1>
        <p className="text-sm text-gray-500">Platform üzerindeki tüm işlem kayıtları</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İşlem Ara
          </label>
          <Input
            placeholder="Örn: CREATE, UPDATE, DELETE..."
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value)
              setPage(1)
            }}
            className="w-full"
          />
        </div>

        <div className="w-[220px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Varlık Türü
          </label>
          <Select value={entityTypeFilter} onValueChange={(value) => {
            setEntityTypeFilter(value)
            setPage(1)
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="TaxRate">Vergi Oranı</SelectItem>
              <SelectItem value="Country">Ülke</SelectItem>
              <SelectItem value="ExchangeRate">Döviz Kuru</SelectItem>
              <SelectItem value="Gallery">Galeri</SelectItem>
              <SelectItem value="Notification">Bildirim</SelectItem>
              <SelectItem value="User">Kullanıcı</SelectItem>
              <SelectItem value="Product">Ürün</SelectItem>
              <SelectItem value="Vehicle">Araç</SelectItem>
              <SelectItem value="Sale">Satış</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={auditLogs}
          isLoading={isLoading}
          rowKey="id"
          pagination={pagination ? {
            page: pagination.page,
            pageSize: PAGE_SIZE,
            total: pagination.total,
          } : undefined}
          onPageChange={setPage}
          emptyState={{ icon: FileText, title: "Henüz işlem kaydı yok", description: "Sistem üzerinde yapılan değişiklikler burada görüntülenir." }}
          mobileCard={(row) => (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={getActionBadgeVariant(row.action)}>
                    {row.action}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{row.performedBy}</p>
                </div>
                <Badge variant={getEntityTypeBadgeVariant(row.entityType)}>
                  {ENTITY_TYPE_LABEL[row.entityType] || row.entityType}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(row.performedAt), "dd MMM yyyy HH:mm:ss", { locale: tr })}
              </p>
            </div>
          )}
        />
      </div>
    </div>
  )
}
