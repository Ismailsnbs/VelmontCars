"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
} from "lucide-react"

import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ErrorState } from "@/components/ui/error-state"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_BADGE_VARIANT, ALERT_COLORS, ACTION_COLORS, SEMANTIC_COLORS, FORM_COLORS } from "@/lib/design-tokens"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ---- Constants

const PAGE_SIZE = 10

const CATEGORY_ENUM: [string, ...string[]] = [
  "CLEANING",
  "SPRAY",
  "CLOTH",
  "BRUSH",
  "CHEMICAL",
  "OTHER",
] as const

const CATEGORY_LABELS: Record<string, string> = {
  CLEANING: "Temizlik",
  SPRAY: "Sprey",
  CLOTH: "Bez/Havlu",
  BRUSH: "Fırça",
  CHEMICAL: "Kimyasal",
  OTHER: "Diğer",
}

const STOCK_MOVEMENT_TYPES = [
  { value: "IN", label: "Giriş" },
  { value: "OUT", label: "Çıkış" },
  { value: "ADJUSTMENT", label: "Düzeltme" },
] as const

// ---- Zod Schemas

const productFormSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunlu"),
  category: z.enum(CATEGORY_ENUM),
  unit: z.string().min(1, "Birim zorunlu"),
  unitPrice: z.number().positive("Birim fiyat pozitif olmalı"),
  minStockLevel: z.number().int().min(0, "Minimum stok 0 veya daha büyük olmalı"),
  barcode: z.string().optional(),
  description: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

const stockMovementSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Miktar pozitif olmalı"),
  note: z.string().optional(),
})

type StockMovementValues = z.infer<typeof stockMovementSchema>

// ---- Types

interface Product {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStockLevel: number
  unitPrice: number
  barcode?: string
  description?: string
  galleryId: string
  createdAt: string
  updatedAt: string
}

interface ProductStats {
  totalProducts: number
  belowMinStockCount: number
  categoryStats: Record<string, number>
  totalStockValue: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ---- Helpers

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---- Sub-components

interface ProductFormDialogProps {
  open: boolean
  onClose: () => void
  product?: Product | null
  onSuccess: () => void
}

function ProductFormDialog({
  open,
  onClose,
  product,
  onSuccess,
}: ProductFormDialogProps) {
  const { toast } = useToast()

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      category: (product?.category as any) || "CLEANING",
      unit: product?.unit || "",
      unitPrice: product?.unitPrice || 0,
      minStockLevel: product?.minStockLevel || 0,
      barcode: product?.barcode || "",
      description: product?.description || "",
    },
  })

  const category = watch("category")

  const saveMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (product) {
        const { data } = await api.put(`/products/${product.id}`, values)
        return data
      } else {
        const { data } = await api.post("/products", values)
        return data
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: product ? "Ürün güncellendi." : "Ürün eklendi.",
        variant: "default",
      })
      reset()
      onClose()
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (values: ProductFormValues) => {
    saveMutation.mutate(values)
  }

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{product ? "Ürün Düzenle" : "Yeni Ürün"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Ürün bilgilerini güncelleyin"
              : "Yeni ürün eklemek için alanları doldurun"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Ürün Adı *</Label>
            <Input
              id="name"
              placeholder="Ürün adı"
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Kategori *</Label>
            <Select
              value={category}
              onValueChange={(val) =>
                setValue("category", val as any, { shouldValidate: true })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ENUM.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.category.message}</p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <Label htmlFor="unit">Birim *</Label>
            <Input
              id="unit"
              placeholder="örn: Litre, Adet, Kg"
              disabled={isSubmitting}
              {...register("unit")}
            />
            {errors.unit && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.unit.message}</p>
            )}
          </div>

          {/* Unit Price */}
          <div className="space-y-1.5">
            <Label htmlFor="unitPrice">Birim Fiyat (₺) *</Label>
            <Input
              id="unitPrice"
              type="number"
              placeholder="0"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              {...register("unitPrice", { valueAsNumber: true })}
            />
            {errors.unitPrice && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.unitPrice.message}</p>
            )}
          </div>

          {/* Min Stock Level */}
          <div className="space-y-1.5">
            <Label htmlFor="minStockLevel">Minimum Stok Seviyesi</Label>
            <Input
              id="minStockLevel"
              type="number"
              placeholder="0"
              min="0"
              disabled={isSubmitting}
              {...register("minStockLevel", { valueAsNumber: true })}
            />
            {errors.minStockLevel && (
              <p className={`text-xs ${FORM_COLORS.error}`}>
                {errors.minStockLevel.message}
              </p>
            )}
          </div>

          {/* Barcode (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="barcode">Barkod</Label>
            <Input
              id="barcode"
              placeholder="123456789"
              disabled={isSubmitting}
              {...register("barcode")}
            />
          </div>

          {/* Description (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              placeholder="Ürün hakkında açıklama"
              rows={3}
              disabled={isSubmitting}
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface StockMovementDialogProps {
  open: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

function StockMovementDialog({
  open,
  onClose,
  product,
  onSuccess,
}: StockMovementDialogProps) {
  const { toast } = useToast()

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockMovementValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      type: "IN",
      quantity: 1,
      note: "",
    },
  })

  const movementType = watch("type")

  const moveMutation = useMutation({
    mutationFn: async (values: StockMovementValues) => {
      const { data } = await api.post(
        `/products/${product?.id}/stock-movements`,
        values
      )
      return data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Stok hareketi kaydedildi.",
        variant: "default",
      })
      reset()
      onClose()
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (values: StockMovementValues) => {
    if (!product) return
    moveMutation.mutate(values)
  }

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Stok Hareketi</DialogTitle>
          <DialogDescription>
            {product && (
              <>
                <strong>{product.name}</strong> için stok hareketi kaydedin
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current stock info */}
          {product && (
            <div className={`rounded-md p-3 text-sm ${ALERT_COLORS.info.wrapper}`}>
              <p className="text-gray-600">
                Mevcut Stok: <strong>{product.currentStock}</strong> {product.unit}
              </p>
            </div>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type">Hareket Tipi *</Label>
            <Select
              value={movementType}
              onValueChange={(val) =>
                setValue("type", val as any, { shouldValidate: true })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.type.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Miktar *</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="1"
              min="1"
              disabled={isSubmitting}
              {...register("quantity", { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.quantity.message}</p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Not</Label>
            <Textarea
              id="note"
              placeholder="Hareket hakkında not (opsiyonel)"
              rows={2}
              disabled={isSubmitting}
              {...register("note")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  product: Product | null
  onConfirm: () => void
  isLoading: boolean
}

function DeleteDialog({
  open,
  onClose,
  product,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
          <AlertDialogDescription>
            {product && (
              <>
                <strong>{product.name}</strong> ürününü silmek istediğinizden
                emin misiniz? Bu işlem geri alınamaz.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isLoading}
          className={ACTION_COLORS.destructiveBtn}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Siliniyor...
            </>
          ) : (
            "Sil"
          )}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---- Main Page

export default function ProductsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ---- State
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [lowStockOnly, setLowStockOnly] = React.useState(false)

  const [productFormOpen, setProductFormOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)

  const [stockMovementOpen, setStockMovementOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)

  // ---- Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page on filter change
  React.useEffect(() => {
    setPage(1)
  }, [categoryFilter, lowStockOnly])

  // ---- Query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      page,
      limit: PAGE_SIZE,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (categoryFilter !== "all") params.category = categoryFilter
    if (lowStockOnly) params.belowMinStock = true
    return params
  }, [page, debouncedSearch, categoryFilter, lowStockOnly])

  // ---- Fetch products
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const { data } = await api.get<PaginatedResponse<Product>>("/products", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const products = response?.data ?? []
  const pagination = response?.pagination

  // ---- Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["products", "stats"],
    queryFn: async (): Promise<{ data: ProductStats }> => {
      const { data } = await api.get("/products/stats")
      return data
    },
    staleTime: 30_000,
  })

  const stats = statsData?.data

  // ---- Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/products/${id}`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ürün silindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setDeleteDialogOpen(false)
      setDeletingProduct(null)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Ürün silinemedi.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns
  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Ürün Adı",
      render: (_v, row) => (
        <span className="font-medium text-sm">{row.name}</span>
      ),
    },
    {
      key: "category",
      label: "Kategori",
      render: (_v, row) => (
        <Badge variant={CATEGORY_BADGE_VARIANT[row.category] || "default"}>
          {CATEGORY_LABELS[row.category]}
        </Badge>
      ),
    },
    {
      key: "unit",
      label: "Birim",
      render: (_v, row) => <span className="text-sm">{row.unit}</span>,
    },
    {
      key: "currentStock",
      label: "Stok",
      render: (_v, row) => (
        <span
          className={`text-sm font-medium ${
            row.currentStock < row.minStockLevel
              ? `${ALERT_COLORS.error.text} ${ALERT_COLORS.error.wrapper} px-2 py-1 rounded`
              : ""
          }`}
        >
          {row.currentStock}
        </span>
      ),
    },
    {
      key: "minStockLevel",
      label: "Min. Stok",
      render: (_v, row) => <span className="text-sm">{row.minStockLevel}</span>,
    },
    {
      key: "unitPrice",
      label: "Birim Fiyat",
      render: (_v, row) => (
        <span className="text-sm font-medium">{formatCurrency(row.unitPrice)}</span>
      ),
    },
    {
      key: "id",
      label: "İşlemler",
      render: (_v, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">İşlemler</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingProduct(row)
                setProductFormOpen(true)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedProduct(row)
                setStockMovementOpen(true)
              }}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Stok Hareketi
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={ACTION_COLORS.destructiveFocus}
              onClick={() => {
                setDeletingProduct(row)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // ---- Handlers
  const handleDeleteConfirm = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id)
    }
  }

  const handleFormClose = () => {
    setProductFormOpen(false)
    setEditingProduct(null)
  }

  const handleStockMovementClose = () => {
    setStockMovementOpen(false)
    setSelectedProduct(null)
  }

  const handleNewProduct = () => {
    setEditingProduct(null)
    setProductFormOpen(true)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] })
  }

  if (isError) {
    return (
      <ErrorState message="Ürün verileri yüklenirken hata oluştu." onRetry={() => refetch()} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ürün Stok Yönetimi</h1>
          <p className="text-sm text-gray-500">Ürün ve stok bilgilerini yönetin</p>
        </div>
        <Button onClick={handleNewProduct} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Ürün
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Ürün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.totalProducts}</span>
                <Package className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Düşük Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold ${
                    stats.belowMinStockCount > 0 ? SEMANTIC_COLORS.loss : ""
                  }`}
                >
                  {stats.belowMinStockCount}
                </span>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Kategori Sayısı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{Object.keys(stats.categoryStats).length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Değer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${SEMANTIC_COLORS.profit}`}>
                {formatCurrency(stats.totalStockValue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Ürün adı veya barkod ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <div className="w-[160px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {CATEGORY_ENUM.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Low stock toggle */}
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          {lowStockOnly ? "Düşük Stok Gösteriliyor" : "Düşük Stok"}
        </Button>

        {/* Reset filters */}
        {(search || categoryFilter !== "all" || lowStockOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              setCategoryFilter("all")
              setLowStockOnly(false)
            }}
          >
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          rowKey="id"
          pagination={
            pagination
              ? {
                  page: pagination.page,
                  pageSize: PAGE_SIZE,
                  total: pagination.total,
                }
              : undefined
          }
          onPageChange={setPage}
          emptyState={{
            icon: Package,
            title: "Henüz ürün eklenmemiş",
            description: "Stok takibi için ürün ekleyin.",
            action: (
              <Button onClick={handleNewProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Ürün
              </Button>
            ),
          }}
          mobileCard={(row) => {
            const isBelowMin = row.currentStock < row.minStockLevel
            return (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold">{row.name}</p>
                    <Badge variant={CATEGORY_BADGE_VARIANT[row.category] || "default"}>
                      {CATEGORY_LABELS[row.category]}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="-mt-1 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">İşlemler</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingProduct(row)
                          setProductFormOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedProduct(row)
                          setStockMovementOpen(true)
                        }}
                      >
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Stok Hareketi
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={ACTION_COLORS.destructiveFocus}
                        onClick={() => {
                          setDeletingProduct(row)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Stok</span>
                  <span
                    className={`font-medium ${
                      isBelowMin
                        ? `${ALERT_COLORS.error.text} ${ALERT_COLORS.error.wrapper} px-2 py-0.5 rounded`
                        : ""
                    }`}
                  >
                    {row.currentStock} / {row.minStockLevel} min ({row.unit})
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Birim Fiyat</span>
                  <span className="font-medium">{formatCurrency(row.unitPrice)}</span>
                </div>
              </div>
            )
          }}
        />
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={productFormOpen}
        onClose={handleFormClose}
        product={editingProduct}
        onSuccess={handleRefresh}
      />

      <StockMovementDialog
        open={stockMovementOpen}
        onClose={handleStockMovementClose}
        product={selectedProduct}
        onSuccess={handleRefresh}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDeletingProduct(null)
        }}
        product={deletingProduct}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
