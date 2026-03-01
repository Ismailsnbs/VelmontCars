"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApiQuery, useApiMutation } from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { FORM_COLORS } from "@/lib/design-tokens"

// Validation schema
const galleryFormSchema = z.object({
  name: z.string().min(1, "Galeri adı gereklidir"),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.union([z.string().email("Geçerli bir e-posta adresi giriniz"), z.literal("")]).optional().nullable(),
  logo: z.string().optional().nullable(),
  subscription: z.enum(["BASIC", "PROFESSIONAL", "ENTERPRISE"]),
  subscriptionEnds: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

type GalleryFormValues = z.infer<typeof galleryFormSchema>

interface Gallery extends Omit<GalleryFormValues, 'email' | 'subscriptionEnds'> {
  id: string
  slug: string
  email?: string
  subscriptionEnds?: string
  createdAt: string
  updatedAt: string
}

interface GalleryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  galleryId?: string | null
  onSuccess?: () => void
}

export default function GalleryFormDialog({
  open,
  onOpenChange,
  galleryId,
  onSuccess,
}: GalleryFormDialogProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      logo: "",
      subscription: "BASIC",
      subscriptionEnds: "",
      isActive: true,
    },
  })

  const isActive = watch("isActive")

  // Fetch gallery if editing
  const { data: galleryDataRaw } = useApiQuery<Gallery>(
    ["gallery", galleryId || ""],
    `/galleries/${galleryId || ""}`,
    {},
    { enabled: !!galleryId && open }
  )
  const galleryData: Gallery | undefined = (galleryDataRaw as any) || undefined

  // Set form values when gallery data is loaded
  useEffect(() => {
    if (galleryData) {
      reset({
        name: galleryData.name,
        address: galleryData.address || null,
        city: galleryData.city || null,
        phone: galleryData.phone || null,
        email: galleryData.email || null,
        logo: galleryData.logo || null,
        subscription: galleryData.subscription,
        subscriptionEnds: galleryData.subscriptionEnds || null,
        isActive: galleryData.isActive,
      } as any)
    } else if (!galleryId) {
      reset()
    }
  }, [galleryData, galleryId, reset])

  // Create/Update mutations
  const createGallery = useApiMutation<Gallery, GalleryFormValues>(
    "/galleries",
    "post",
    {
      onSuccess: () => {
        toast({
          title: "Başarılı",
          description: "Galeri oluşturuldu",
        })
        onOpenChange(false)
        onSuccess?.()
      },
    }
  )

  const updateGallery = useApiMutation<Gallery, GalleryFormValues>(
    `/galleries/${galleryId || ""}`,
    "put",
    {
      onSuccess: () => {
        toast({
          title: "Başarılı",
          description: "Galeri güncellendi",
        })
        onOpenChange(false)
        onSuccess?.()
      },
    }
  )

  const onSubmit = async (values: GalleryFormValues) => {
    if (galleryId) {
      updateGallery.mutate(values)
    } else {
      createGallery.mutate(values)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {galleryId ? "Galeriyi Düzenle" : "Yeni Galeri Oluştur"}
          </DialogTitle>
          <DialogDescription>
            {galleryId
              ? "Galeri bilgilerini güncelleyin"
              : "Yeni bir galeri ekleyin"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Galeri Adı */}
          <div className="space-y-2">
            <Label htmlFor="name">Galeri Adı *</Label>
            <Input
              id="name"
              placeholder="Örn: Grand Auto Gallery"
              {...register("name")}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className={`text-sm ${FORM_COLORS.error}`}>{errors.name.message}</p>
            )}
          </div>

          {/* Adres ve Şehir */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                placeholder="Galeri adresi"
                {...register("address")}
                disabled={isSubmitting}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                placeholder="Örn: Lefkoşa"
                {...register("city")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Telefon ve E-posta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                placeholder="Örn: +90 (212) 555-1234"
                {...register("phone")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="Örn: info@gallery.com"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className={`text-sm ${FORM_COLORS.error}`}>{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Logo ve Abonelik */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                placeholder="https://example.com/logo.png"
                {...register("logo")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscription">Abonelik Türü *</Label>
              <Select
                defaultValue="BASIC"
                onValueChange={(value) =>
                  setValue("subscription", value as any)
                }
              >
                <SelectTrigger id="subscription">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="PROFESSIONAL">PROFESSIONAL</SelectItem>
                  <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Abonelik Bitiş ve Durum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscriptionEnds">Abonelik Bitiş Tarihi</Label>
              <Input
                id="subscriptionEnds"
                type="date"
                {...register("subscriptionEnds")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-3">
                <Label htmlFor="isActive">Aktif</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
