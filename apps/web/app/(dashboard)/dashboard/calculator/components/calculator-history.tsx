"use client"

import { Calculator } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { CALCULATOR_COLORS } from "@/lib/design-tokens"
import type { HistoryItem, HistoryPage } from "../types"
import { PAGE_SIZE } from "../constants"
import { formatUSD, formatTRY, formatDate } from "../utils"

interface CalculatorHistoryProps {
  historyData: HistoryPage | undefined
  historyLoading: boolean
  onPageChange: (page: number) => void
  onRowClick: (item: HistoryItem) => void
}

export function CalculatorHistory({
  historyData,
  historyLoading,
  onPageChange,
  onRowClick,
}: CalculatorHistoryProps) {
  const historyItems: HistoryItem[] = historyData?.data ?? []
  const historyPagination = historyData?.pagination

  const columns: Column<HistoryItem>[] = [
    {
      key: "createdAt",
      label: "Tarih",
      render: (_v, row) => (
        <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "vehicleInfo",
      label: "Arac",
      render: (_v, row) => (
        <div className="text-sm">
          <p className="font-medium">
            {row.vehicleInfo.brand ?? "-"} {row.vehicleInfo.model ?? ""}
          </p>
          <p className="text-xs text-gray-400">
            {row.vehicleInfo.year} / {row.vehicleInfo.engineCC} cc
          </p>
        </div>
      ),
    },
    {
      key: "inputs",
      label: "FOB / CIF",
      render: (_v, row) => (
        <div className="text-sm tabular-nums">
          <p>{formatUSD(row.inputs.fobPrice)}</p>
          <p className="text-xs text-gray-400">CIF: {formatUSD(row.inputs.cifUsd)}</p>
        </div>
      ),
    },
    {
      key: "totalCost",
      label: "Toplam Maliyet",
      render: (_v, row) => (
        <div className="text-sm tabular-nums">
          <p className={`font-semibold ${CALCULATOR_COLORS.totalCostValue}`}>
            {formatUSD(row.totalCost)}
          </p>
          <p className="text-xs text-gray-400">{formatTRY(row.totalCostTry)}</p>
        </div>
      ),
    },
    {
      key: "savedToVehicle",
      label: "Durum",
      render: (_v, row) =>
        row.savedToVehicle ? (
          <Badge className={`${CALCULATOR_COLORS.savedBadge} text-xs`}>Kaydedildi</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Taslak
          </Badge>
        ),
    },
    {
      key: "id",
      label: "Detay",
      render: (_v, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRowClick(row)}
          className="text-xs h-7"
        >
          Goruntule
        </Button>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hesaplama Gecmisi</CardTitle>
        <CardDescription>
          Daha once yapilan hesaplamalari goruntuleyin ve detay alin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable<HistoryItem>
          columns={columns}
          data={historyItems}
          isLoading={historyLoading}
          rowKey="id"
          pagination={
            historyPagination
              ? {
                  page: historyPagination.page,
                  pageSize: PAGE_SIZE,
                  total: historyPagination.total,
                }
              : undefined
          }
          onPageChange={onPageChange}
          emptyState={{
            icon: Calculator,
            title: "Henüz hesaplama yapılmamış",
            description: "İthalat maliyet hesaplayıcısını kullanarak başlayın.",
          }}
          mobileCard={(row) => (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {row.vehicleInfo.brand ?? "-"} {row.vehicleInfo.model ?? ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.vehicleInfo.year} / {row.vehicleInfo.engineCC} cc
                  </p>
                </div>
                {row.savedToVehicle ? (
                  <Badge className={`${CALCULATOR_COLORS.savedBadge} text-xs`}>
                    Kaydedildi
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Taslak
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  FOB:{" "}
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {formatUSD(row.inputs.fobPrice)}
                  </span>
                </span>
                <span>
                  CIF:{" "}
                  <span className="font-mono text-foreground tabular-nums">
                    {formatUSD(row.inputs.cifUsd)}
                  </span>
                </span>
              </div>
              <div className="text-xs tabular-nums">
                <span className={`font-bold ${CALCULATOR_COLORS.totalCostValue}`}>
                  {formatUSD(row.totalCost)}
                </span>
                <span className="text-muted-foreground ml-2">
                  {formatTRY(row.totalCostTry)}
                </span>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
