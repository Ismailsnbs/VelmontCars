"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  width?: string
}

export interface EmptyStateConfig {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  onPageChange?: (page: number) => void
  rowKey?: keyof T | ((row: T) => string)
  emptyState?: EmptyStateConfig
  /** Mobilde kart görünümünde kullanılacak render fonksiyonu */
  mobileCard?: (row: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Ara...",
  onSearch,
  pagination,
  onPageChange,
  rowKey,
  emptyState,
  mobileCard,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index)
    if (typeof rowKey === "function") {
      return rowKey(row)
    }
    return String(row[rowKey])
  }

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 1

  return (
    <div className="w-full space-y-4">
      {onSearch && (
        <div className="flex items-center gap-2">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Mobile card view */}
      {mobileCard && (
        <div className="space-y-3 sm:hidden">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              {emptyState?.icon && <emptyState.icon className="h-16 w-16 text-muted-foreground/40" />}
              <p className="font-medium">{emptyState?.title ?? "Veri bulunamadı"}</p>
              {emptyState?.description && (
                <p className="text-sm text-muted-foreground">{emptyState.description}</p>
              )}
              {emptyState?.action}
            </div>
          ) : (
            data.map((row, i) => (
              <div key={getRowKey(row, i)}>{mobileCard(row)}</div>
            ))
          )}
        </div>
      )}

      {/* Desktop table view */}
      <div className={cn("rounded-md border border-gray-200", mobileCard && "hidden sm:block")}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(column.width && `w-${column.width}`)}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pagination?.pageSize || 10 }).map(
                (_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    {emptyState?.icon && <emptyState.icon className="h-16 w-16 text-muted-foreground/40" />}
                    <p className="font-medium">{emptyState?.title ?? "Veri bulunamadı"}</p>
                    {emptyState?.description && (
                      <p className="text-sm text-muted-foreground">{emptyState.description}</p>
                    )}
                    {emptyState?.action}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={getRowKey(row, rowIndex)}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (pagination.page > 1) {
                    onPageChange?.(pagination.page - 1)
                  }
                }}
                className={
                  pagination.page === 1
                    ? "pointer-events-none opacity-50"
                    : ""
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
                  if (pagination.page < totalPages) {
                    onPageChange?.(pagination.page + 1)
                  }
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
