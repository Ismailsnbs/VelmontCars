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
import { SEMANTIC_COLORS } from "@/lib/design-tokens"
import type { SalesReport, DateRangeFilter } from "../types"
import { REPORT_ENDPOINTS } from "../constants"
import { formatUSD, formatPercent, formatDate, exportToCSV } from "../utils"
import { SummaryCard, DateRangeFields } from "./summary-card"
import { ReportTableWrapper } from "./report-table-wrapper"

interface SalesReportContentProps {
  filter: DateRangeFilter
  onFilterChange: (f: DateRangeFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

export function SalesReportContent({
  filter,
  onFilterChange,
  onExportCSV,
  onPrint,
}: SalesReportContentProps) {
  const params: Record<string, string> = {}
  if (filter.startDate) params.startDate = filter.startDate
  if (filter.endDate) params.endDate = filter.endDate

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", "sales", params],
    queryFn: async (): Promise<{ data: SalesReport }> => {
      const res = await api.get(REPORT_ENDPOINTS["sales"], { params })
      return res.data
    },
    staleTime: 60_000,
  })

  const report = data?.data

  const handleExport = () => {
    if (!report?.sales?.length) return
    const rows = report.sales.map((s) => ({
      Arac: `${s.vehicleBrand} ${s.vehicleModel} ${s.vehicleYear}`,
      Musteri: s.customerName,
      "Satis Fiyati (USD)": s.salePrice,
      "Alis Maliyeti (USD)": s.totalCost,
      "Kar (USD)": s.profit,
      "Kar Marji": s.profitMargin.toFixed(1) + "%",
      "Odeme Tipi": s.paymentType ?? "",
      "Satis Tarihi": formatDate(s.saleDate),
    }))
    exportToCSV(rows, "satis-raporu")
    onExportCSV()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 border-b pb-4">
        <DateRangeFields value={filter} onChange={onFilterChange} />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="mr-1.5 h-4 w-4" />
            Yazdır
          </Button>
        </div>
      </div>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryCard label="Toplam Satış" value={String(report.summary.totalSales)} />
          <SummaryCard
            label="Toplam Gelir"
            value={formatUSD(report.summary.totalRevenue)}
            highlight
          />
          <SummaryCard
            label="Toplam Maliyet"
            value={formatUSD(report.summary.totalCost)}
          />
          <SummaryCard
            label="Toplam Kar"
            value={formatUSD(report.summary.totalProfit)}
            highlight={report.summary.totalProfit > 0}
            warning={report.summary.totalProfit < 0}
          />
          <SummaryCard
            label="Ort. Kar Marjı"
            value={formatPercent(report.summary.avgProfitMargin)}
          />
        </div>
      )}

      {/* Table */}
      <ReportTableWrapper isLoading={isLoading} error={error} isEmpty={!report?.sales?.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Araç</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead className="text-right">Satış Fiyatı</TableHead>
              <TableHead className="text-right">Alış Maliyeti</TableHead>
              <TableHead className="text-right">Kar</TableHead>
              <TableHead className="text-right">Kar Marjı</TableHead>
              <TableHead>Satış Tarihi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.sales?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.vehicleBrand} {s.vehicleModel}{" "}
                  <span className="text-gray-500">{s.vehicleYear}</span>
                </TableCell>
                <TableCell className="text-sm">{s.customerName}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(s.salePrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(s.totalCost)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm font-medium tabular-nums ${
                    s.profit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                  }`}
                >
                  {formatUSD(s.profit)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span
                    className={`font-medium tabular-nums ${
                      s.profitMargin >= 15
                        ? SEMANTIC_COLORS.profit
                        : s.profitMargin >= 5
                        ? "text-yellow-600"
                        : SEMANTIC_COLORS.loss
                    }`}
                  >
                    {formatPercent(s.profitMargin)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(s.saleDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableWrapper>
    </div>
  )
}
