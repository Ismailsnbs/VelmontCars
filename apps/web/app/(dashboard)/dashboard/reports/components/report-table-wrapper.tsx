"use client"

import * as React from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { SEMANTIC_COLORS, ALERT_COLORS, STATUS_BADGE_CLASSES, STATUS_LABELS as TOKEN_STATUS_LABELS } from "@/lib/design-tokens"

// ─── VehicleStatusBadge ───────────────────────────────────────────────────────

export function VehicleStatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_BADGE_CLASSES[status as keyof typeof STATUS_BADGE_CLASSES] ??
    "bg-gray-100 text-gray-600"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {TOKEN_STATUS_LABELS[status as keyof typeof TOKEN_STATUS_LABELS] ?? status}
    </span>
  )
}

// ─── ReportTableWrapper ───────────────────────────────────────────────────────

interface ReportTableWrapperProps {
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  children: React.ReactNode
}

export function ReportTableWrapper({
  isLoading,
  error,
  isEmpty,
  children,
}: ReportTableWrapperProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Rapor yükleniyor...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className={`h-8 w-8 ${SEMANTIC_COLORS.alertIcon} mb-2`} />
        <p className={`text-sm font-medium ${ALERT_COLORS.error.text}`}>Rapor yüklenemedi</p>
        <p className="text-xs text-gray-500 mt-1">Lütfen tekrar deneyin</p>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-500">Bu filtreler için veri bulunamadı</p>
      </div>
    )
  }

  return <div className="rounded-md border overflow-x-auto">{children}</div>
}
