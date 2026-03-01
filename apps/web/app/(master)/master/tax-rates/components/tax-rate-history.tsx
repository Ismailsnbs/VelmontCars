"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import api from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { TaxRate } from "./tax-rate-form"
import { CHANGE_COLORS } from "@/lib/design-tokens"

// ---- Types ----------------------------------------------------------------

interface TaxRateHistory {
  id: string
  taxRateId: string
  oldValue: string | number
  newValue: string | number
  changedBy: string
  changedAt: string
  reason: string | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

type SortField = "changedAt" | "oldValue" | "newValue"
type SortOrder = "asc" | "desc"

// ---- Component ------------------------------------------------------------

interface TaxRateHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxRate: TaxRate | null
}

export function TaxRateHistory({ open, onOpenChange, taxRate }: TaxRateHistoryProps) {
  const [sortField, setSortField] = React.useState<SortField>("changedAt")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc")

  const { data: history, isLoading } = useQuery({
    queryKey: ["tax-rate-history", taxRate?.id],
    queryFn: async (): Promise<TaxRateHistory[]> => {
      const { data } = await api.get<ApiResponse<TaxRateHistory[]>>(
        `/tax-rates/${taxRate!.id}/history`
      )
      return data.data
    },
    enabled: open && Boolean(taxRate?.id),
  })

  // ---- Sort ----------------------------------------------------------------

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const sortedHistory = React.useMemo(() => {
    if (!history) return []
    return [...history].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortField) {
        case "changedAt":
          aVal = new Date(a.changedAt).getTime()
          bVal = new Date(b.changedAt).getTime()
          break
        case "oldValue":
          aVal = Number(a.oldValue)
          bVal = Number(b.oldValue)
          break
        case "newValue":
          aVal = Number(a.newValue)
          bVal = Number(b.newValue)
          break
        default:
          aVal = new Date(a.changedAt).getTime()
          bVal = new Date(b.changedAt).getTime()
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [history, sortField, sortOrder])

  // ---- Render --------------------------------------------------------------

  const SortIndicator = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-gray-400">
      {sortField === field ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Degisiklik Gecmisi
            {taxRate ? (
              <span className="ml-2 font-normal text-gray-500 text-base">
                — {taxRate.name} ({taxRate.code})
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !sortedHistory.length ? (
            <p className="py-8 text-center text-gray-500 text-sm">
              Bu vergi orani icin degisiklik gecmisi bulunamadi.
            </p>
          ) : (
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort("oldValue")}
                      >
                        Eski Deger
                        <SortIndicator field="oldValue" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort("newValue")}
                      >
                        Yeni Deger
                        <SortIndicator field="newValue" />
                      </Button>
                    </TableHead>
                    <TableHead>Degistiren</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort("changedAt")}
                      >
                        Degisiklik Tarihi
                        <SortIndicator field="changedAt" />
                      </Button>
                    </TableHead>
                    <TableHead>Sebep</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className={`font-mono ${CHANGE_COLORS.oldValue}`}>
                        {formatRate(item.oldValue, taxRate?.rateType)}
                      </TableCell>
                      <TableCell className={`font-mono ${CHANGE_COLORS.newValue}`}>
                        {formatRate(item.newValue, taxRate?.rateType)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {item.changedBy}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(item.changedAt)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                        {item.reason ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---- Utils ----------------------------------------------------------------

function formatRate(
  value: string | number,
  rateType: TaxRate["rateType"] | undefined
): string {
  const num = Number(value)
  if (isNaN(num)) return String(value)
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

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd.MM.yyyy HH:mm")
  } catch {
    return dateStr
  }
}
