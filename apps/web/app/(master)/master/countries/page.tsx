"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2, Edit2, Plus, Globe } from "lucide-react"
import api from "@/lib/api"
import { DataTable, type Column } from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CountryForm, type CountryFormValues } from "./components/country-form"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ACTION_COLORS } from "@/lib/design-tokens"

interface Country extends CountryFormValues {
  id: string
  createdAt: string
  updatedAt: string
}

interface CountriesResponse {
  success: boolean
  data: Country[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}

export default function CountriesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCountry, setEditingCountry] = React.useState<Country | null>(
    null
  )

  const pageSize = 10

  // Fetch countries
  const { data, isLoading } = useQuery({
    queryKey: ["countries", page, search],
    queryFn: async () => {
      const params: any = {
        page,
        limit: pageSize,
      }
      if (search) params.search = search

      const response = await api.get<CountriesResponse>("/countries", {
        params,
      })
      return response.data
    },
  })

  const countries = data?.data || []
  const total = data?.pagination?.total || 0

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Bu ülkeyi silmek istediğinize emin misiniz?")) return

    try {
      await api.delete(`/countries/${id}`)
      toast({
        title: "Başarılı",
        description: "Ülke başarıyla silindi",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["countries"] })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ülke silinirken hata oluştu",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (country: Country) => {
    setEditingCountry(country)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingCountry(null)
  }

  const handleNewCountry = () => {
    setEditingCountry(null)
    setFormOpen(true)
  }

  const columns: Column<Country>[] = [
    {
      key: "code" as keyof Country,
      label: "Ülke",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{row.flag || "🏳️"}</span>
          <span className="font-mono font-bold">{value}</span>
        </div>
      ),
      width: "120px",
    },
    {
      key: "name" as keyof Country,
      label: "Ülke Adı",
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: "customsDutyRate" as keyof Country,
      label: "Gümrük Vergisi",
      render: (value) => <span>{Number(value).toFixed(1)}%</span>,
      width: "120px",
    },
    {
      key: "isEU" as keyof Country,
      label: "AB",
      render: (value) =>
        value ? (
          <Badge variant="success">AB Üyesi</Badge>
        ) : (
          <Badge variant="secondary">AB Değil</Badge>
        ),
      width: "100px",
    },
    {
      key: "minShippingCost" as keyof Country,
      label: "Nakliye Aralığı",
      render: (value, row) => (
        <span>
          ${Number(value).toFixed(0)} - $
          {Number(row.maxShippingCost || 0).toFixed(0)}
        </span>
      ),
      width: "140px",
    },
    {
      key: "avgShippingDays" as keyof Country,
      label: "Orta. Gün",
      render: (value) => <span>{value ? `${value} gün` : "-"}</span>,
      width: "100px",
    },
    {
      key: "isActive" as keyof Country,
      label: "Durum",
      render: (value) =>
        value ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="secondary">İnaktif</Badge>
        ),
      width: "100px",
    },
    {
      key: "id" as keyof Country,
      label: "İşlemler",
      render: (value, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              ⋮
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(value as string)}
              className={ACTION_COLORS.destructiveText}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      width: "80px",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ülkeler</h1>
          <p className="text-muted-foreground mt-1">
            Köken ülkelerini ve vergi oranlarını yönetin
          </p>
        </div>
        <Button onClick={handleNewCountry} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Yeni Ülke
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ülke Listesi</CardTitle>
          <CardDescription>
            Tüm kayıtlı ülkeler ve bunların gümrük vergisi oranları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<Country>
            columns={columns}
            data={countries}
            isLoading={isLoading}
            searchPlaceholder="Ülke adı veya kodu ara..."
            onSearch={(query) => {
              setSearch(query)
              setPage(1)
            }}
            pagination={{
              page,
              pageSize,
              total,
            }}
            onPageChange={setPage}
            rowKey="id"
            emptyState={{ icon: Globe, title: "Henüz ülke eklenmemiş", description: "Menşe ülkeleri ekleyerek ithalat hesaplamalarına başlayın." }}
            mobileCard={(row) => (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{row.flag || "🏳️"}</span>
                    <div>
                      <p className="font-semibold text-sm">{row.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{row.code}</p>
                    </div>
                  </div>
                  {row.isActive ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary">İnaktif</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {row.isEU ? (
                    <Badge variant="success">AB Üyesi</Badge>
                  ) : (
                    <Badge variant="secondary">AB Değil</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Gümrük: {Number(row.customsDutyRate).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <CountryForm
        open={formOpen}
        onOpenChange={handleFormClose}
        initialData={editingCountry || undefined}
      />
    </div>
  )
}
