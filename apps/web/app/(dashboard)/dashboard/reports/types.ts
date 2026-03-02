// ─── Report type definitions ─────────────────────────────────────────────────

export type ReportType =
  | "vehicle-inventory"
  | "vehicle-status"
  | "costs"
  | "stock"
  | "sales"
  | "financial-summary"

export interface VehicleInventoryItem {
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

export interface VehicleInventoryReport {
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

export interface VehicleStatusBreakdownItem {
  status: string
  count: number
  totalFobValue: number
  totalCostValue: number
}

export interface VehicleStatusSummaryReport {
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

export interface CostReportItem {
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

export interface CostReport {
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

export interface StockProductItem {
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

export interface StockReport {
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

export interface SalesReportItem {
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

export interface SalesReport {
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

export interface MonthlyFinancialItem {
  year: number
  month: number
  importCost: number
  salesRevenue: number
  profit: number
  vehiclesSold: number
  vehiclesImported: number
}

export interface FinancialSummaryReport {
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

// ─── Filter state types ───────────────────────────────────────────────────────

export interface DateRangeFilter {
  startDate: string
  endDate: string
}

export interface FinancialFilter {
  year: string
  month: string
}

export interface VehicleInventoryFilter extends DateRangeFilter {
  status: string
}
