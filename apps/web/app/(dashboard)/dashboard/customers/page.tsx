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
  Users,
  Mail,
  Phone,
  Loader2,
} from "lucide-react"

import { FORM_COLORS, ACTION_COLORS } from "@/lib/design-tokens"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ErrorState } from "@/components/ui/error-state"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

// ---- Zod Schemas

const customerFormSchema = z.object({
  name: z.string().min(1, "Müşteri adı zorunlu"),
  phone: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi girin").optional().or(z.literal("")),
  identityNo: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerFormSchema>

// ---- Types

interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  identityNo?: string | null
  address?: string | null
  notes?: string | null
  galleryId: string
  createdAt: string
  updatedAt: string
  sales: Array<{
    id: string
    vehicleId: string
    salePrice: number
    saleDate: string
  }>
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
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

// ---- Sub-components

interface CustomerFormDialogProps {
  open: boolean
  onClose: () => void
  customer?: Customer | null
  onSuccess: () => void
}

function CustomerFormDialog({
  open,
  onClose,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      identityNo: customer?.identityNo || "",
      address: customer?.address || "",
      notes: customer?.notes || "",
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      if (customer) {
        const { data } = await api.put(`/customers/${customer.id}`, values)
        return data
      } else {
        const { data } = await api.post("/customers", values)
        return data
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: customer ? "Müşteri güncellendi." : "Müşteri eklendi.",
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

  const onSubmit = (values: CustomerFormValues) => {
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
          <DialogTitle>{customer ? "Müşteri Düzenle" : "Yeni Müşteri"}</DialogTitle>
          <DialogDescription>
            {customer
              ? "Müşteri bilgilerini güncelleyin"
              : "Yeni müşteri eklemek için alanları doldurun"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              placeholder="Ad soyad"
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
              {...register("phone")}
            />
            {errors.phone && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@example.com"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.email.message}</p>
            )}
          </div>

          {/* Identity No */}
          <div className="space-y-1.5">
            <Label htmlFor="identityNo">TC Kimlik No</Label>
            <Input
              id="identityNo"
              placeholder="12345678901"
              disabled={isSubmitting}
              {...register("identityNo")}
            />
            {errors.identityNo && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.identityNo.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              placeholder="Müşteri adresi"
              rows={2}
              disabled={isSubmitting}
              {...register("address")}
            />
            {errors.address && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.address.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Müşteri hakkında notlar"
              rows={2}
              disabled={isSubmitting}
              {...register("notes")}
            />
            {errors.notes && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.notes.message}</p>
            )}
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
  customer: Customer | null
  onConfirm: () => void
  isLoading: boolean
}

function DeleteDialog({
  open,
  onClose,
  customer,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Müşteri Sil</AlertDialogTitle>
          <AlertDialogDescription>
            {customer && (
              <>
                <strong>{customer.name}</strong> müşterisini silmek istediğinizden
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

export default function CustomersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // ---- State
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  const [customerFormOpen, setCustomerFormOpen] = React.useState(false)
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingCustomer, setDeletingCustomer] = React.useState<Customer | null>(null)

  // ---- Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // ---- Query params
  const queryParams = React.useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      page,
      limit: PAGE_SIZE,
    }
    if (debouncedSearch) params.search = debouncedSearch
    return params
  }, [page, debouncedSearch])

  // ---- Fetch customers
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["customers", queryParams],
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      const { data } = await api.get<PaginatedResponse<Customer>>("/customers", {
        params: queryParams,
      })
      return data
    },
    staleTime: 30_000,
  })

  const customers = response?.data ?? []
  const pagination = response?.pagination

  // ---- Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["customers", "stats"],
    queryFn: async (): Promise<{ data: CustomerStats }> => {
      const { data } = await api.get("/customers/stats")
      return data
    },
    staleTime: 30_000,
  })

  const stats = statsData?.data

  // ---- Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/customers/${id}`)
      return data
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Müşteri silindi.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setDeleteDialogOpen(false)
      setDeletingCustomer(null)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Müşteri silinemedi.",
        variant: "destructive",
      })
    },
  })

  // ---- Columns
  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: "Ad Soyad",
      render: (_v, row) => (
        <span className="font-medium text-sm">{row.name}</span>
      ),
    },
    {
      key: "phone",
      label: "Telefon",
      render: (_v, row) => (
        <div className="flex items-center gap-1 text-sm">
          {row.phone ? (
            <>
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {row.phone}
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      label: "E-posta",
      render: (_v, row) => (
        <div className="flex items-center gap-1 text-sm">
          {row.email ? (
            <>
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              {row.email}
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: "address",
      label: "Adres",
      render: (_v, row) => (
        <span className="text-sm text-gray-600">
          {row.address ? row.address.substring(0, 30) + (row.address.length > 30 ? "..." : "") : "-"}
        </span>
      ),
    },
    {
      key: "sales",
      label: "Satış",
      render: (_v, row) => (
        <span className="text-sm font-medium">{row.sales.length}</span>
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
                setEditingCustomer(row)
                setCustomerFormOpen(true)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={ACTION_COLORS.destructiveFocus}
              onClick={() => {
                setDeletingCustomer(row)
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
    if (deletingCustomer) {
      deleteMutation.mutate(deletingCustomer.id)
    }
  }

  const handleFormClose = () => {
    setCustomerFormOpen(false)
    setEditingCustomer(null)
  }

  const handleNewCustomer = () => {
    setEditingCustomer(null)
    setCustomerFormOpen(true)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] })
  }

  if (isError) {
    return (
      <ErrorState message="Müşteri verileri yüklenirken hata oluştu." onRetry={() => refetch()} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <p className="text-sm text-gray-500">Müşteri bilgilerini yönetin</p>
        </div>
        <Button onClick={handleNewCustomer} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Müşteri
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Müşteri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.totalCustomers}</span>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Aktif Müşteriler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stats.activeCustomers}</span>
              </div>
              <p className="text-xs text-gray-500">
                (En az 1 satışı olan)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Ad, telefon, e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
            }}
          >
            Temizle
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={customers}
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
            icon: Users,
            title: "Henüz müşteri eklenmemiş",
            description: "Yeni müşteri ekleyerek müşteri portföyünüzü oluşturun.",
            action: (
              <Button onClick={handleNewCustomer}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Müşteri
              </Button>
            ),
          }}
          mobileCard={(row) => (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{row.name}</p>
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
                        setEditingCustomer(row)
                        setCustomerFormOpen(true)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className={ACTION_COLORS.destructiveFocus}
                      onClick={() => {
                        setDeletingCustomer(row)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {row.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {row.phone}
                </p>
              )}
              {row.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {row.email}
                </p>
              )}
              {row.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {row.notes}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {row.sales.length} satış
              </p>
            </div>
          )}
        />
      </div>

      {/* Dialogs */}
      <CustomerFormDialog
        open={customerFormOpen}
        onClose={handleFormClose}
        customer={editingCustomer}
        onSuccess={handleRefresh}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDeletingCustomer(null)
        }}
        customer={deletingCustomer}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
