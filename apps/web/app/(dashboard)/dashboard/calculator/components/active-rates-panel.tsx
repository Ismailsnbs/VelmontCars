"use client"

import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CALCULATOR_COLORS } from "@/lib/design-tokens"
import type { ActiveRates } from "../types"
import { formatDate } from "../utils"

interface ActiveRatesPanelProps {
  rates: ActiveRates | undefined
}

export function ActiveRatesPanel({ rates }: ActiveRatesPanelProps) {
  if (!rates) return null

  const usdRate = rates.exchangeRates.find((r) => r.currency === "USD")

  return (
    <Card className={CALCULATOR_COLORS.infoCard}>
      <CardHeader className="pb-2">
        <CardTitle
          className={`text-sm font-semibold ${CALCULATOR_COLORS.infoTitle} flex items-center gap-2`}
        >
          <TrendingUp className="h-4 w-4" />
          Aktif Oranlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className={`text-xs font-medium ${CALCULATOR_COLORS.infoLabel} mb-1.5`}>
            Doviz Kurlari
          </p>
          <div className="space-y-1">
            {rates.exchangeRates.map((er) => (
              <div key={er.currency} className="flex justify-between text-xs">
                <span className="text-gray-600">{er.currency}/TL</span>
                <span className="font-semibold tabular-nums text-gray-900">
                  {Number(er.rate).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {usdRate && (
          <p className="text-xs text-gray-400">
            Guncelleme: {formatDate(usdRate.updatedAt)}
          </p>
        )}

        <Separator className={CALCULATOR_COLORS.infoSeparator} />

        <div>
          <p className={`text-xs font-medium ${CALCULATOR_COLORS.infoLabel} mb-1.5`}>
            Vergi Oranlari
          </p>
          <div className="space-y-1">
            {rates.taxRates.slice(0, 6).map((tr) => (
              <div key={tr.name} className="flex justify-between text-xs">
                <span className="text-gray-600">{tr.name}</span>
                <span className="font-semibold text-gray-900">%{tr.rate}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
