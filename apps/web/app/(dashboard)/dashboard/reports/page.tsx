"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ReportType } from "./types"
import { REPORT_CARDS } from "./constants"
import { ReportDialog } from "./components/report-dialog"

export default function ReportsPage() {
  const [activeReport, setActiveReport] = React.useState<ReportType | null>(null)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-1">
          Galeriye ait detaylı raporları görüntüleyin ve dışa aktarın
        </p>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.type}
              className="cursor-pointer hover:shadow-md transition-all hover:border-gray-300 group"
              onClick={() => setActiveReport(card.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-gray-50 p-2.5 group-hover:bg-gray-100 transition-colors">
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight">{card.title}</CardTitle>
                    <CardDescription className="text-sm mt-1 leading-snug">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveReport(card.type)
                  }}
                >
                  Raporu Görüntüle
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report detail dialog */}
      <ReportDialog
        reportType={activeReport}
        onClose={() => setActiveReport(null)}
      />
    </div>
  )
}
