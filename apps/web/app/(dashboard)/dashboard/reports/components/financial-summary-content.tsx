"use client"

import { useQuery } from "@tanstack/react-query"
import { FileSpreadsheet, Printer } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SEMANTIC_COLORS } from "@/lib/design-tokens"
import type { FinancialSummaryReport, FinancialFilter } from "../types"
import { REPORT_ENDPOINTS, MONTH_LABELS } from "../constants"
import { formatUSD, formatPercent, exportToCSV } from "../utils"
import { SummaryCard } from "./summary-card"
import { ReportTableWrapper } from "./report-table-wrapper"

interface FinancialSummaryContentProps {
  filter: FinancialFilter
  onFilterChange: (f: FinancialFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

export function FinancialSummaryContent({
  filter,
  onFilterChange,
  onExportCSV,
  onPrint,
}: FinancialSummaryContentProps) {
  const params: Record<string, string> = {}
  if (filter.year) params.year = filter.year
  if (filter.month && filter.month !== "0") params.month = filter.month

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", "financial-summary", params],
    queryFn: async (): Promise<{ data: FinancialSummaryReport }> => {
      const res = await api.get(REPORT_ENDPOINTS["financial-summary"], { params })
      return res.data
    },
    staleTime: 60_000,
  })

  const report = data?.data

  const handleExport = () => {
    if (!report?.monthlyBreakdown?.length) return
    const rows = report.monthlyBreakdown.map((m) => ({
      Yil: m.year,
      Ay: MONTH_LABELS[m.month] ?? String(m.month),
      "Ithalat Maliyeti (USD)": m.importCost,
      "Satis Geliri (USD)": m.salesRevenue,
      "Kar/Zarar (USD)": m.profit,
      "Satilan Arac": m.vehiclesSold,
      "Ithal Edilen Arac": m.vehiclesImported,
    }))
    exportToCSV(rows, "finansal-ozet")
    onExportCSV()
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 border-b pb-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Yıl</Label>
          <Select
            value={filter.year}
            onValueChange={(val) => onFilterChange({ ...filter, year: val })}
          >
            <SelectTrigger className="w-[110px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ay (opsiyonel)</Label>
          <Select
            value={filter.month}
            onValueChange={(val) => onFilterChange({ ...filter, month: val })}
          >
            <SelectTrigger className="w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Tüm Yıl</SelectItem>
              {Object.entries(MONTH_LABELS).map(([num, label]) => (
                <SelectItem key={num} value={num}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <SummaryCard
            label="Toplam Satış Geliri"
            value={formatUSD(report.summary.totalSalesRevenue)}
            highlight
          />
          <SummaryCard
            label="Toplam İthalat Maliyeti"
            value={formatUSD(report.summary.totalImportCost)}
          />
          <SummaryCard
            label="Net Kar"
            value={formatUSD(report.summary.totalProfit)}
            highlight={report.summary.totalProfit > 0}
            warning={report.summary.totalProfit < 0}
          />
          <SummaryCard
            label="Ort. Kar Marjı"
            value={formatPercent(report.summary.avgProfitMargin)}
          />
          <SummaryCard label="Satılan Araç" value={String(report.summary.vehiclesSold)} />
          <SummaryCard
            label="İthal Edilen Araç"
            value={String(report.summary.vehiclesImported)}
          />
        </div>
      )}

      {/* Table */}
      <ReportTableWrapper
        isLoading={isLoading}
        error={error}
        isEmpty={!report?.monthlyBreakdown?.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dönem</TableHead>
              <TableHead className="text-right">İthalat Maliyeti</TableHead>
              <TableHead className="text-right">Satış Geliri</TableHead>
              <TableHead className="text-right">Kar / Zarar</TableHead>
              <TableHead className="text-right">Satılan</TableHead>
              <TableHead className="text-right">İthal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.monthlyBreakdown?.map((m) => (
              <TableRow key={`${m.year}-${m.month}`}>
                <TableCell className="font-medium">
                  {MONTH_LABELS[m.month] ?? m.month} {m.year}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(m.importCost)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm tabular-nums ${SEMANTIC_COLORS.profit}`}
                >
                  {formatUSD(m.salesRevenue)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm font-medium tabular-nums ${
                    m.profit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                  }`}
                >
                  {formatUSD(m.profit)}
                </TableCell>
                <TableCell className="text-right text-sm">{m.vehiclesSold}</TableCell>
                <TableCell className="text-right text-sm">{m.vehiclesImported}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableWrapper>
    </div>
  )
}
