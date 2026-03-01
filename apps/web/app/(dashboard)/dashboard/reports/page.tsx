"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Car,
  BarChart3,
  Calculator,
  Package,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Loader2,
  AlertTriangle,
} from "lucide-react"

import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS as TOKEN_STATUS_LABELS,
  SEMANTIC_COLORS,
  ALERT_COLORS,
} from "@/lib/design-tokens"

// ─── Sabitler ──────────────────────────────────────────────────────────────

type ReportType =
  | "vehicle-inventory"
  | "vehicle-status"
  | "costs"
  | "stock"
  | "sales"
  | "financial-summary"

const REPORT_ENDPOINTS: Record<ReportType, string> = {
  "vehicle-inventory": "/reports/vehicle-inventory",
  "vehicle-status": "/reports/vehicle-status",
  costs: "/reports/costs",
  stock: "/reports/stock",
  sales: "/reports/sales",
  "financial-summary": "/reports/financial-summary",
}

const MONTH_LABELS: Record<number, string> = {
  1: "Ocak",
  2: "Şubat",
  3: "Mart",
  4: "Nisan",
  5: "Mayıs",
  6: "Haziran",
  7: "Temmuz",
  8: "Ağustos",
  9: "Eylül",
  10: "Ekim",
  11: "Kasım",
  12: "Aralık",
}

// ─── Tip tanımları ─────────────────────────────────────────────────────────

interface VehicleInventoryItem {
  id: string
  brand: string
  model: string
  year: number
  status: string
  vin: string | null
  color: string | null
  mileage: number | null
  fuelType: string | null
  transmission: string | null
  engineCC: number
  originCountry: string
  fobPrice: number
  salePrice: number | null
  totalCost: number | null
  totalImportCost: number | null
  additionalExpenses: number
  createdAt: string
  soldDate: string | null
  arrivalDate: string | null
  estimatedArrival: string | null
}

interface VehicleInventoryReport {
  generatedAt: string
  summary: {
    total: number
    transit: number
    inStock: number
    sold: number
    reserved: number
  }
  vehicles: VehicleInventoryItem[]
}

interface VehicleStatusBreakdownItem {
  status: string
  count: number
  totalFobValue: number
  totalCostValue: number
}

interface VehicleStatusSummaryReport {
  generatedAt: string
  summary: {
    total: number
    transit: number
    inStock: number
    sold: number
    reserved: number
    activeInventoryValue: number
    soldInventoryValue: number
  }
  breakdown: VehicleStatusBreakdownItem[]
}

interface CostReportItem {
  id: string
  originCountry: string
  engineCC: number
  vehicleType: string
  modelYear: number
  cifValue: number
  customsDuty: number
  kdv: number
  fif: number
  generalFif: number
  gkk: number
  wharfFee: number
  bandrol: number
  otherFees: number
  totalTaxes: number
  totalCostUSD: number
  totalCostTL: number
  exchangeRate: number
  calculatedAt: string
}

interface CostReport {
  generatedAt: string
  summary: {
    totalCalculations: number
    avgCIF: number
    avgTotalCost: number
    totalTaxesPaid: number
    totalCostUSD: number
    totalCostTL: number
  }
  calculations: CostReportItem[]
}

interface StockProductItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStockLevel: number
  unitPrice: number
  stockValue: number
  isLowStock: boolean
  lastPurchaseAt: string | null
}

interface StockReport {
  generatedAt: string
  summary: {
    totalProducts: number
    lowStockCount: number
    totalStockValue: number
    categoryBreakdown: Array<{
      category: string
      count: number
      totalValue: number
      totalStock: number
    }>
  }
  lowStockItems: Array<{
    id: string
    name: string
    category: string
    unit: string
    currentStock: number
    minStockLevel: number
    deficit: number
    unitPrice: number
  }>
  allProducts: StockProductItem[]
}

interface SalesReportItem {
  id: string
  vehicleId: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: number
  customerName: string
  salePrice: number
  totalCost: number
  profit: number
  profitMargin: number
  saleDate: string
  paymentType: string | null
}

interface SalesReport {
  generatedAt: string
  summary: {
    totalSales: number
    totalRevenue: number
    totalCost: number
    totalProfit: number
    avgProfitMargin: number
  }
  sales: SalesReportItem[]
}

interface MonthlyFinancialItem {
  year: number
  month: number
  importCost: number
  salesRevenue: number
  profit: number
  vehiclesSold: number
  vehiclesImported: number
}

interface FinancialSummaryReport {
  generatedAt: string
  summary: {
    totalImportCost: number
    totalSalesRevenue: number
    totalProfit: number
    avgProfitMargin: number
    vehiclesSold: number
    vehiclesImported: number
  }
  monthlyBreakdown: MonthlyFinancialItem[]
}

// ─── Filtre state tipleri ──────────────────────────────────────────────────

interface DateRangeFilter {
  startDate: string
  endDate: string
}

interface FinancialFilter {
  year: string
  month: string
}

interface VehicleInventoryFilter extends DateRangeFilter {
  status: string
}

// ─── Yardımcı fonksiyonlar ─────────────────────────────────────────────────

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `%${value.toFixed(1)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("tr-TR")
}

// CSV Export — virgül, tırnak, satır sonu escape eder
function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          if (val === null || val === undefined) return ""
          const strVal = String(val)
          if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
            return `"${strVal.replace(/"/g, '""')}"`
          }
          return strVal
        })
        .join(",")
    ),
  ]
  const csv = csvRows.join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

// ─── Rapor kartı meta bilgileri ─────────────────────────────────────────────

interface ReportCardMeta {
  type: ReportType
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
}

const REPORT_CARDS: ReportCardMeta[] = [
  {
    type: "vehicle-inventory",
    title: "Araç Envanter Raporu",
    description: "Tüm araçların detaylı listesi, maliyet ve satış bilgileri",
    icon: Car,
    iconColor: "text-blue-500",
  },
  {
    type: "vehicle-status",
    title: "Araç Durum Özeti",
    description: "Araçların durum dağılımı ve stok değeri",
    icon: BarChart3,
    iconColor: "text-purple-500",
  },
  {
    type: "costs",
    title: "Maliyet Raporu",
    description: "İthalat hesaplama maliyetleri ve vergi detayları",
    icon: Calculator,
    iconColor: "text-orange-500",
  },
  {
    type: "stock",
    title: "Stok Raporu",
    description: "Ürün stok durumu, düşük stok uyarıları ve stok değeri",
    icon: Package,
    iconColor: "text-green-500",
  },
  {
    type: "sales",
    title: "Satış Raporu",
    description: "Araç satışları, kar/zarar ve kar marjı analizi",
    icon: DollarSign,
    iconColor: "text-emerald-500",
  },
  {
    type: "financial-summary",
    title: "Finansal Özet",
    description: "Aylık gelir, gider ve kar/zarar özeti",
    icon: TrendingUp,
    iconColor: "text-indigo-500",
  },
]

// ─── Özet kart bileşeni ─────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string
  highlight?: boolean
  warning?: boolean
}

function SummaryCard({ label, value, highlight, warning }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-lg font-bold ${
          highlight
            ? SEMANTIC_COLORS.profit
            : warning
            ? SEMANTIC_COLORS.loss
            : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// ─── Filtre alanı bileşenleri ───────────────────────────────────────────────

interface DateRangeFieldsProps {
  value: DateRangeFilter
  onChange: (v: DateRangeFilter) => void
}

function DateRangeFields({ value, onChange }: DateRangeFieldsProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Başlangıç Tarihi</Label>
        <Input
          type="date"
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          className="w-[160px] text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Bitiş Tarihi</Label>
        <Input
          type="date"
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          className="w-[160px] text-sm"
        />
      </div>
    </div>
  )
}

// ─── Rapor İçerikleri ──────────────────────────────────────────────────────

// 1. Araç Envanter Raporu
interface VehicleInventoryContentProps {
  filter: VehicleInventoryFilter
  onFilterChange: (f: VehicleInventoryFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

function VehicleInventoryContent({
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
      "Km": v.mileage ?? "",
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
      {/* Filtreler */}
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

      {/* Özet */}
      {report && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Toplam Araç" value={String(report.summary.total)} />
          <SummaryCard label="Transit" value={String(report.summary.transit)} />
          <SummaryCard label="Stokta" value={String(report.summary.inStock)} highlight />
          <SummaryCard label="Satıldı" value={String(report.summary.sold)} />
        </div>
      )}

      {/* Tablo */}
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
                <TableCell className="text-right font-mono text-sm">
                  {formatUSD(v.fobPrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
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

// 2. Araç Durum Özeti
interface VehicleStatusContentProps {
  onExportCSV: () => void
  onPrint: () => void
}

function VehicleStatusContent({ onExportCSV, onPrint }: VehicleStatusContentProps) {
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
      {/* Araçlar butonu */}
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

      {/* Özet */}
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

      {/* Tablo */}
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
                <TableCell className="text-right font-mono text-sm">
                  {formatUSD(item.totalFobValue)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
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

// 3. Maliyet Raporu
interface CostReportContentProps {
  filter: DateRangeFilter
  onFilterChange: (f: DateRangeFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

function CostReportContent({
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
      {/* Filtreler */}
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

      {/* Özet */}
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

      {/* Tablo */}
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
                <TableCell className="text-right font-mono text-sm">
                  {formatUSD(c.cifValue)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-orange-600">
                  {formatUSD(c.totalTaxes)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatUSD(c.totalCostUSD)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
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

// 4. Stok Raporu
interface StockReportContentProps {
  onExportCSV: () => void
  onPrint: () => void
}

function StockReportContent({ onExportCSV, onPrint }: StockReportContentProps) {
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
      {/* Butonlar */}
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

      {/* Özet */}
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

      {/* Düşük stok uyarısı */}
      {report && report.lowStockItems.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">
              {report.lowStockItems.length} ürün düşük stok seviyesinde
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.lowStockItems.map((item) => (
              <Badge key={item.id} variant="outline" className="border-orange-300 text-orange-700">
                {item.name} ({item.currentStock}/{item.minStockLevel})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tablo */}
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
                className={p.isLowStock ? "bg-red-50 hover:bg-red-100" : undefined}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.isLowStock && (
                      <AlertTriangle className={`h-3.5 w-3.5 ${SEMANTIC_COLORS.expenseCell} flex-shrink-0`} />
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
                <TableCell className="text-right font-mono text-sm">
                  {formatTRY(p.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
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

// 5. Satış Raporu
interface SalesReportContentProps {
  filter: DateRangeFilter
  onFilterChange: (f: DateRangeFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

function SalesReportContent({
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
      {/* Filtreler */}
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

      {/* Özet */}
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

      {/* Tablo */}
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
                <TableCell className="text-right font-mono text-sm">
                  {formatUSD(s.salePrice)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatUSD(s.totalCost)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm font-medium ${
                    s.profit >= 0 ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                  }`}
                >
                  {formatUSD(s.profit)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span
                    className={`font-medium ${
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

// 6. Finansal Özet
interface FinancialSummaryContentProps {
  filter: FinancialFilter
  onFilterChange: (f: FinancialFilter) => void
  onExportCSV: () => void
  onPrint: () => void
}

function FinancialSummaryContent({
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
      {/* Filtreler */}
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

      {/* Özet */}
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

      {/* Tablo */}
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
                <TableCell className="text-right font-mono text-sm">
                  {formatUSD(m.importCost)}
                </TableCell>
                <TableCell className={`text-right font-mono text-sm ${SEMANTIC_COLORS.profit}`}>
                  {formatUSD(m.salesRevenue)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm font-medium ${
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

// ─── Yardımcı bileşenler ────────────────────────────────────────────────────

function VehicleStatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_CLASSES[status as keyof typeof STATUS_BADGE_CLASSES] ?? "bg-gray-100 text-gray-600"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {TOKEN_STATUS_LABELS[status as keyof typeof TOKEN_STATUS_LABELS] ?? status}
    </span>
  )
}

interface ReportTableWrapperProps {
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  children: React.ReactNode
}

function ReportTableWrapper({
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

// ─── Rapor Dialog ───────────────────────────────────────────────────────────

interface ReportDialogProps {
  reportType: ReportType | null
  onClose: () => void
}

function ReportDialog({ reportType, onClose }: ReportDialogProps) {
  const { toast } = useToast()

  // Filtre state'leri — her rapor tipi için ayrı
  const [vehicleInventoryFilter, setVehicleInventoryFilter] =
    React.useState<VehicleInventoryFilter>({
      status: "all",
      startDate: "",
      endDate: "",
    })
  const [dateRangeFilter, setDateRangeFilter] = React.useState<DateRangeFilter>({
    startDate: "",
    endDate: "",
  })
  const [financialFilter, setFinancialFilter] = React.useState<FinancialFilter>({
    year: String(new Date().getFullYear()),
    month: "0",
  })

  // Dialog kapandığında filtreleri sıfırla
  React.useEffect(() => {
    if (!reportType) {
      setVehicleInventoryFilter({ status: "all", startDate: "", endDate: "" })
      setDateRangeFilter({ startDate: "", endDate: "" })
      setFinancialFilter({ year: String(new Date().getFullYear()), month: "0" })
    }
  }, [reportType])

  const meta = reportType ? REPORT_CARDS.find((c) => c.type === reportType) : null

  const handleExportCSV = () => {
    toast({ title: "Dışa Aktarıldı", description: "CSV dosyası indirildi." })
  }

  const handlePrint = () => {
    window.print()
  }

  const renderContent = () => {
    if (!reportType) return null

    switch (reportType) {
      case "vehicle-inventory":
        return (
          <VehicleInventoryContent
            filter={vehicleInventoryFilter}
            onFilterChange={setVehicleInventoryFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "vehicle-status":
        return (
          <VehicleStatusContent
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "costs":
        return (
          <CostReportContent
            filter={dateRangeFilter}
            onFilterChange={setDateRangeFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "stock":
        return (
          <StockReportContent
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "sales":
        return (
          <SalesReportContent
            filter={dateRangeFilter}
            onFilterChange={setDateRangeFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "financial-summary":
        return (
          <FinancialSummaryContent
            filter={financialFilter}
            onFilterChange={setFinancialFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={reportType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center gap-3">
            {meta && (
              <div className="rounded-lg bg-gray-100 p-2">
                <meta.icon className={`h-5 w-5 ${meta.iconColor}`} />
              </div>
            )}
            <div>
              <DialogTitle className="text-lg">
                {meta?.title ?? "Rapor"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {meta?.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Print-only başlık */}
        <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold">{meta?.title}</h1>
          <p className="text-sm text-gray-500">
            Oluşturulma: {new Date().toLocaleDateString("tr-TR")}
          </p>
        </div>

        <div className="mt-2">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeReport, setActiveReport] = React.useState<ReportType | null>(null)

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-1">
          Galeriye ait detaylı raporları görüntüleyin ve dışa aktarın
        </p>
      </div>

      {/* Rapor Kartları Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.type}
              className="cursor-pointer hover:shadow-md transition-all hover:border-gray-300 group"
              onClick={() => setActiveReport(card.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-gray-50 p-2.5 group-hover:bg-gray-100 transition-colors">
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight">{card.title}</CardTitle>
                    <CardDescription className="text-sm mt-1 leading-snug">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveReport(card.type)
                  }}
                >
                  Raporu Görüntüle
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Rapor Detay Dialog */}
      <ReportDialog
        reportType={activeReport}
        onClose={() => setActiveReport(null)}
      />
    </div>
  )
}
