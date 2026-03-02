"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CALCULATOR_COLORS } from "@/lib/design-tokens"
import type { HistoryItem } from "../types"
import { formatUSD, formatTRY, formatDate } from "../utils"

interface HistoryDetailModalProps {
  item: HistoryItem | null
  open: boolean
  onClose: () => void
}

export function HistoryDetailModal({ item, open, onClose }: HistoryDetailModalProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Hesaplama Detayi</DialogTitle>
          <DialogDescription>
            {formatDate(item.createdAt)} tarihinde yapilan hesaplama
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Arac</p>
              <p className="font-medium">
                {item.vehicleInfo.brand ?? "-"} {item.vehicleInfo.model ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Motor Hacmi</p>
              <p className="font-medium">{item.vehicleInfo.engineCC} cc</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">FOB Fiyati</p>
              <p className="font-medium">{formatUSD(item.inputs.fobPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CIF (USD)</p>
              <p className="font-medium">{formatUSD(item.inputs.cifUsd)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Toplam Maliyet (USD)</p>
              <p className={`text-lg font-bold tabular-nums ${CALCULATOR_COLORS.totalCostValue}`}>
                {formatUSD(item.totalCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Toplam Maliyet (TL)</p>
              <p className={`text-lg font-bold tabular-nums ${CALCULATOR_COLORS.totalCostValue}`}>
                {formatTRY(item.totalCostTry)}
              </p>
            </div>
          </div>

          {item.savedToVehicle && (
            <Badge className={CALCULATOR_COLORS.savedBadge}>Araca Kaydedildi</Badge>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
