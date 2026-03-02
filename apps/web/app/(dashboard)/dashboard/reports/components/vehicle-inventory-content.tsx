"use client"

import { useQuery } from "@tanstack/react-query"
import { FileSpreadsheet, Printer } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { STATUS_LABELS as TOKEN_STATUS_LABELS } from "@/lib/design-tokens"
import type { VehicleInventoryFilter, VehicleInventoryReport } from "../types"
import { REPORT_ENDPOINTS } from "../constants"
import { formatUSD, formatDate, exportToCSV } from "../utils"
import { SummaryCard, DateRangeFields } from "./summary-card"
import { ReportTableWrapper, VehicleStatusBadge } from "./report-table-wrapper"

interface VehicleInventoryContentProps {
  filter: VehicleInventoryFilter
  onFilterChange: (f: VehicleInventoryFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

export function VehicleInventoryContent({
  filter,
  onFilterChange,
  onExportCSV,
  onPrint,
}: VehicleInventoryContentProps) {
  const params: Record<string, string> = {}
  if (filter.status && filter.status !== "all") params.status = filter.status
  if (filter.startDate) params.startDate = filter.startDate
  if (filter.endDate) params.endDate = filter.endDate

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", "vehicle-inventory", params],
    queryFn: async (): Promise<{ data: VehicleInventoryReport }> => {
      const res = await api.get(REPORT_ENDPOINTS["vehicle-inventory"], { params })
      return res.data
    },
    staleTime: 60_000,
  })

  const report = data?.data

  const handleExport = () => {
    if (!report?.vehicles?.length) return
    const rows = report.vehicles.map((v) => ({
      Marka: v.brand,
      Model: v.model,
      Yil: v.year,
      VIN: v.vin ?? "",
      Durum: TOKEN_STATUS_LABELS[v.status as keyof typeof TOKEN_STATUS_LABELS] ?? v.status,
      Renk: v.color ?? "",
      Km: v.mileage ?? "",
      "Motor CC": v.engineCC,
      "Mensei Ulke": v.originCountry,
      "FOB Fiyati (USD)": v.fobPrice,
      "Satis Fiyati (USD)": v.salePrice ?? "",
      "Toplam Maliyet (USD)": v.totalCost ?? "",
      "Ithalat Maliyeti (USD)": v.totalImportCost ?? "",
      "Ekstra Giderler (USD)": v.additionalExpenses,
      "Giris Tarihi": formatDate(v.createdAt),
      "Satis Tarihi": formatDate(v.soldDate),
    }))
    exportToCSV(rows, "arac-envanter-raporu")
    onExportCSV()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 border-b pb-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Durum</Label>
          <Select
            value={filter.status}
            onValueChange={(val) => onFilterChange({ ...filter, status: val })}
          >
            <SelectTrigger className="w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="TRANSIT">Transit</SelectItem>
              <SelectItem value="IN_STOCK">Stokta</SelectItem>
              <SelectItem value="SOLD">Satıldı</SelectItem>
              <SelectItem value="RESERVED">Rezerve</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DateRangeFields
          value={{ startDate: filter.startDate, endDate: filter.endDate }}
          onChange={(df) => onFilterChange({ ...filter, ...df })}
        />
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Toplam Araç" value={String(report.summary.total)} />
          <SummaryCard label="Transit" value={String(report.summary.transit)} />
          <SummaryCard label="Stokta" value={String(report.summary.inStock)} highlight />
          <SummaryCard label="Satıldı" value={String(report.summary.sold)} />
        </div>
      )}

      {/* Table */}
      <ReportTableWrapper isLoading={isLoading} error={error} isEmpty={!report?.vehicles?.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marka / Model</TableHead>
              <TableHead>Yıl</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Renk</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Menşei</TableHead>
              <TableHead className="text-right">FOB (USD)</TableHead>
              <TableHead className="text-right">Toplam Maliyet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.vehicles?.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">
                  {v.brand} {v.model}
                </TableCell>
                <TableCell>{v.year}</TableCell>
                <TableCell>
                  <VehicleStatusBadge status={v.status} />
                </TableCell>
                <TableCell>{v.color ?? "-"}</TableCell>
                <TableCell>
                  {v.mileage != null ? v.mileage.toLocaleString("tr-TR") : "-"}
                </TableCell>
                <TableCell>{v.originCountry}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatUSD(v.fobPrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {v.totalCost != null ? formatUSD(v.totalCost) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableWrapper>
    </div>
  )
}
