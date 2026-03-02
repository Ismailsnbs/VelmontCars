import { Car, BarChart3, Calculator, Package, DollarSign, TrendingUp } from "lucide-react"
import {
  REPORT_ICON_COLORS,
} from "@/lib/design-tokens"
import type { ReportType } from "./types"

// ─── API endpoints ────────────────────────────────────────────────────────────

export const REPORT_ENDPOINTS: Record<ReportType, string> = {
  "vehicle-inventory": "/reports/vehicle-inventory",
  "vehicle-status": "/reports/vehicle-status",
  costs: "/reports/costs",
  stock: "/reports/stock",
  sales: "/reports/sales",
  "financial-summary": "/reports/financial-summary",
}

// ─── Month labels ─────────────────────────────────────────────────────────────

export const MONTH_LABELS: Record<number, string> = {
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

// ─── Report card metadata ─────────────────────────────────────────────────────

export interface ReportCardMeta {
  type: ReportType
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
}

export const REPORT_CARDS: ReportCardMeta[] = [
  {
    type: "vehicle-inventory",
    title: "Araç Envanter Raporu",
    description: "Tüm araçların detaylı listesi, maliyet ve satış bilgileri",
    icon: Car,
    iconColor: REPORT_ICON_COLORS.vehicles,
  },
  {
    type: "vehicle-status",
    title: "Araç Durum Özeti",
    description: "Araçların durum dağılımı ve stok değeri",
    icon: BarChart3,
    iconColor: REPORT_ICON_COLORS.status,
  },
  {
    type: "costs",
    title: "Maliyet Raporu",
    description: "İthalat hesaplama maliyetleri ve vergi detayları",
    icon: Calculator,
    iconColor: REPORT_ICON_COLORS.costs,
  },
  {
    type: "stock",
    title: "Stok Raporu",
    description: "Ürün stok durumu, düşük stok uyarıları ve stok değeri",
    icon: Package,
    iconColor: REPORT_ICON_COLORS.stock,
  },
  {
    type: "sales",
    title: "Satış Raporu",
    description: "Araç satışları, kar/zarar ve kar marjı analizi",
    icon: DollarSign,
    iconColor: REPORT_ICON_COLORS.sales,
  },
  {
    type: "financial-summary",
    title: "Finansal Özet",
    description: "Aylık gelir, gider ve kar/zarar özeti",
    icon: TrendingUp,
    iconColor: REPORT_ICON_COLORS.financial,
  },
]
