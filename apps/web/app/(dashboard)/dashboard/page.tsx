"use client"

import { useEffect, useState, useRef } from "react"
import { useInView, animate } from "framer-motion"
import { MotionCard, cardHoverProps } from "@/components/shared/motion"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Car,
  Truck,
  Warehouse,
  DollarSign,
  Package,
  AlertTriangle,
} from "lucide-react"
import api from "@/lib/api"
import {
  STATUS_CHART_COLORS,
  CATEGORY_CHART_COLORS,
  CATEGORY_LABELS,
  CHART_PALETTE,
  CHART_COLORS,
  STAT_CARD_ACCENTS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  CHART_INFRASTRUCTURE,
  ALERT_COLORS,
  LOADER_COLORS,
  type VehicleStatus,
} from "@/lib/design-tokens"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface VehicleStats {
  total: number
  transit: number
  inStock: number
  sold: number
}

interface ProductStats {
  total: number
  lowStock: number
}

interface RecentVehicle {
  id: string
  brand: string
  model: string
  year: number
  status: string
  createdAt: string
}

interface DashboardData {
  vehicleStats: VehicleStats
  productStats: ProductStats
  recentVehicles: RecentVehicle[]
}

interface MonthlyIntakeItem {
  month: string
  count: number
}

interface StatusDistItem {
  status: string
  count: number
}

interface BrandDistItem {
  brand: string
  count: number
}

interface CostTrendItem {
  month: string
  totalCost: number
  avgCost: number
}

interface CategoryDistItem {
  category: string
  count: number
  value: number
}

interface ChartData {
  monthlyIntake: MonthlyIntakeItem[]
  statusDist: StatusDistItem[]
  brandDist: BrandDistItem[]
  costTrend: CostTrendItem[]
  categoryDist: CategoryDistItem[]
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || !ref.current) return
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("tr-TR")
      },
    })
    return () => controls.stop()
  }, [isInView, value])

  return <span ref={ref}>0</span>
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = "text-blue-500",
  bgColor = "bg-blue-50",
}: {
  title: string
  value: number | string
  icon: any
  color?: string
  bgColor?: string
}) {
  return (
    <MotionCard {...cardHoverProps} className="rounded-xl">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              {title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${bgColor}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tabular-nums">
            {typeof value === "number" ? <CountUp value={value} /> : value}
          </div>
        </CardContent>
      </Card>
    </MotionCard>
  )
}

export default function GalleryDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [chartLoading, setChartLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get("/dashboard")
        setData(response.data.data)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Pano yüklenirken bir hata oluştu"
        setError(message)
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    const fetchCharts = async () => {
      try {
        setChartLoading(true)
        const response = await api.get("/dashboard/charts")
        setChartData(response.data.data)
      } catch (err) {
        console.error("Dashboard charts fetch error:", err)
      } finally {
        setChartLoading(false)
      }
    }

    fetchStats()
    fetchCharts()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className={`h-8 w-8 animate-spin rounded-full border-4 ${LOADER_COLORS.primaryBorder} border-t-transparent`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg border ${ALERT_COLORS.error.wrapper} p-4`}>
        <p className={`text-sm ${ALERT_COLORS.error.text}`}>
          Pano verisi yüklenirken hata: {error}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`rounded-lg border ${ALERT_COLORS.warning.wrapper} p-4`}>
        <p className={`text-sm ${ALERT_COLORS.warning.text}`}>Pano verisi bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pano</h1>
        <p className="mt-2 text-gray-600">Galeri yönetim özeti</p>
      </div>

      {/* 6 Stats Cards in 3x2 Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Toplam Araç"
          value={data.vehicleStats.total}
          icon={Car}
          color={STAT_CARD_ACCENTS.totalVehicle.color}
          bgColor={STAT_CARD_ACCENTS.totalVehicle.bg}
        />
        <StatCard
          title="Transit Araç"
          value={data.vehicleStats.transit}
          icon={Truck}
          color={STAT_CARD_ACCENTS.transit.color}
          bgColor={STAT_CARD_ACCENTS.transit.bg}
        />
        <StatCard
          title="Stokta"
          value={data.vehicleStats.inStock}
          icon={Warehouse}
          color={STAT_CARD_ACCENTS.inStock.color}
          bgColor={STAT_CARD_ACCENTS.inStock.bg}
        />
        <StatCard
          title="Satıldı"
          value={data.vehicleStats.sold}
          icon={DollarSign}
          color={STAT_CARD_ACCENTS.sold.color}
          bgColor={STAT_CARD_ACCENTS.sold.bg}
        />
        <StatCard
          title="Toplam Ürün"
          value={data.productStats.total}
          icon={Package}
          color={STAT_CARD_ACCENTS.totalProduct.color}
          bgColor={STAT_CARD_ACCENTS.totalProduct.bg}
        />
        <StatCard
          title="Düşük Stok"
          value={data.productStats.lowStock}
          icon={AlertTriangle}
          color={
            data.productStats.lowStock > 0
              ? STAT_CARD_ACCENTS.lowStock.color
              : STAT_CARD_ACCENTS.lowStockInactive.color
          }
          bgColor={
            data.productStats.lowStock > 0
              ? STAT_CARD_ACCENTS.lowStock.bg
              : STAT_CARD_ACCENTS.lowStockInactive.bg
          }
        />
      </div>

      {/* Recent Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Son Eklenen Araçlar</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentVehicles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Car className="h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">Henüz araç eklenmemiş</p>
              <p className="text-sm text-muted-foreground">Araç ekleyerek başlayın</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                      Marka
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                      Model
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                      Yıl
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                      Durum
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                      Tarih
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {vehicle.brand}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {vehicle.model}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {vehicle.year}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[vehicle.status as VehicleStatus] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {STATUS_LABELS[vehicle.status as VehicleStatus] ?? vehicle.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(vehicle.createdAt).toLocaleDateString(
                          "tr-TR"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Charts Section ── */}
      {chartLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className={`h-8 w-8 animate-spin rounded-full border-4 ${LOADER_COLORS.primaryBorder} border-t-transparent`} />
        </div>
      ) : chartData ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analitik Grafikler
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Son 12 aylık istatistikler
            </p>
          </div>

          {/* Row 1: Monthly Intake (2/3) + Status Distribution (1/3) */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {/* 1. Aylık Araç Girişi — AreaChart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Aylık Araç Girişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={chartData.monthlyIntake}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="intakeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.primary}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.primary}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_INFRASTRUCTURE.gridStroke} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number) => [value, "Araç"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Araç Sayısı"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      fill="url(#intakeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 2. Araç Durum Dağılımı — PieChart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">
                  Araç Durum Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusDist}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      label={({ status, percent }) =>
                        `${status} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {chartData.statusDist.map((entry, index) => (
                        <Cell
                          key={`status-${index}`}
                          fill={
                            STATUS_CHART_COLORS[entry.status] ??
                            CHART_PALETTE[index % CHART_PALETTE.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number) => [value, "Araç"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Brand Distribution (1/2) + Cost Trend (1/2) */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {/* 3. Marka Dağılımı — Horizontal BarChart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Marka Dağılımı (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData.brandDist}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={CHART_INFRASTRUCTURE.gridStroke}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="brand"
                      width={72}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12 }}
                      formatter={(value: number) => [value, "Araç"]}
                    />
                    <Bar dataKey="count" name="Araç Sayısı" fill={CHART_COLORS.brand} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 4. Aylık Maliyet Trendi — LineChart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Aylık Maliyet Trendi (USD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={chartData.costTrend}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_INFRASTRUCTURE.gridStroke} />
                    <XAxis
                      dataKey="month"
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
                      formatter={(value: number) => [
                        `$${value.toLocaleString("tr-TR")}`,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(val: string) =>
                        val === "totalCost" ? "Toplam Maliyet" : "Ortalama Maliyet"
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCost"
                      name="totalCost"
                      stroke={CHART_COLORS.totalCost}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgCost"
                      name="avgCost"
                      stroke={CHART_COLORS.avgCost}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Product Category Distribution (1/3) */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {/* 5. Ürün Kategori Dağılımı — PieChart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">
                  Ürün Kategori Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.categoryDist.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-sm text-gray-400">Ürün verisi yok</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.categoryDist.map(item => ({ ...item, label: CATEGORY_LABELS[item.category] || item.category }))}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="45%"
                        outerRadius={90}
                        label={({ category, percent }) =>
                          `${category} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {chartData.categoryDist.map((entry, index) => (
                          <Cell
                            key={`cat-${index}`}
                            fill={
                              CATEGORY_CHART_COLORS[entry.category] ??
                              CHART_PALETTE[index % CHART_PALETTE.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(value: number, name: string) => [
                          name === "count"
                            ? `${value} ürün`
                            : `$${value.toLocaleString("tr-TR")}`,
                          name === "count" ? "Adet" : "Stok Değeri",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Empty space (2/3) — intentionally blank per layout spec */}
            <div className="lg:col-span-2" />
          </div>
        </div>
      ) : null}
    </div>
  )
}
