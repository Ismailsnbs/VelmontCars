"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Percent,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

import api from "@/lib/api"
import {
  FINANCE_CHART_COLORS,
  STAT_CARD_ACCENTS,
  SEMANTIC_COLORS,
  CHART_INFRASTRUCTURE,
  ALERT_COLORS,
} from "@/lib/design-tokens"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

// ─── Sabitler ──────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
]

const CURRENT_YEAR = new Date().getFullYear()

// Desteklenen yıl aralığı
const YEARS = [2024, 2025, 2026, 2027].filter((y) => y <= CURRENT_YEAR + 1)

// ─── Tipler ────────────────────────────────────────────────────────────────

interface MonthlyBreakdownItem {
  year: number
  month: number
  importCost: number
  salesRevenue: number
  profit: number
  vehiclesSold: number
  vehiclesImported: number
}

interface FinancialSummary {
  totalImportCost: number
  totalSalesRevenue: number
  totalProfit: number
  avgProfitMargin: number
  vehiclesSold: number
  vehiclesImported: number
}

interface FinancialSummaryResponse {
  generatedAt: string
  galleryId: string
  filters: {
    year?: number
    month?: number
  }
  summary: FinancialSummary
  monthlyBreakdown: MonthlyBreakdownItem[]
}

// ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────

function formatUSD(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `%${value.toFixed(1)}`
}

// ─── Özet Kart Bileşeni ────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  subtitle?: string
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  subtitle,
}: SummaryCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Grafik için veri dönüşümü ─────────────────────────────────────────────

interface ChartItem {
  name: string
  gelir: number
  gider: number
  kar: number
}

function buildChartData(monthlyBreakdown: MonthlyBreakdownItem[]): ChartItem[] {
  return monthlyBreakdown.map((item) => ({
    name: MONTH_NAMES[item.month - 1] ?? `Ay ${item.month}`,
    gelir: item.salesRevenue,
    gider: item.importCost,
    kar: item.profit,
  }))
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [selectedYear, setSelectedYear] = React.useState<number>(CURRENT_YEAR)
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null)

  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number> = { year: selectedYear }
    if (selectedMonth !== null) {
      params.month = selectedMonth
    }
    return params
  }, [selectedYear, selectedMonth])

  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useQuery<FinancialSummaryResponse>({
    queryKey: ["financial-summary", selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await api.get("/reports/financial-summary", {
        params: queryParams,
      })
      // API yanıt formatı: { success: true, data: FinancialSummaryResponse }
      return response.data.data ?? response.data
    },
  })

  const chartData = React.useMemo(() => {
    if (!reportData?.monthlyBreakdown) return []
    return buildChartData(reportData.monthlyBreakdown)
  }, [reportData])

  const summary = reportData?.summary

  // Net kar pozitif mi?
  const isProfit = (summary?.totalProfit ?? 0) >= 0

  // ─── Yüklenme Durumu ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-10 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-10 w-36" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-3">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-72 w-full" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Hata Durumu ──────────────────────────────────────────────────────────

  if (isError) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Finansal özet yüklenirken bir hata oluştu"
    return (
      <div className={`rounded-lg border ${ALERT_COLORS.error.wrapper} p-6`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={`h-5 w-5 ${SEMANTIC_COLORS.expenseCell}`} />
          <p className={`text-sm font-medium ${ALERT_COLORS.error.text}`}>{errorMessage}</p>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finansal Özet</h1>
        <p className="mt-2 text-gray-600">
          Gelir, gider ve kar/zarar analizi
        </p>
      </div>

      {/* ── Filtreler ─────────────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Yıl Seçimi */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Yıl:
              </label>
              <Select
                value={String(selectedYear)}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ay Seçimi */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Ay:
              </label>
              <Select
                value={selectedMonth === null ? "all" : String(selectedMonth)}
                onValueChange={(val) =>
                  setSelectedMonth(val === "all" ? null : Number(val))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre bilgisi */}
            {summary && (
              <p className="text-xs text-gray-400">
                {summary.vehiclesSold} araç satıldı •{" "}
                {summary.vehiclesImported} araç ithal edildi
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Özet Kartlar (4 adet) ─────────────────────────────────────────── */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Toplam Gelir */}
          <SummaryCard
            title="Toplam Gelir"
            value={formatUSD(summary.totalSalesRevenue)}
            icon={DollarSign}
            iconColor={STAT_CARD_ACCENTS.revenue.color}
            iconBg={STAT_CARD_ACCENTS.revenue.bg}
            subtitle={`${summary.vehiclesSold} araç satışından`}
          />

          {/* Toplam Gider */}
          <SummaryCard
            title="Toplam Gider"
            value={formatUSD(summary.totalImportCost)}
            icon={Receipt}
            iconColor={STAT_CARD_ACCENTS.expense.color}
            iconBg={STAT_CARD_ACCENTS.expense.bg}
            subtitle={`${summary.vehiclesImported} araç ithalat maliyeti`}
          />

          {/* Net Kar/Zarar */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Net Kar / Zarar
                </CardTitle>
                <div
                  className={`rounded-lg p-2 ${
                    isProfit
                      ? STAT_CARD_ACCENTS.profitPositive.bg
                      : STAT_CARD_ACCENTS.profitNegative.bg
                  }`}
                >
                  {isProfit ? (
                    <TrendingUp
                      className={`h-5 w-5 ${STAT_CARD_ACCENTS.profitPositive.color}`}
                    />
                  ) : (
                    <TrendingDown
                      className={`h-5 w-5 ${STAT_CARD_ACCENTS.profitNegative.color}`}
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  isProfit ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                }`}
              >
                {formatUSD(summary.totalProfit)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {isProfit ? "Karda" : "Zararda"}
              </p>
            </CardContent>
          </Card>

          {/* Kar Marjı */}
          <SummaryCard
            title="Kar Marjı"
            value={formatPercent(summary.avgProfitMargin)}
            icon={Percent}
            iconColor={
              summary.avgProfitMargin >= 0
                ? STAT_CARD_ACCENTS.margin.color
                : STAT_CARD_ACCENTS.marginNegative.color
            }
            iconBg={
              summary.avgProfitMargin >= 0
                ? STAT_CARD_ACCENTS.margin.bg
                : STAT_CARD_ACCENTS.marginNegative.bg
            }
            subtitle="Ortalama satış kar marjı"
          />
        </div>
      )}

      {/* ── Veri yok uyarısı ─────────────────────────────────────────────── */}
      {!summary && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
          <p className="font-medium">Finansal veri bulunamadı</p>
          <p className="text-sm text-muted-foreground">
            Seçilen dönem için veri bulunmamaktadır.
          </p>
        </div>
      )}

      {/* ── Grafikler ─────────────────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Aylık Gelir/Gider Bar Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Aylık Gelir / Gider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_INFRASTRUCTURE.gridStroke} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number, name: string) => [
                      formatUSD(value),
                      name === "gelir" ? "Gelir" : "Gider",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(val: string) =>
                      val === "gelir" ? "Gelir" : "Gider"
                    }
                  />
                  <Bar
                    dataKey="gelir"
                    name="gelir"
                    fill={FINANCE_CHART_COLORS.revenue}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="gider"
                    name="gider"
                    fill={FINANCE_CHART_COLORS.expense}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Kar Trendi Line Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Kar Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_INFRASTRUCTURE.gridStroke} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : v <= -1000
                          ? `-${(Math.abs(v) / 1000).toFixed(0)}k`
                          : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number) => [
                      formatUSD(value),
                      "Net Kar",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={() => "Net Kar"}
                  />
                  {/* Sıfır referans çizgisi */}
                  <ReferenceLine
                    y={0}
                    stroke={CHART_INFRASTRUCTURE.referenceLineStroke}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="kar"
                    name="kar"
                    stroke={FINANCE_CHART_COLORS.profit}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: FINANCE_CHART_COLORS.profit }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Aylık Detay Tablosu ───────────────────────────────────────────── */}
      {reportData?.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Aylık Detay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Ay</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                    <TableHead className="text-right">Gider</TableHead>
                    <TableHead className="text-right">Kar / Zarar</TableHead>
                    <TableHead className="text-right">Kar Marjı</TableHead>
                    <TableHead className="text-right">Satış</TableHead>
                    <TableHead className="text-right">İthalat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.monthlyBreakdown.map((item) => {
                    const margin =
                      item.salesRevenue > 0
                        ? (item.profit / item.salesRevenue) * 100
                        : 0
                    const isRowProfit = item.profit >= 0

                    return (
                      <TableRow
                        key={`${item.year}-${item.month}`}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="font-medium">
                          {MONTH_NAMES[item.month - 1] ?? `Ay ${item.month}`}
                        </TableCell>
                        <TableCell
                          className={`text-right ${SEMANTIC_COLORS.revenueCell}`}
                        >
                          {formatUSD(item.salesRevenue)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${SEMANTIC_COLORS.expenseCell}`}
                        >
                          {formatUSD(item.importCost)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isRowProfit ? SEMANTIC_COLORS.profit : SEMANTIC_COLORS.loss
                          }`}
                        >
                          {formatUSD(item.profit)}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm ${
                            margin >= 0 ? "text-gray-700" : SEMANTIC_COLORS.loss
                          }`}
                        >
                          {formatPercent(margin)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {item.vehiclesSold}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {item.vehiclesImported}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aylık kırılım boşsa bilgi mesajı */}
      {summary && chartData.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <p className="text-center text-sm text-gray-400">
              Bu dönem için aylık kırılım verisi bulunmuyor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
