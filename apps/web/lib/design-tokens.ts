// ─── Design Tokens ────────────────────────────────────────────────────────
// Merkezi renk token dosyası. Tüm bileşen renkleri buradan yönetilir.
// Tailwind sınıfları ve Recharts hex değerleri tek kaynaktan beslenir.

// ─── Vehicle Status Types ─────────────────────────────────────────────────

export type VehicleStatus =
  | "TRANSIT"
  | "IN_STOCK"
  | "RESERVED"
  | "SOLD"
  | "CANCELLED"

// ─── Status Badge Classes (Tailwind) ──────────────────────────────────────

export const STATUS_BADGE_CLASSES: Record<VehicleStatus, string> = {
  TRANSIT:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  IN_STOCK:
    "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  RESERVED:
    "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  SOLD:
    "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200",
  CANCELLED:
    "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
}

// ─── Status Badge Variant (for shadcn Badge component) ────────────────────

export const STATUS_BADGE_VARIANT: Record<
  VehicleStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  IN_STOCK: "default",
  TRANSIT: "secondary",
  RESERVED: "outline",
  SOLD: "secondary",
  CANCELLED: "destructive",
}

// ─── Status Labels (Türkçe) ──────────────────────────────────────────────

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  TRANSIT: "Transit",
  IN_STOCK: "Stokta",
  RESERVED: "Rezerve",
  SOLD: "Satıldı",
  CANCELLED: "İptal",
}

// ─── Chart Palette (Recharts hex — sıralı fallback) ──────────────────────

export const CHART_PALETTE = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#a4de6c",
  "#d0ed57",
  "#6366f1",
  "#f97316",
] as const

// ─── Chart Colors (adlandırılmış hex) ────────────────────────────────────

export const CHART_COLORS = {
  primary: "#8884d8",
  brand: "#6366f1",
  totalCost: "#3b82f6",
  avgCost: "#f97316",
} as const

// ─── Status Chart Colors (Pie/Bar — Türkçe label bazlı) ──────────────────

export const STATUS_CHART_COLORS: Record<string, string> = {
  Transit: "#8b5cf6",
  Stokta: "#10b981",
  Satıldı: "#3b82f6",
  Rezerve: "#f59e0b",
}

// ─── Category Chart Colors (Pie — ürün kategorileri) ──────────────────────
// Key'ler enum değerleri (CATEGORY_BADGE_VARIANT ile senkron)
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  CLEANING: "#3b82f6",
  SPRAY: "#10b981",
  CLOTH: "#f59e0b",
  BRUSH: "#ef4444",
  CHEMICAL: "#8b5cf6",
  OTHER: "#6b7280",
}

// Enum → Türkçe label mapping (chart legend için)
export const CATEGORY_LABELS: Record<string, string> = {
  CLEANING: "Temizlik",
  SPRAY: "Sprey",
  CLOTH: "Bez",
  BRUSH: "Fırça",
  CHEMICAL: "Kimyasal",
  OTHER: "Diğer",
}

// ─── Finance Chart Colors ─────────────────────────────────────────────────

export const FINANCE_CHART_COLORS = {
  revenue: "#10b981",
  expense: "#ef4444",
  profit: "#3b82f6",
} as const

// ─── Stat Card Accents (icon renk + arka plan) ───────────────────────────

export const STAT_CARD_ACCENTS = {
  // Dashboard
  totalVehicle: { color: "text-blue-500", bg: "bg-blue-50" },
  transit: { color: "text-purple-500", bg: "bg-purple-50" },
  inStock: { color: "text-green-500", bg: "bg-green-50" },
  sold: { color: "text-emerald-500", bg: "bg-emerald-50" },
  totalProduct: { color: "text-orange-500", bg: "bg-orange-50" },
  lowStock: { color: "text-red-500", bg: "bg-red-50" },
  lowStockInactive: { color: "text-gray-400", bg: "bg-gray-50" },
  // Finance
  revenue: { color: "text-green-600", bg: "bg-green-50" },
  expense: { color: "text-red-500", bg: "bg-red-50" },
  profitPositive: { color: "text-green-600", bg: "bg-green-50" },
  profitNegative: { color: "text-red-500", bg: "bg-red-50" },
  margin: { color: "text-blue-500", bg: "bg-blue-50" },
  marginNegative: { color: "text-red-500", bg: "bg-red-50" },
  // Master
  gallery: { color: "text-blue-600" },
  taxRates: { color: "text-green-600" },
  exchangeRates: { color: "text-yellow-600" },
  countries: { color: "text-purple-600" },
} as const

// ─── Semantic Colors ──────────────────────────────────────────────────────

export const SEMANTIC_COLORS = {
  profit: "text-green-600",
  loss: "text-red-600",
  neutral: "text-gray-600",
  link: "text-blue-600",
  revenueCell: "text-green-600",
  expenseCell: "text-red-500",
  alertIcon: "text-red-500",
  lowStockRowBg: "bg-red-50",
} as const

// ─── Category Badge Variant (ürün kategori → Badge variant) ───────────────

export const CATEGORY_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  CLEANING: "default",
  SPRAY: "secondary",
  CLOTH: "outline",
  BRUSH: "default",
  CHEMICAL: "destructive",
  OTHER: "outline",
}

// ─── Chart Infrastructure (Recharts grid / referans çizgi) ──────────────

export const CHART_INFRASTRUCTURE = {
  gridStroke: "#f0f0f0",
  referenceLineStroke: "#6b7280",
} as const

// ─── Alert / Bildirim Kutusu Renkleri ───────────────────────────────────

export const ALERT_COLORS = {
  error: {
    wrapper: "border-red-200 bg-red-50",
    text: "text-red-800",
  },
  warning: {
    wrapper: "border-yellow-200 bg-yellow-50",
    text: "text-yellow-800",
  },
  info: {
    wrapper: "border-blue-100 bg-blue-50",
    text: "text-blue-700",
  },
  success: {
    wrapper: "border-green-200 bg-green-50",
    text: "text-green-800",
  },
} as const

// ─── Form Doğrulama Renkleri ────────────────────────────────────────────

export const FORM_COLORS = {
  error: "text-red-500",
} as const

// ─── Yükleme / Spinner Renkleri ─────────────────────────────────────────

export const LOADER_COLORS = {
  primary: "text-blue-500",
  primaryBorder: "border-blue-500",
  muted: "text-gray-400",
} as const

// ─── Aksiyon Renkleri (silme, iptal vb.) ────────────────────────────────

export const ACTION_COLORS = {
  destructiveBtn: "bg-red-600 hover:bg-red-700 text-white",
  destructiveText: "text-red-600",
  destructiveGhost: "text-red-500 hover:text-red-700 hover:bg-red-50",
  destructiveFocus: "text-red-600 cursor-pointer focus:text-red-600",
  destructiveOutline: "border-red-400 text-red-500 hover:text-red-700 hover:bg-red-50",
  successOutline: "text-green-600 border-green-600",
} as const

// ─── Hesaplama Paneli Renkleri (Calculator) ─────────────────────────────

export const CALCULATOR_COLORS = {
  infoCard: "border-blue-100 bg-blue-50/40",
  infoTitle: "text-blue-900",
  infoLabel: "text-blue-700",
  infoSeparator: "bg-blue-100",
  resultCard: "border-green-200 bg-green-50/40",
  resultTitle: "text-green-800",
  resultLabel: "text-green-700",
  resultValue: "text-green-800",
  resultSeparator: "bg-green-200",
  resultBorder: "border-green-200",
  taxTotal: "text-red-600",
  savedBadge: "bg-green-100 text-green-800 border-green-200",
  totalCostValue: "text-green-700",
  cifValue: "text-blue-700",
  chevronRight: "text-green-400",
  taxTotalRow: "text-orange-600",
} as const

// ─── Abonelik Planı Badge Renkleri ──────────────────────────────────────

export const SUBSCRIPTION_BADGE_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-800",
  BASIC: "bg-blue-100 text-blue-800",
  PROFESSIONAL: "bg-indigo-100 text-indigo-800",
  ENTERPRISE: "bg-purple-100 text-purple-800",
  PREMIUM: "bg-purple-100 text-purple-800",
}

// ─── Kaynak Badge Renkleri (Exchange Rate source) ───────────────────────

export const SOURCE_BADGE_COLORS = {
  api: "bg-blue-100 text-blue-700 border-blue-200",
  apiWithHover: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
} as const

// ─── Değişiklik Gösterge Renkleri (History) ─────────────────────────────

export const CHANGE_COLORS = {
  oldValue: "text-red-600",
  newValue: "text-green-600",
} as const

// ─── Hızlı Giriş Rol Renkleri (Login quick-login panel) ──────────────────

export const LOGIN_ROLE_COLORS: Record<string, string> = {
  MASTER_ADMIN: "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20",
  GALLERY_OWNER: "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20",
  GALLERY_MANAGER: "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20",
  SALES: "bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20",
  ACCOUNTANT: "bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20",
  STAFF: "bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20",
  PREMIUM: "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20",
}

// ─── Rapor İkon Renkleri ──────────────────────────────────────────────────

export const REPORT_ICON_COLORS: Record<string, string> = {
  vehicles: "text-blue-500",
  status: "text-purple-500",
  costs: "text-orange-500",
  stock: "text-green-500",
  sales: "text-emerald-500",
  financial: "text-indigo-500",
}

// ─── Düşük Stok Uyarı Renkleri (Raporlar) ────────────────────────────────

export const LOW_STOCK_ALERT = {
  wrapper: "border-orange-200 bg-orange-50",
  icon: "text-orange-500",
  text: "text-orange-700",
  badge: "border-orange-300 text-orange-700",
  row: "bg-red-50 hover:bg-red-100",
} as const

// ─── Araç Detay Aksiyon Butonu Renkleri (durum geçiş) ────────────────────

export const VEHICLE_ACTION_COLORS = {
  stockIn: "border-green-600 text-green-600 hover:bg-green-50",
  reserve: "border-blue-500 text-blue-700 hover:bg-blue-50",
} as const
