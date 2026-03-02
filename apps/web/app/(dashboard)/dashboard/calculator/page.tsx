"use client"

import * as React from "react"
import { Calculator, ClipboardList } from "lucide-react"
import { useApiMutation, useApiQuery } from "@/hooks/use-api"
import { ErrorState } from "@/components/ui/error-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CalculationResult, ActiveRates, OriginCountry, HistoryItem, HistoryPage } from "./types"
import { PAGE_SIZE, FIF_RANGES } from "./constants"
import type { CalculatorFormValues } from "./schema"
import { CalculationForm } from "./components/calculator-form"
import { CalculationResultPanel } from "./components/calculator-result"
import { ActiveRatesPanel } from "./components/active-rates-panel"
import { CalculatorHistory } from "./components/calculator-history"
import { SaveToVehicleDialog } from "./components/save-to-vehicle-dialog"
import { HistoryDetailModal } from "./components/history-detail-modal"

export default function CalculatorPage() {
  // ---- State
  const [activeTab, setActiveTab] = React.useState("new")
  const [calculationResult, setCalculationResult] = React.useState<CalculationResult | null>(null)
  const [historyPage, setHistoryPage] = React.useState(1)
  const [selectedHistoryItem, setSelectedHistoryItem] = React.useState<HistoryItem | null>(null)
  const [historyDetailOpen, setHistoryDetailOpen] = React.useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)

  // ---- API queries
  const {
    data: activeRatesRaw,
    isError: ratesError,
    refetch: refetchRates,
  } = useApiQuery<ActiveRates>(["calculator", "rates"], "/calculator/rates")
  const activeRates = activeRatesRaw as ActiveRates | undefined

  const {
    data: countriesRaw,
    isError: countriesError,
    refetch: refetchCountries,
  } = useApiQuery<OriginCountry[]>(["countries", "active"], "/countries/active")
  const countries = (countriesRaw as OriginCountry[] | undefined) ?? []

  // History query — enabled only when history tab is active
  const { data: historyDataRaw, isLoading: historyLoading } = useApiQuery<HistoryPage>(
    ["calculator", "history", String(historyPage)],
    "/calculator/history",
    { page: historyPage, limit: PAGE_SIZE },
    { enabled: activeTab === "history" }
  )
  const historyData = historyDataRaw as HistoryPage | undefined

  // ---- Calculate mutation
  const calculateMutation = useApiMutation<CalculationResult, CalculatorFormValues>(
    "/calculator/calculate",
    "post",
    {
      onSuccess: (response) => {
        setCalculationResult(response.data)
      },
    }
  )

  // ---- Handlers
  const handleSubmit = (values: CalculatorFormValues) => {
    setCalculationResult(null)
    calculateMutation.mutate(values)
  }

  const handleReset = () => {
    setCalculationResult(null)
  }

  const handleHistoryRowClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item)
    setHistoryDetailOpen(true)
  }

  if (ratesError || countriesError) {
    return (
      <ErrorState
        message="Vergi oranları ve döviz kurları yüklenirken hata oluştu."
        onRetry={() => {
          refetchRates()
          refetchCountries()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Ithalat Maliyet Hesaplayici</h1>
        <p className="text-sm text-gray-500">
          KKTC gumruk vergilerini hesaplayin ve araca kaydedin
        </p>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new" className="gap-2">
            <Calculator className="h-4 w-4" />
            Yeni Hesaplama
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Hesaplama Gecmisi
          </TabsTrigger>
        </TabsList>

        {/* TAB: New calculation */}
        <TabsContent value="new" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left / main column */}
            <div className="lg:col-span-2 space-y-6">
              {!calculationResult ? (
                <CalculationForm
                  countries={countries}
                  isPending={calculateMutation.isPending}
                  onSubmit={handleSubmit}
                />
              ) : (
                <CalculationResultPanel
                  result={calculationResult}
                  onReset={handleReset}
                  onSaveToVehicle={() => setSaveDialogOpen(true)}
                />
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <ActiveRatesPanel rates={activeRates} />

              {/* FIF reference table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    FIF Oranlari Referans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-xs">
                    {FIF_RANGES.map((row) => (
                      <div
                        key={row.range}
                        className="flex justify-between text-gray-600"
                      >
                        <span>{row.range}</span>
                        <span className="font-semibold">{row.rate}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB: History */}
        <TabsContent value="history" className="mt-4">
          <CalculatorHistory
            historyData={historyData}
            historyLoading={historyLoading}
            onPageChange={setHistoryPage}
            onRowClick={handleHistoryRowClick}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SaveToVehicleDialog
        calculationId={calculationResult?.id}
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
      />

      <HistoryDetailModal
        item={selectedHistoryItem}
        open={historyDetailOpen}
        onClose={() => {
          setHistoryDetailOpen(false)
          setSelectedHistoryItem(null)
        }}
      />
    </div>
  )
}
