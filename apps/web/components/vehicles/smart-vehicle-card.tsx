"use client"

import * as React from "react"
import Link from "next/link"
import {
  Eye,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Ship,
  AlertTriangle,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VehicleImageSlider } from "./vehicle-image-slider"
import {
  STATUS_BADGE_CLASSES,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  VEHICLE_CARD,
  type VehicleStatus,
} from "@/lib/design-tokens"

// ── Constants ──────────────────────────────────────────────────────────────

const FUEL_LABELS: Record<string, string> = {
  PETROL: "Benzin",
  DIESEL: "Dizel",
  ELECTRIC: "Elektrik",
  HYBRID: "Hibrit",
  LPG: "LPG",
}

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manuel",
  AUTOMATIC: "Otomatik",
  SEMI_AUTO: "Yarı Oto",
}

// ── Types ──────────────────────────────────────────────────────────────────

interface VehicleImage {
  id: string
  url: string
  isMain: boolean
}

interface OriginCountry {
  id: string
  name: string
  code: string
}

export interface CardVehicle {
  id: string
  brand: string
  model: string
  year: number
  engineCC: number
  bodyType: string | null
  mileage: number | null
  fuelType: string | null
  transmission: string | null
  fobPrice: number
  fobCurrency: string
  totalCost: number | null
  salePrice: number | null
  profit: number | null
  profitMargin: number | null
  status: VehicleStatus
  estimatedArrival: string | null
  purchaseExchangeRate: number | null
  originCountry?: OriginCountry
  images?: VehicleImage[]
  createdAt: string
}

interface SmartVehicleCardProps {
  vehicle: CardVehicle
  stockAgeWarningDays: number
  currentExchangeRate?: number
  onDelete: (vehicle: CardVehicle) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getCardBorderClass(status: VehicleStatus): string {
  switch (status) {
    case "RESERVED":
      return VEHICLE_CARD.borderReserved
    case "TRANSIT":
      return VEHICLE_CARD.borderTransit
    case "SOLD":
      return VEHICLE_CARD.borderSold
    default:
      return VEHICLE_CARD.borderDefault
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function SmartVehicleCard({
  vehicle,
  stockAgeWarningDays,
  currentExchangeRate,
  onDelete,
}: SmartVehicleCardProps) {
  const images = vehicle.images ?? []

  // Stock age calculation
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const showStockAgeWarning =
    vehicle.status === "IN_STOCK" && daysSinceCreation > stockAgeWarningDays

  // Exchange rate diff
  let exchangeRateDiff: number | null = null
  let exchangeRatePct: number | null = null
  if (vehicle.purchaseExchangeRate && currentExchangeRate) {
    exchangeRateDiff = currentExchangeRate - vehicle.purchaseExchangeRate
    exchangeRatePct = (exchangeRateDiff / vehicle.purchaseExchangeRate) * 100
  }

  // Transit progress
  let transitProgress = 0
  let daysRemaining = 0
  if (vehicle.status === "TRANSIT" && vehicle.estimatedArrival) {
    const created = new Date(vehicle.createdAt).getTime()
    const eta = new Date(vehicle.estimatedArrival).getTime()
    const now = Date.now()
    const total = eta - created
    const elapsed = now - created
    transitProgress =
      total > 0 ? Math.min(Math.max((elapsed / total) * 100, 0), 100) : 0
    daysRemaining = Math.max(
      0,
      Math.ceil((eta - now) / (1000 * 60 * 60 * 24))
    )
  }

  // Features line
  const features: string[] = []
  if (vehicle.mileage != null) {
    features.push(
      vehicle.mileage > 0
        ? `${(vehicle.mileage / 1000).toFixed(0)}K km`
        : "0 km"
    )
  }
  if (vehicle.fuelType) {
    features.push(FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType)
  }
  if (vehicle.transmission) {
    features.push(
      TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission
    )
  }

  const displayPrice =
    vehicle.salePrice ?? vehicle.totalCost ?? vehicle.fobPrice

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow:
          "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-colors",
        getCardBorderClass(vehicle.status)
      )}
    >
      {/* Image section */}
      <div className="relative">
        <VehicleImageSlider
          images={images}
          alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
          status={vehicle.status}
          className="rounded-t-xl"
        />

        {/* Glassmorphism price badge */}
        <div
          className={cn(
            "absolute bottom-2 right-2 z-20 rounded-lg px-2.5 py-1",
            VEHICLE_CARD.priceBadge
          )}
        >
          <span className="text-sm font-bold tabular-nums">
            {formatCurrency(displayPrice, vehicle.fobCurrency)}
          </span>
        </div>

        {/* Hover action overlay */}
        <div
          className={cn(
            "absolute inset-0 z-30 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            VEHICLE_CARD.hoverOverlay
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full"
            asChild
          >
            <Link href={`/dashboard/vehicles/${vehicle.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Detay</span>
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full"
            asChild
          >
            <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Düzenle</span>
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(vehicle)
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
            <span className="sr-only">Sil</span>
          </Button>
        </div>
      </div>

      {/* Card body */}
      <div className="space-y-2.5 p-4">
        {/* Title + Status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold leading-tight">
              {vehicle.year} {vehicle.brand} {vehicle.model}
            </h3>
            {vehicle.bodyType && (
              <p className="text-xs text-muted-foreground">{vehicle.bodyType}</p>
            )}
          </div>
          <Badge
            variant={STATUS_BADGE_VARIANT[vehicle.status]}
            className={cn("shrink-0 text-[10px]", STATUS_BADGE_CLASSES[vehicle.status])}
          >
            {STATUS_LABELS[vehicle.status]}
          </Badge>
        </div>

        {/* Features line */}
        {features.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {features.map((f, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-300">·</span>}
                <span>{f}</span>
              </React.Fragment>
            ))}
            {vehicle.engineCC > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span>{vehicle.engineCC.toLocaleString("tr-TR")} cc</span>
              </>
            )}
          </div>
        )}

        {/* Conditional analytics badges */}
        <div className="flex flex-wrap gap-1.5">
          {/* Stock age warning */}
          {showStockAgeWarning && (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                daysSinceCreation > stockAgeWarningDays * 2
                  ? VEHICLE_CARD.stockAgeCritical
                  : VEHICLE_CARD.stockAgeWarning
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {daysSinceCreation} gün stokta
            </div>
          )}

          {/* Exchange rate indicator */}
          {exchangeRateDiff !== null && exchangeRatePct !== null && (
            <div
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium",
                exchangeRateDiff > 0
                  ? VEHICLE_CARD.exchangeRateUp
                  : exchangeRateDiff < 0
                    ? VEHICLE_CARD.exchangeRateDown
                    : VEHICLE_CARD.exchangeRateNeutral
              )}
            >
              {exchangeRateDiff > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              Kur {exchangeRatePct > 0 ? "+" : ""}
              {exchangeRatePct.toFixed(1)}%
            </div>
          )}
        </div>

        {/* TRANSIT: Progress bar + ETA */}
        {vehicle.status === "TRANSIT" && vehicle.estimatedArrival && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Ship className="h-3 w-3" />
                <span>{vehicle.originCountry?.name ?? "?"}</span>
                <span className="text-gray-300">→</span>
                <span>KKTC</span>
              </div>
              <span className="font-medium text-blue-600">
                {daysRemaining > 0
                  ? `${daysRemaining} gün kaldı`
                  : "Varış bekleniyor"}
              </span>
            </div>
            <Progress value={transitProgress} className="h-1.5" />
          </div>
        )}

        {/* SOLD: Profit display */}
        {vehicle.status === "SOLD" && vehicle.profit != null && (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm",
              Number(vehicle.profit) >= 0
                ? VEHICLE_CARD.profitPositive
                : VEHICLE_CARD.profitNegative
            )}
          >
            <span className="font-medium">Net Kar</span>
            <div className="flex items-center gap-1.5 font-bold tabular-nums">
              <span>
                {Number(vehicle.profit) >= 0 ? "+" : ""}
                {formatCurrency(Number(vehicle.profit), vehicle.fobCurrency)}
              </span>
              {vehicle.profitMargin != null && (
                <span className="text-xs font-medium opacity-80">
                  (%{Number(vehicle.profitMargin).toFixed(1)})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
