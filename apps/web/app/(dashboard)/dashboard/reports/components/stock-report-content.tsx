"use client"

import { useQuery } from "@tanstack/react-query"
import { FileSpreadsheet, Printer, AlertTriangle } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SEMANTIC_COLORS, LOW_STOCK_ALERT } from "@/lib/design-tokens"
import type { StockReport } from "../types"
import { REPORT_ENDPOINTS } from "../constants"
import { formatTRY, exportToCSV } from "../utils"
import { SummaryCard } from "./summary-card"
import { ReportTableWrapper } from "./report-table-wrapper"

interface StockReportContentProps {
  onExportCSV: () => void
  onPrint: () => void
}

export function StockReportContent({ onExportCSV, onPrint }: StockReportContentProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["report", "stock"],
    queryFn: async (): Promise<{ data: StockReport }> => {
      const res = await api.get(REPORT_ENDPOINTS["stock"])
      return res.data
    },
    staleTime: 60_000,
  })

  const report = data?.data

  const handleExport = () => {
    if (!report?.allProducts?.length) return
    const rows = report.allProducts.map((p) => ({
      "Urun Adi": p.name,
      Kategori: p.category,
      Birim: p.unit,
      "Mevcut Stok": p.currentStock,
      "Min. Stok": p.minStockLevel,
      "Birim Fiyat (TL)": p.unitPrice,
      "Stok Degeri (TL)": p.stockValue,
      "Dusuk Stok": p.isLowStock ? "Evet" : "Hayir",
    }))
    exportToCSV(rows, "stok-raporu")
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
          <SummaryCard label="Toplam Ürün" value={String(report.summary.totalProducts)} />
          <SummaryCard
            label="Düşük Stok"
            value={String(report.summary.lowStockCount)}
            warning={report.summary.lowStockCount > 0}
          />
          <SummaryCard
            label="Toplam Stok Değeri"
            value={formatTRY(report.summary.totalStockValue)}
            highlight
          />
        </div>
      )}

      {/* Low stock warning */}
      {report && report.lowStockItems.length > 0 && (
        <div className={`rounded-lg border ${LOW_STOCK_ALERT.wrapper} p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`h-4 w-4 ${LOW_STOCK_ALERT.icon}`} />
            <span className={`text-sm font-medium ${LOW_STOCK_ALERT.text}`}>
              {report.lowStockItems.length} ürün düşük stok seviyesinde
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.lowStockItems.map((item) => (
              <Badge key={item.id} variant="outline" className={LOW_STOCK_ALERT.badge}>
                {item.name} ({item.currentStock}/{item.minStockLevel})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <ReportTableWrapper isLoading={isLoading} error={error} isEmpty={!report?.allProducts?.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün Adı</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead className="text-right">Mevcut Stok</TableHead>
              <TableHead className="text-right">Min. Stok</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">Stok Değeri</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.allProducts?.map((p) => (
              <TableRow
                key={p.id}
                className={p.isLowStock ? LOW_STOCK_ALERT.row : undefined}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.isLowStock && (
                      <AlertTriangle
                        className={`h-3.5 w-3.5 ${SEMANTIC_COLORS.expenseCell} flex-shrink-0`}
                      />
                    )}
                    {p.name}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{p.category}</TableCell>
                <TableCell className="text-sm">{p.unit}</TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    p.isLowStock ? SEMANTIC_COLORS.loss : ""
                  }`}
                >
                  {p.currentStock}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500">
                  {p.minStockLevel}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatTRY(p.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                  {formatTRY(p.stockValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportTableWrapper>
    </div>
  )
}
