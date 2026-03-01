"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiQuery } from "@/hooks/use-api"
import GalleryFormDialog from "../components/gallery-form"
import { SUBSCRIPTION_BADGE_COLORS, ALERT_COLORS } from "@/lib/design-tokens"

interface Gallery {
  id: string
  name: string
  slug: string
  address?: string
  city?: string
  phone?: string
  email?: string
  logo?: string
  subscription: "BASIC" | "PROFESSIONAL" | "ENTERPRISE"
  subscriptionEnds?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface GalleryStats {
  userCount?: number
  vehicleCount?: number
  productCount?: number
  customerCount?: number
  saleCount?: number
}


export default function GalleryDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [openForm, setOpenForm] = useState(false)

  // Fetch gallery
  const {
    data: galleryRaw,
    isLoading: isLoadingGallery,
    isError,
  } = useApiQuery<Gallery>(
    ["gallery", params.id],
    `/galleries/${params.id}`
  )
  const gallery = galleryRaw as Gallery | undefined

  // Fetch gallery stats
  const { data: statsRaw, isLoading: isLoadingStats } = useApiQuery<GalleryStats>(
    ["gallery-stats", params.id],
    `/galleries/${params.id}/stats`
  )
  const stats = statsRaw as GalleryStats | undefined

  if (isError) {
    return (
      <div className="space-y-4">
        <Link href="/master/galleries">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </Link>
        <Card>
          <CardContent className={`pt-6 text-center ${ALERT_COLORS.error.text}`}>
            Galeri bulunamadı
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/master/galleries">
            <Button variant="outline" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Geri Dön
            </Button>
          </Link>
          {isLoadingGallery ? (
            <Skeleton className="h-8 w-64" />
          ) : gallery ? (
            <h1 className="text-3xl font-bold tracking-tight">
              {gallery.name}
            </h1>
          ) : null}
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Düzenle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gallery Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Galeri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingGallery ? (
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </>
            ) : gallery ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-mono">{gallery.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adres</p>
                  <p>{gallery.address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Şehir</p>
                  <p>{gallery.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p>{gallery.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-posta</p>
                  <p>{gallery.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logo URL</p>
                  <p className="text-xs break-all">{gallery.logo || "-"}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Subscription & Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Abonelik & Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingGallery ? (
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </>
            ) : gallery ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Abonelik Türü</p>
                  <Badge className={`mt-2 ${SUBSCRIPTION_BADGE_COLORS[gallery.subscription]}`}>
                    {gallery.subscription}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durum</p>
                  <Badge
                    variant={gallery.isActive ? "default" : "secondary"}
                    className="mt-2"
                  >
                    {gallery.isActive ? "Aktif" : "İnaktif"}
                  </Badge>
                </div>
                {gallery.subscriptionEnds && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Abonelik Bitiş Tarihi
                    </p>
                    <p className="mt-1">
                      {new Date(gallery.subscriptionEnds).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                )}
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-4">
                  <p>Oluşturulma: {new Date(gallery.createdAt).toLocaleString("tr-TR")}</p>
                  <p>Güncellenme: {new Date(gallery.updatedAt).toLocaleString("tr-TR")}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">İstatistikler</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Kullanıcılar", value: "userCount" },
            { label: "Araçlar", value: "vehicleCount" },
            { label: "Ürünler", value: "productCount" },
            { label: "Müşteriler", value: "customerCount" },
            { label: "Satışlar", value: "saleCount" },
          ].map((stat) => (
            <Card key={stat.value}>
              <CardContent className="pt-6 text-center">
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {stats ? ((stats[stat.value as keyof GalleryStats] as number) || 0) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Form Dialog */}
      <GalleryFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        galleryId={params.id}
        onSuccess={() => setOpenForm(false)}
      />
    </div>
  )
}
