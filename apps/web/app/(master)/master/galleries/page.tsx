"use client"

import { useState } from "react"
import { Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ErrorState } from "@/components/ui/error-state"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, Column } from "@/components/shared/data-table"
import { useApiQuery } from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { useMutation } from "@tanstack/react-query"
import api from "@/lib/api"
import Link from "next/link"
import GalleryFormDialog from "./components/gallery-form"
import { SUBSCRIPTION_BADGE_COLORS, ACTION_COLORS } from "@/lib/design-tokens"

interface Gallery {
  id: string
  name: string
  slug: string
  city?: string
  phone?: string
  email?: string
  subscription: "BASIC" | "PROFESSIONAL" | "ENTERPRISE"
  subscriptionEnds?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface GalleriesResponse {
  success: boolean
  data: Gallery[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}


export default function GalleriesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [subscription, setSubscription] = useState<string>("")
  const [isActive, setIsActive] = useState<string>("")
  const [openForm, setOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch galleries
  const params: Record<string, any> = {
    page,
    limit: 10,
    ...(search && { search }),
    ...(subscription && subscription !== "all" && { subscription }),
    ...(isActive && isActive !== "all" && { isActive: isActive === "true" }),
  }

  const { data: galleriesDataRaw, isLoading, isError, refetch } = useApiQuery<GalleriesResponse>(
    ["galleries", String(page), search, subscription, isActive],
    "/galleries",
    params as Record<string, any>
  )
  const galleriesData = galleriesDataRaw || { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/galleries/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleries"] })
      toast({
        title: "Başarılı",
        description: "Galeri silindi",
      })
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Galeri silinirken hata oluştu",
        variant: "destructive",
      })
    },
  })

  const handleDelete = (id: string) => {
    if (confirm("Bu galeriyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id)
    }
  }

  const columns: Column<Gallery>[] = [
    {
      key: "name",
      label: "Galeri Adı",
      width: "25%",
    },
    {
      key: "slug",
      label: "Slug",
      width: "15%",
    },
    {
      key: "city",
      label: "Şehir",
      width: "12%",
      render: (value) => value || "-",
    },
    {
      key: "phone",
      label: "Telefon",
      width: "15%",
      render: (value) => value || "-",
    },
    {
      key: "email",
      label: "E-posta",
      width: "15%",
      render: (value) => value || "-",
    },
    {
      key: "subscription",
      label: "Abonelik",
      width: "12%",
      render: (value) => (
        <Badge className={SUBSCRIPTION_BADGE_COLORS[String(value)]}>
          {String(value)}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Durum",
      width: "10%",
      render: (value) => (
        <Badge variant={Boolean(value) ? "default" : "secondary"}>
          {Boolean(value) ? "Aktif" : "İnaktif"}
        </Badge>
      ),
    },
    {
      key: "id" as const,
      label: "İşlemler",
      width: "10%",
      render: (_value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/master/galleries/${row.id}`}>Detay</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setEditingId(row.id)
                setOpenForm(true)
              }}
            >
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.id)}
              className={ACTION_COLORS.destructiveText}
            >
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (isError) {
    return (
      <ErrorState
        message="Galeri verileri yüklenirken hata oluştu."
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Galeriler</h1>
          <p className="text-muted-foreground mt-1">
            Tüm galerilerinizi yönetin
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setOpenForm(true)
          }}
          className="gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Yeni Galeri
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={subscription} onValueChange={setSubscription}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Abonelik Türü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="BASIC">BASIC</SelectItem>
            <SelectItem value="PROFESSIONAL">PROFESSIONAL</SelectItem>
            <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={setIsActive}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">İnaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable<Gallery>
        columns={columns}
        data={(galleriesData as any)?.data || []}
        isLoading={isLoading}
        searchPlaceholder="Galeri ara..."
        onSearch={setSearch}
        pagination={{
          page,
          pageSize: 10,
          total: (galleriesData as any)?.pagination?.total || 0,
        }}
        onPageChange={setPage}
        rowKey="id"
        emptyState={{
          icon: Building2,
          title: "Henüz galeri eklenmemiş",
          description: "Yeni galeri ekleyerek başlayın.",
          action: (
            <Button
              onClick={() => {
                setEditingId(null)
                setOpenForm(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Galeri
            </Button>
          ),
        }}
        mobileCard={(row) => (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="font-semibold">{row.name}</p>
                {row.city && (
                  <p className="text-sm text-muted-foreground">{row.city}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="-mt-1 -mr-1">
                    ...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/master/galleries/${row.id}`}>Detay</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingId(row.id)
                      setOpenForm(true)
                    }}
                  >
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(row.id)}
                    className={ACTION_COLORS.destructiveText}
                  >
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={SUBSCRIPTION_BADGE_COLORS[row.subscription]}>
                {row.subscription}
              </Badge>
              <Badge variant={row.isActive ? "default" : "secondary"}>
                {row.isActive ? "Aktif" : "İnaktif"}
              </Badge>
            </div>
            {row.phone && (
              <p className="text-sm text-muted-foreground">{row.phone}</p>
            )}
            {row.email && (
              <p className="text-sm text-muted-foreground">{row.email}</p>
            )}
          </div>
        )}
      />

      {/* Form Dialog */}
      <GalleryFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        galleryId={editingId}
        onSuccess={() => {
          setOpenForm(false)
          setEditingId(null)
          queryClient.invalidateQueries({ queryKey: ["galleries"] })
        }}
      />
    </div>
  )
}
