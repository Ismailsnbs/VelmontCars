// ─── Calculator type definitions ─────────────────────────────────────────────

export interface OriginCountry {
  id: string
  name: string
  code: string
}

export interface TaxBreakdownItem {
  name: string
  rate: number | null
  amount: number
  currency: string
}

export interface CalculationResult {
  id?: string
  inputs: {
    fobPrice: number
    fobCurrency: string
    shippingCost: number
    insuranceCost: number
    cif: number
    cifUsd: number
  }
  taxes: TaxBreakdownItem[]
  totalTaxes: number
  totalCost: number
  totalCostTry: number
  exchangeRate: number
  vehicleInfo: {
    brand?: string
    model?: string
    year: number
    engineCC: number
    vehicleType: string
    originCountry: string
  }
  createdAt?: string
}

export interface ExchangeRateInfo {
  currency: string
  rate: number
  updatedAt: string
}

export interface TaxRateInfo {
  name: string
  rate: number
  type: string
}

export interface ActiveRates {
  exchangeRates: ExchangeRateInfo[]
  taxRates: TaxRateInfo[]
}

export interface HistoryItem {
  id: string
  vehicleInfo: {
    brand?: string
    model?: string
    year: number
    engineCC: number
  }
  inputs: {
    fobPrice: number
    fobCurrency: string
    cifUsd: number
  }
  totalCost: number
  totalCostTry: number
  createdAt: string
  savedToVehicle: boolean
}

export interface HistoryPage {
  data: HistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SaveToVehiclePayload {
  vehicleId: string
}
