"use client"

import * as React from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ReportType, VehicleInventoryFilter, DateRangeFilter, FinancialFilter } from "../types"
import { REPORT_CARDS } from "../constants"
import { VehicleInventoryContent } from "./vehicle-inventory-content"
import { VehicleStatusContent } from "./vehicle-status-content"
import { CostReportContent } from "./cost-report-content"
import { StockReportContent } from "./stock-report-content"
import { SalesReportContent } from "./sales-report-content"
import { FinancialSummaryContent } from "./financial-summary-content"

interface ReportDialogProps {
  reportType: ReportType | null
  onClose: () => void
}

export function ReportDialog({ reportType, onClose }: ReportDialogProps) {
  const { toast } = useToast()

  // Filter state — one per report type
  const [vehicleInventoryFilter, setVehicleInventoryFilter] =
    React.useState<VehicleInventoryFilter>({
      status: "all",
      startDate: "",
      endDate: "",
    })
  const [dateRangeFilter, setDateRangeFilter] = React.useState<DateRangeFilter>({
    startDate: "",
    endDate: "",
  })
  const [financialFilter, setFinancialFilter] = React.useState<FinancialFilter>({
    year: String(new Date().getFullYear()),
    month: "0",
  })

  // Reset filters when dialog closes
  React.useEffect(() => {
    if (!reportType) {
      setVehicleInventoryFilter({ status: "all", startDate: "", endDate: "" })
      setDateRangeFilter({ startDate: "", endDate: "" })
      setFinancialFilter({ year: String(new Date().getFullYear()), month: "0" })
    }
  }, [reportType])

  const meta = reportType ? REPORT_CARDS.find((c) => c.type === reportType) : null

  const handleExportCSV = () => {
    toast({ title: "Dışa Aktarıldı", description: "CSV dosyası indirildi." })
  }

  const handlePrint = () => {
    window.print()
  }

  const renderContent = () => {
    if (!reportType) return null

    switch (reportType) {
      case "vehicle-inventory":
        return (
          <VehicleInventoryContent
            filter={vehicleInventoryFilter}
            onFilterChange={setVehicleInventoryFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "vehicle-status":
        return (
          <VehicleStatusContent
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "costs":
        return (
          <CostReportContent
            filter={dateRangeFilter}
            onFilterChange={setDateRangeFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "stock":
        return (
          <StockReportContent
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "sales":
        return (
          <SalesReportContent
            filter={dateRangeFilter}
            onFilterChange={setDateRangeFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      case "financial-summary":
        return (
          <FinancialSummaryContent
            filter={financialFilter}
            onFilterChange={setFinancialFilter}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={reportType !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center gap-3">
            {meta && (
              <div className="rounded-lg bg-gray-100 p-2">
                <meta.icon className={`h-5 w-5 ${meta.iconColor}`} />
              </div>
            )}
            <div>
              <DialogTitle className="text-lg">
                {meta?.title ?? "Rapor"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {meta?.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Print-only header */}
        <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold">{meta?.title}</h1>
          <p className="text-sm text-gray-500">
            Oluşturulma: {new Date().toLocaleDateString("tr-TR")}
          </p>
        </div>

        <div className="mt-2">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
