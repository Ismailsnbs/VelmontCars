"use client"

import { useQuery } from "@tanstack/react-query"
import { FileSpreadsheet, Printer } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { STATUS_LABELS as TOKEN_STATUS_LABELS } from "@/lib/design-tokens"
import type { VehicleStatusSummaryReport } from "../types"
import { REPORT_ENDPOINTS } from "../constants"
import { formatUSD, formatPercent, exportToCSV } from "../utils"
import { SummaryCard } from "./summary-card"
import { ReportTableWrapper, VehicleStatusBadge } from "./report-table-wrapper"

interface VehicleStatusContentProps {
  onExportCSV: () => void
  onPrint: () => void
}

export function VehicleStatusContent({ onExportCSV, onPrint }: VehicleStatusContentProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["report", "vehicle-status"],
    queryFn: async (): Promise<{ data: VehicleStatusSummaryReport }> => {
      const res = await api.get(REPORT_ENDPOINTS["vehicle-status"])
      return res.data
    },
    staleTime: 60_000,
  })

  const report = data?.data

  const handleExport = () => {
    if (!report?.breakdown?.length) return
    const rows = report.breakdown.map((item) => ({
      Durum: TOKEN_STATUS_LABELS[item.status as keyof typeof TOKEN_STATUS_LABELS] ?? item.status,
      Sayi: item.count,
      Yuzde: report.summary.total
        ? ((item.count / report.summary.total) * 100).toFixed(1) + "%"
        : "0%",
      "FOB Degeri (USD)": item.totalFobValue,
      "Toplam Maliyet (USD)": item.totalCostValue,
    }))
    exportToCSV(rows, "arac-durum-ozeti")
    onExportCSV()
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex justify-end gap-2 border-b pb-4">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!report}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="mr-1.5 h-4 w-4" />
          Yazdır
        </Button>
      </div>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryCard label="Toplam Araç" value={String(report.summary.total)} />
          <SummaryCard
            label="Aktif Envanter Değeri"
            value={formatUSD(report.summary.activeInventoryValue)}
            highlight
          />
          <SummaryCard
            label="Satış Gelirleri"
            value={formatUSD(report.summary.soldInventoryValue)}
          />
        </div>
      )}

      {/* Table */}
      <ReportTableWrapper isLoading={isLoading} error={error} isEmpty={!report?.breakdown?.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Sayı</TableHead>
              <TableHead className="text-right">Yüzde</TableHead>
              <TableHead className="text-right">FOB Değeri (USD)</TableHead>
              <TableHead className="text-right">Toplam Maliyet (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.breakdown?.map((item) => (
              <TableRow key={item.status}>
                <TableCell>
                  <VehicleStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right font-medium">{item.count}</TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {report.summary.total
                    ? formatPercent((item.count / report.summary.total) * 100)
                    : "-"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(item.totalFobValue)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(item.totalCostValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableWrapper>
    </div>
  )
}
