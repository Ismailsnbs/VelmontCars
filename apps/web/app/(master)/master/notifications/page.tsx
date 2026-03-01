"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MoreHorizontal, Plus, Trash2, Eye, Bell } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import Link from "next/link"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ACTION_COLORS } from "@/lib/design-tokens"
import { NotificationForm } from "./components/notification-form"
import type { NotificationType, NotificationPriority, TargetType, PlatformNotification } from "./components/notification-form"

// ---- Constants

const PAGE_SIZE = 10

const TYPE_LABEL: Record<NotificationType, string> = {
  TAX_CHANGE: "Vergi Değişikliği",
  CURRENCY_ALERT: "Döviz Uyarısı",
  GENERAL_ANNOUNCEMENT: "Genel Duyuru",
  SYSTEM_MAINTENANCE: "Sistem Bakımı",
}

const PRIORITY_LABEL: Record<NotificationPriority, string> = {
  LOW: "Düşük",
  NORMAL: "Normal",
  HIGH: "Yüksek",
  URGENT: "Acil",
}

const TARGET_LABEL: Record<TargetType, string> = {
  ALL: "Tümü",
  GALLERY: "Galeri",
  SUBSCRIPTION: "Abonelik",
}

// ---- API types

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

function getTypeBadgeVariant(type: NotificationType): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "TAX_CHANGE":
      return "default"
    case "CURRENCY_ALERT":
      return "secondary"
    case "GENERAL_ANNOUNCEMENT":
      return "outline"
    case "SYSTEM_MAINTENANCE":
      return "destructive"
    default:
      return "default"
  }
}

function getPriorityBadgeVariant(priority: NotificationPriority): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "LOW":
      return "secondary"
    case "NORMAL":
      return "default"
    case "HIGH":
      return "default"
    case "URGENT":
      return "destructive"
    default:
      return "default"
  }
}

function getTargetBadgeVariant(target: TargetType): "default" | "secondary" | "destructive" | "outline" {
  switch (target) {
    case "ALL":
      return "default"
    case "GALLERY":
      return "secondary"
    case "SUBSCRIPTION":
      return "outline"
    default:
      return "default"
  }
}

// ---- Page component

export default function NotificationsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ---- State
  const [page, setPage] = React.useState(1)
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")

  const [formOpen, setFormOpen] = React.useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingNotification, setDeletingNotification] = React.useState<PlatformNotification | null>(null)

  // ---- Query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    }
    if (typeFilter !== "all") params.type = typeFilter
    if (priorityFilter !== "all") params.priority = priorityFilter
    return params
  }, [page, typeFilter, priorityFilter])

  // ---- Data fetch
  const { data: response, isLoading } = useQuery({
    queryKey: ["notifications", queryParams],
    queryFn: async (): Promise<PaginatedResponse<PlatformNotification>> => {
      const { data } = await api.get<PaginatedResponse<PlatformNotification>>("/notifications", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const notifications = response?.data ?? []
  const pagination = response?.pagination

  // ---- Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/notifications/${id}`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bildirim silindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      setDeleteDialogOpen(false)
      setDeletingNotification(null)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Bildirim silinemedi.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns (using DataTable's Column<T> interface: key, label, render)
  const columns: Column<PlatformNotification>[] = [
    {
      key: "title",
      label: "Başlık",
      render: (_value, row) => <span className="font-medium">{row.title}</span>,
    },
    {
      key: "type",
      label: "Tip",
      render: (_value, row) => (
        <Badge variant={getTypeBadgeVariant(row.type)}>
          {TYPE_LABEL[row.type]}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Öncelik",
      render: (_value, row) => (
        <Badge variant={getPriorityBadgeVariant(row.priority)}>
          {PRIORITY_LABEL[row.priority]}
        </Badge>
      ),
    },
    {
      key: "targetType",
      label: "Hedef",
      render: (_value, row) => (
        <Badge variant={getTargetBadgeVariant(row.targetType as TargetType)}>
          {TARGET_LABEL[row.targetType as TargetType]}
        </Badge>
      ),
    },
    {
      key: "sentAt",
      label: "Gönderim Tarihi",
      render: (_value, row) =>
        row.sentAt
          ? format(new Date(row.sentAt as string), "dd MMM yyyy HH:mm", { locale: tr })
          : "—",
    },
    {
      key: "id",
      label: "",
      render: (_value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/master/notifications/${row.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Detay
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={`${ACTION_COLORS.destructiveText} cursor-pointer`}
              onClick={() => {
                setDeletingNotification(row)
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
    if (deletingNotification) {
      deleteMutation.mutate(deletingNotification.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bildirimler</h1>
          <p className="text-sm text-gray-500">Platform bildirimlerini yönetin</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Bildirim
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="w-[200px]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tip filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipiler</SelectItem>
              <SelectItem value="TAX_CHANGE">Vergi Değişikliği</SelectItem>
              <SelectItem value="CURRENCY_ALERT">Döviz Uyarısı</SelectItem>
              <SelectItem value="GENERAL_ANNOUNCEMENT">Genel Duyuru</SelectItem>
              <SelectItem value="SYSTEM_MAINTENANCE">Sistem Bakımı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Öncelik filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Öncelikler</SelectItem>
              <SelectItem value="LOW">Düşük</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="HIGH">Yüksek</SelectItem>
              <SelectItem value="URGENT">Acil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={notifications}
          isLoading={isLoading}
          rowKey="id"
          pagination={pagination ? {
            page: pagination.page,
            pageSize: PAGE_SIZE,
            total: pagination.total,
          } : undefined}
          onPageChange={setPage}
          emptyState={{ icon: Bell, title: "Henüz bildirim gönderilmemiş", description: "Platform bildirimlerini buradan yönetebilirsiniz." }}
          mobileCard={(row) => (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-sm flex-1 pr-2">{row.title}</p>
                <Badge variant={getPriorityBadgeVariant(row.priority)}>
                  {PRIORITY_LABEL[row.priority]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getTypeBadgeVariant(row.type)}>
                  {TYPE_LABEL[row.type]}
                </Badge>
                <Badge variant={getTargetBadgeVariant(row.targetType as TargetType)}>
                  {TARGET_LABEL[row.targetType as TargetType]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.sentAt
                  ? format(new Date(row.sentAt as string), "dd MMM yyyy HH:mm", { locale: tr })
                  : "—"}
              </p>
            </div>
          )}
        />
      </div>

      {/* Form Dialog */}
      <NotificationForm open={formOpen} onOpenChange={setFormOpen} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bildirimi Sil</DialogTitle>
            <DialogDescription>
              Bu bildirimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
    </div>
  )
}
