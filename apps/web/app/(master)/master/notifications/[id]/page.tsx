"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PlatformNotification, NotificationType, NotificationPriority, TargetType } from "../components/notification-form"
import { ALERT_COLORS } from "@/lib/design-tokens"

// ---- Constants

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

// ---- API types

interface DetailResponse {
  success: boolean
  data: PlatformNotification
}

// ---- Page component

export default function NotificationDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["notifications", id],
    queryFn: async (): Promise<DetailResponse> => {
      const { data } = await api.get<DetailResponse>(`/notifications/${id}`)
      return data
    },
  })

  const notification = response?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isError || !notification) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/master/notifications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Link>
        </Button>
        <Card className={ALERT_COLORS.error.wrapper}>
          <CardContent className="pt-6">
            <p className={ALERT_COLORS.error.text}>
              Bildirim bulunamadı veya yüklenirken hata oluştu.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href="/master/notifications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Link>
      </Button>

      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-2xl">{notification.title}</CardTitle>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={getTypeBadgeVariant(notification.type)}>
                {TYPE_LABEL[notification.type]}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(notification.priority)}>
                {PRIORITY_LABEL[notification.priority]}
              </Badge>
              <Badge variant={getTargetBadgeVariant(notification.targetType)}>
                {TARGET_LABEL[notification.targetType]}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Mesaj
            </h3>
            <p className="text-base text-gray-700 whitespace-pre-wrap break-words">
              {notification.message}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Gönderen
              </h3>
              <p className="text-base text-gray-700">{notification.sentBy || "—"}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Gönderim Tarihi
              </h3>
              <p className="text-base text-gray-700">
                {notification.sentAt
                  ? format(new Date(notification.sentAt), "dd MMMM yyyy HH:mm:ss", { locale: tr })
                  : "—"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Oluşturma Tarihi
              </h3>
              <p className="text-base text-gray-700">
                {notification.createdAt
                  ? format(new Date(notification.createdAt), "dd MMMM yyyy HH:mm:ss", { locale: tr })
                  : "—"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Son Güncelleme
              </h3>
              <p className="text-base text-gray-700">
                {notification.updatedAt
                  ? format(new Date(notification.updatedAt), "dd MMMM yyyy HH:mm:ss", { locale: tr })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Target IDs if exists */}
          {notification.targetIds && notification.targetIds.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Hedef Kimlikler
              </h3>
              <div className="flex flex-wrap gap-2">
                {notification.targetIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
