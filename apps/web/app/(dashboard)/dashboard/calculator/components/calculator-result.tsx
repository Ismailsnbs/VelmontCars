"use client"

import {
  Calculator,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  RefreshCw,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CALCULATOR_COLORS } from "@/lib/design-tokens"
import type { CalculationResult } from "../types"
import { PROFIT_MARGINS } from "../constants"
import { formatUSD, formatTRY } from "../utils"

interface CalculationResultPanelProps {
  result: CalculationResult
  onReset: () => void
  onSaveToVehicle: () => void
}

export function CalculationResultPanel({
  result,
  onReset,
  onSaveToVehicle,
}: CalculationResultPanelProps) {
  const downloadPdf = async (calcId: string) => {
    try {
      const token = localStorage.getItem("accessToken") ?? ""

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/calculator/${calcId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) throw new Error("PDF indirilemedi")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hesaplama-${calcId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF download error:", err)
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Card 1 — Input values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Giris Degerleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">FOB Fiyati</p>
              <p className="font-semibold text-sm">{formatUSD(result.inputs.fobPrice)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">Nakliye</p>
              <p className="font-semibold text-sm">{formatUSD(result.inputs.shippingCost)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">Sigorta</p>
              <p className="font-semibold text-sm">{formatUSD(result.inputs.insuranceCost)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">CIF (USD)</p>
              <p className={`font-bold tabular-nums text-sm ${CALCULATOR_COLORS.cifValue}`}>
                {formatUSD(result.inputs.cifUsd)}
              </p>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>
              Mense:{" "}
              <strong className="text-gray-700">{result.vehicleInfo.originCountry}</strong>
            </span>
            <span>
              Motor:{" "}
              <strong className="text-gray-700">{result.vehicleInfo.engineCC} cc</strong>
            </span>
            <span>
              Tip:{" "}
              <strong className="text-gray-700">
                {result.vehicleInfo.vehicleType === "PASSENGER" ? "Binek" : "Ticari"}
              </strong>
            </span>
            <span>
              Kur:{" "}
              <strong className="tabular-nums text-gray-700">
                1 USD ={" "}
                {Number(result.exchangeRate).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                TL
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2 — Tax breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-500" />
            Vergi Dokumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {result.taxes.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {item.name}
                  {item.rate !== null && (
                    <span className="ml-1.5 text-xs text-gray-400">(%{item.rate})</span>
                  )}
                </span>
                <span className="font-medium tabular-nums">{formatUSD(item.amount)}</span>
              </div>
            ))}

            <Separator className="my-2" />

            <div className="flex items-center justify-between font-semibold text-sm">
              <span>Toplam Vergiler</span>
              <span className={`tabular-nums ${CALCULATOR_COLORS.taxTotal}`}>
                {formatUSD(result.totalTaxes)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 — Final result + suggested prices */}
      <Card className={CALCULATOR_COLORS.resultCard}>
        <CardHeader className="pb-3">
          <CardTitle
            className={`text-base font-semibold flex items-center gap-2 ${CALCULATOR_COLORS.resultTitle}`}
          >
            <Calculator className="h-4 w-4" />
            Toplam Maliyet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div>
              <p className={`text-xs ${CALCULATOR_COLORS.resultLabel} mb-0.5`}>USD</p>
              <p className={`text-2xl font-bold tabular-nums ${CALCULATOR_COLORS.resultValue}`}>
                {formatUSD(result.totalCost)}
              </p>
            </div>
            <ChevronRight
              className={`hidden sm:block h-5 w-5 ${CALCULATOR_COLORS.chevronRight} mb-1.5`}
            />
            <div>
              <p className={`text-xs ${CALCULATOR_COLORS.resultLabel} mb-0.5`}>TL</p>
              <p className={`text-2xl font-bold tabular-nums ${CALCULATOR_COLORS.resultValue}`}>
                {formatTRY(result.totalCostTry)}
              </p>
            </div>
          </div>

          <Separator className={CALCULATOR_COLORS.resultSeparator} />

          <div>
            <p className={`text-xs font-medium ${CALCULATOR_COLORS.resultLabel} mb-2`}>
              Onerilen Satis Fiyatlari
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PROFIT_MARGINS.map((m) => (
                <div
                  key={m.rate}
                  className={`rounded-lg border ${CALCULATOR_COLORS.resultBorder} bg-white p-2.5 text-center`}
                >
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className="font-bold text-xs sm:text-sm tabular-nums">
                    {formatUSD(result.totalCost * (1 + m.rate))}
                  </p>
                  <p className="text-xs text-gray-400 tabular-nums mt-0.5">
                    {formatTRY(result.totalCostTry * (1 + m.rate))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!result.id}
          onClick={() => {
            if (result.id) {
              downloadPdf(result.id)
            }
          }}
        >
          <Download className="h-4 w-4" />
          PDF Indir
        </Button>

        <Button variant="outline" size="sm" onClick={onSaveToVehicle} className="gap-2">
          <Save className="h-4 w-4" />
          Araca Kaydet
        </Button>

        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 ml-auto">
          <RefreshCw className="h-4 w-4" />
          Yeni Hesaplama
        </Button>
      </div>
    </div>
  )
}
