"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SEMANTIC_COLORS } from "@/lib/design-tokens"
import type { DateRangeFilter } from "../types"

// ─── SummaryCard ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string
  highlight?: boolean
  warning?: boolean
}

export function SummaryCard({ label, value, highlight, warning }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-lg font-bold tabular-nums ${
          highlight
            ? SEMANTIC_COLORS.profit
            : warning
            ? SEMANTIC_COLORS.loss
            : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// ─── DateRangeFields ─────────────────────────────────────────────────────────

interface DateRangeFieldsProps {
  value: DateRangeFilter
  onChange: (v: DateRangeFilter) => void
}

export function DateRangeFields({ value, onChange }: DateRangeFieldsProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Başlangıç Tarihi</Label>
        <Input
          type="date"
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          className="w-[160px] text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Bitiş Tarihi</Label>
        <Input
          type="date"
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
          className="w-[160px] text-sm"
        />
      </div>
    </div>
  )
}
