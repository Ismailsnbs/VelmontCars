// ─── Calculator constants ─────────────────────────────────────────────────────

export const CURRENT_YEAR = new Date().getFullYear()

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
] as const

export const VEHICLE_TYPE_OPTIONS = [
  { value: "PASSENGER", label: "Binek" },
  { value: "COMMERCIAL", label: "Ticari" },
] as const

export const PROFIT_MARGINS = [
  { label: "%15 Kar", rate: 0.15 },
  { label: "%20 Kar", rate: 0.2 },
  { label: "%25 Kar", rate: 0.25 },
] as const

export const PAGE_SIZE = 10

export const FIF_RANGES = [
  { range: "0 – 1.000 cc", rate: "%15" },
  { range: "1.001 – 1.600 cc", rate: "%18" },
  { range: "1.601 – 2.000 cc", rate: "%22" },
  { range: "2.001 – 2.500 cc", rate: "%25" },
  { range: "2.500+ cc", rate: "%30" },
] as const
