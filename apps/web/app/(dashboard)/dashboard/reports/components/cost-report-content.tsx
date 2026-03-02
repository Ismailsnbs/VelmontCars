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
import { CALCULATOR_COLORS } from "@/lib/design-tokens"
import type { CostReport, DateRangeFilter } from "../types"
import { REPORT_ENDPOINTS } from "../constants"
import { formatUSD, formatTRY, formatDate, exportToCSV } from "../utils"
import { SummaryCard, DateRangeFields } from "./summary-card"
import { ReportTableWrapper } from "./report-table-wrapper"

interface CostReportContentProps {
  filter: DateRangeFilter
  onFilterChange: (f: DateRangeFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

export function CostReportContent({
  filter,
  onFilterChange,
  onExportCSV,
  onPrint,
}: CostReportContentProps) {
  const params: Record<string, string> = {}
  if (filter.startDate) params.startDate = filter.startDate
  if (filter.endDate) params.endDate = filter.endDate

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", "costs", params],
    queryFn: async (): Promise<{ data: CostReport }> => {
      const res = await api.get(REPORT_ENDPOINTS["costs"], { params })
      return res.data
    },
    staleTime: 60_000,
  })

  const report = data?.data

  const handleExport = () => {
    if (!report?.calculations?.length) return
    const rows = report.calculations.map((c) => ({
      "Mensei Ulke": c.originCountry,
      "Motor CC": c.engineCC,
      "Arac Tipi": c.vehicleType,
      "Model Yili": c.modelYear,
      "CIF (USD)": c.cifValue,
      "Gumruk Vergisi": c.customsDuty,
      KDV: c.kdv,
      FIF: c.fif,
      "Genel FIF": c.generalFif,
      GKK: c.gkk,
      Rihtim: c.wharfFee,
      Bandrol: c.bandrol,
      "Diger Ucretler": c.otherFees,
      "Toplam Vergi": c.totalTaxes,
      "Toplam Maliyet (USD)": c.totalCostUSD,
      "Toplam Maliyet (TL)": c.totalCostTL,
      "Doviz Kuru": c.exchangeRate,
      Tarih: formatDate(c.calculatedAt),
    }))
    exportToCSV(rows, "maliyet-raporu")
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
          <SummaryCard
            label="Toplam Hesaplama"
            value={String(report.summary.totalCalculations)}
          />
          <SummaryCard
            label="Ort. CIF (USD)"
            value={formatUSD(report.summary.avgCIF)}
          />
          <SummaryCard
            label="Ort. Toplam Maliyet"
            value={formatUSD(report.summary.avgTotalCost)}
          />
          <SummaryCard
            label="Toplam Vergi (USD)"
            value={formatUSD(report.summary.totalTaxesPaid)}
            warning
          />
          <SummaryCard
            label="Toplam Maliyet (USD)"
            value={formatUSD(report.summary.totalCostUSD)}
          />
          <SummaryCard
            label="Toplam Maliyet (TL)"
            value={formatTRY(report.summary.totalCostTL)}
          />
        </div>
      )}

      {/* Table */}
      <ReportTableWrapper
        isLoading={isLoading}
        error={error}
        isEmpty={!report?.calculations?.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Menşei</TableHead>
              <TableHead>Motor CC</TableHead>
              <TableHead>Araç Tipi</TableHead>
              <TableHead className="text-right">CIF (USD)</TableHead>
              <TableHead className="text-right">Toplam Vergi</TableHead>
              <TableHead className="text-right">Toplam (USD)</TableHead>
              <TableHead className="text-right">Toplam (TL)</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.calculations?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.originCountry}</TableCell>
                <TableCell>{c.engineCC} cc</TableCell>
                <TableCell className="text-sm text-gray-600">{c.vehicleType}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(c.cifValue)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm tabular-nums ${CALCULATOR_COLORS.taxTotalRow}`}
                >
                  {formatUSD(c.totalTaxes)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                  {formatUSD(c.totalCostUSD)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatTRY(c.totalCostTL)}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(c.calculatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableWrapper>
    </div>
  )
}
