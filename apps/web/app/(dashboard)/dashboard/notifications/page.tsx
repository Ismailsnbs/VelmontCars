"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ---- Constants

const PAGE_SIZE = 10

type NotificationType = "TAX_CHANGE" | "CURRENCY_ALERT" | "GENERAL_ANNOUNCEMENT" | "SYSTEM_MAINTENANCE"
type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"

const TYPE_LABEL: Record<NotificationType, string> = {
  TAX_CHANGE: "Vergi Degisikligi",
  CURRENCY_ALERT: "Doviz Uyarisi",
  GENERAL_ANNOUNCEMENT: "Genel Duyuru",
  SYSTEM_MAINTENANCE: "Sistem Bakimi",
}

const PRIORITY_LABEL: Record<NotificationPriority, string> = {
  LOW: "Dusuk",
  NORMAL: "Normal",
  HIGH: "Yuksek",
  URGENT: "Acil",
}

// ---- Types

interface NotificationRead {
  readAt: string
  readBy: string
}

interface GalleryNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  targetType: string
  sentAt: string
  reads: NotificationRead[]
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

// ---- Page component

export default function GalleryNotificationsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)

  // ---- Data fetch
  const { data: response, isLoading } = useQuery({
    queryKey: ["gallery-notifications", { page, limit: PAGE_SIZE }],
    queryFn: async (): Promise<PaginatedResponse<GalleryNotification>> => {
      const { data } = await api.get<PaginatedResponse<GalleryNotification>>("/notifications/gallery", {
        params: { page, limit: PAGE_SIZE },
      })
      return data
    },
    staleTime: 30_000,
  })

  const notifications = response?.data ?? []
  const pagination = response?.pagination

  // ---- Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/notifications/${id}/read`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Basarili",
        description: "Bildirim okundu olarak isaretlendi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["gallery-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Islem basarisiz.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns
  const columns: Column<GalleryNotification>[] = [
    {
      key: "title",
      label: "Baslik",
      render: (_value, row) => (
        <div className="flex items-center gap-2">
          {row.reads.length === 0 && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
          )}
          <span className={row.reads.length === 0 ? "font-semibold" : "font-medium text-muted-foreground"}>
            {row.title}
          </span>
        </div>
      ),
    },
    {
      key: "message",
      label: "Mesaj",
      render: (_value, row) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">{row.message}</span>
      ),
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
      label: "Oncelik",
      render: (_value, row) => (
        <Badge variant={getPriorityBadgeVariant(row.priority)}>
          {PRIORITY_LABEL[row.priority]}
        </Badge>
      ),
    },
    {
      key: "sentAt",
      label: "Tarih",
      render: (_value, row) =>
        row.sentAt
          ? format(new Date(row.sentAt), "dd MMM yyyy HH:mm", { locale: tr })
          : "\u2014",
    },
    {
      key: "id",
      label: "",
      render: (_value, row) =>
        row.reads.length === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markReadMutation.mutate(row.id)}
            disabled={markReadMutation.isPending}
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Okundu
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Okundu</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Bildirimler</h1>
        <p className="text-sm text-gray-500">Platform bildirimlerini goruntuleyin</p>
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
          emptyState={{ icon: Bell, title: "Henuz bildirim yok", description: "Platform bildirimleriniz burada gorunecek." }}
          mobileCard={(row) => (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 pr-2">
                  {row.reads.length === 0 && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                  )}
                  <p className={row.reads.length === 0 ? "font-semibold text-sm" : "font-medium text-sm text-muted-foreground"}>
                    {row.title}
                  </p>
                </div>
                <Badge variant={getPriorityBadgeVariant(row.priority)}>
                  {PRIORITY_LABEL[row.priority]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{row.message}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getTypeBadgeVariant(row.type)}>
                    {TYPE_LABEL[row.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {row.sentAt
                      ? format(new Date(row.sentAt), "dd MMM yyyy HH:mm", { locale: tr })
                      : "\u2014"}
                  </span>
                </div>
                {row.reads.length === 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markReadMutation.mutate(row.id)}
                    disabled={markReadMutation.isPending}
                  >
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Okundu
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Okundu</span>
                )}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}
