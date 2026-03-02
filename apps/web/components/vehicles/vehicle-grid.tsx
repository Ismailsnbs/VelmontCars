"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { SmartVehicleCard } from "./smart-vehicle-card"
import type { CardVehicle } from "./smart-vehicle-card"

// ── Types ──────────────────────────────────────────────────────────────────

// Re-export for consumers that only import from vehicle-grid
export type { CardVehicle as GridVehicle }

interface EmptyStateConfig {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

interface VehicleGridProps {
  vehicles: CardVehicle[]
  isLoading: boolean
  stockAgeWarningDays: number
  currentExchangeRate?: number
  onDelete: (vehicle: CardVehicle) => void
  emptyState?: EmptyStateConfig
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  onPageChange?: (page: number) => void
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="aspect-video w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export function VehicleGrid({
  vehicles,
  isLoading,
  stockAgeWarningDays,
  currentExchangeRate,
  onDelete,
  emptyState,
  pagination,
  onPageChange,
}: VehicleGridProps) {
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GridSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (vehicles.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        {emptyState.icon && (
          <emptyState.icon className="h-16 w-16 text-muted-foreground/40" />
        )}
        <p className="font-medium">{emptyState.title}</p>
        {emptyState.description && (
          <p className="text-sm text-muted-foreground">
            {emptyState.description}
          </p>
        )}
        {emptyState.action}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <SmartVehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            stockAgeWarningDays={stockAgeWarningDays}
            currentExchangeRate={currentExchangeRate}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (pagination.page > 1) onPageChange?.(pagination.page - 1)
                }}
                className={
                  pagination.page === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index + 1}>
                <PaginationLink
                  href="#"
                  isActive={pagination.page === index + 1}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange?.(index + 1)
                  }}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (pagination.page < totalPages)
                    onPageChange?.(pagination.page + 1)
                }}
                className={
                  pagination.page === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
