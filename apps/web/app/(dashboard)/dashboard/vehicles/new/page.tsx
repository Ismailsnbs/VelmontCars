"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { FORM_COLORS, STATUS_LABELS } from "@/lib/design-tokens"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ---- Types ---------------------------------------------------------------

interface OriginCountry {
  id: string
  name: string
  code: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ---- Schema --------------------------------------------------------------

const vehicleSchema = z.object({
  brand: z.string().min(1, "Marka zorunludur"),
  model: z.string().min(1, "Model zorunludur"),
  year: z.coerce.number().min(1900, "Geçerli bir yıl giriniz").max(
    new Date().getFullYear() + 1,
    "Geçerli bir yıl giriniz"
  ),
  engineCC: z.coerce.number().min(1, "Motor hacmi zorunludur"),
  originCountryId: z.string().min(1, "Menşe ülke zorunludur"),
  fobPrice: z.coerce.number().min(0, "FOB fiyat zorunludur"),
  fobCurrency: z.string().default("USD"),
  vin: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  mileage: z.coerce.number().optional(),
  bodyType: z.string().optional().or(z.literal("")),
  fuelType: z.enum(["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC", "LPG"]).optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT"]).optional(),
  shippingCost: z.coerce.number().optional(),
  insuranceCost: z.coerce.number().optional(),
  status: z.enum(["TRANSIT", "IN_STOCK", "RESERVED", "SOLD"]).optional(),
  estimatedArrival: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

// ---- Constants -----------------------------------------------------------

const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINE: "Benzin",
  DIESEL: "Dizel",
  HYBRID: "Hibrit",
  ELECTRIC: "Elektrik",
  LPG: "LPG",
}

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manuel",
  AUTOMATIC: "Otomatik",
  CVT: "CVT",
}

const FORM_STATUSES = ["TRANSIT", "IN_STOCK", "RESERVED", "SOLD"] as const

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "TRY"]

// ---- Utils ---------------------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    return resp?.data?.message ?? "Bir hata oluştu"
  }
  if (error instanceof Error) return error.message
  return "Bir hata oluştu"
}

function buildPayload(values: VehicleFormValues) {
  return {
    brand: values.brand,
    model: values.model,
    year: values.year,
    engineCC: values.engineCC,
    originCountryId: values.originCountryId,
    fobPrice: values.fobPrice,
    fobCurrency: values.fobCurrency || "USD",
    vin: values.vin || undefined,
    color: values.color || undefined,
    mileage: values.mileage || undefined,
    bodyType: values.bodyType || undefined,
    fuelType: values.fuelType || undefined,
    transmission: values.transmission || undefined,
    shippingCost: values.shippingCost || undefined,
    insuranceCost: values.insuranceCost || undefined,
    status: values.status || "TRANSIT",
    estimatedArrival: values.estimatedArrival
      ? new Date(values.estimatedArrival).toISOString()
      : undefined,
    description: values.description || undefined,
  }
}

// ---- Component -----------------------------------------------------------

export default function VehicleNewPage() {
  const router = useRouter()
  const { toast } = useToast()

  const { data: countriesRaw, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries-active"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OriginCountry[]>>("/countries/active")
      return data.data
    },
  })
  const countries: OriginCountry[] = countriesRaw ?? []

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      engineCC: 0,
      originCountryId: "",
      fobPrice: 0,
      fobCurrency: "USD",
      vin: "",
      color: "",
      mileage: undefined,
      bodyType: "",
      fuelType: undefined,
      transmission: undefined,
      shippingCost: undefined,
      insuranceCost: undefined,
      status: "TRANSIT",
      estimatedArrival: "",
      description: "",
    },
  })

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = form

  const createMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const payload = buildPayload(values)
      const { data } = await api.post<ApiResponse<{ id: string }>>("/vehicles", payload)
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: "Araç oluşturuldu. Şimdi görsel ekleyebilirsiniz.",
        variant: "default",
      })
      router.push(`/dashboard/vehicles/${data.data.id}?tab=images`)
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })

  const isPending = createMutation.isPending

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(values)
  })

  const fuelTypeValue = watch("fuelType")
  const transmissionValue = watch("transmission")
  const statusValue = watch("status")
  const fobCurrencyValue = watch("fobCurrency")
  const originCountryIdValue = watch("originCountryId")

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link href="/dashboard/vehicles">
          <Button variant="outline" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Yeni Araç Ekle</h1>
        <p className="text-muted-foreground mt-1">
          Yeni bir araç kaydı oluşturun
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="brand">Marka *</Label>
                <Input
                  id="brand"
                  placeholder="ör. Toyota"
                  {...register("brand")}
                  disabled={isPending}
                />
                {errors.brand && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="ör. Corolla"
                  {...register("model")}
                  disabled={isPending}
                />
                {errors.model && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>{errors.model.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="year">Yıl *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  {...register("year")}
                  disabled={isPending}
                />
                {errors.year && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>{errors.year.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="engineCC">Motor Hacmi (cc) *</Label>
                <Input
                  id="engineCC"
                  type="number"
                  min="1"
                  placeholder="ör. 1600"
                  {...register("engineCC")}
                  disabled={isPending}
                />
                {errors.engineCC && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>{errors.engineCC.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bodyType">Kasa Tipi</Label>
                <Input
                  id="bodyType"
                  placeholder="ör. Sedan"
                  {...register("bodyType")}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color">Renk</Label>
                <Input
                  id="color"
                  placeholder="ör. Beyaz"
                  {...register("color")}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vin">Şasi No (VIN)</Label>
                <Input
                  id="vin"
                  placeholder="ör. JN1AA5AR0AM500000"
                  {...register("vin")}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mileage">Kilometre</Label>
                <Input
                  id="mileage"
                  type="number"
                  min="0"
                  placeholder="ör. 15000"
                  {...register("mileage")}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fuelType">Yakıt Tipi</Label>
                <Select
                  value={fuelTypeValue ?? ""}
                  onValueChange={(val) =>
                    setValue("fuelType", val as VehicleFormValues["fuelType"], {
                      shouldValidate: true,
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="transmission">Vites Tipi</Label>
                <Select
                  value={transmissionValue ?? ""}
                  onValueChange={(val) =>
                    setValue("transmission", val as VehicleFormValues["transmission"], {
                      shouldValidate: true,
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="transmission">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menşe & Fiyat */}
        <Card>
          <CardHeader>
            <CardTitle>Menşe &amp; Fiyat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="originCountryId">Menşe Ülke *</Label>
                <Select
                  value={originCountryIdValue}
                  onValueChange={(val) =>
                    setValue("originCountryId", val, { shouldValidate: true })
                  }
                  disabled={isPending || isLoadingCountries}
                >
                  <SelectTrigger id="originCountryId">
                    <SelectValue
                      placeholder={
                        isLoadingCountries ? "Yükleniyor..." : "Ülke seçiniz"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.originCountryId && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>
                    {errors.originCountryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fobPrice">FOB Fiyat *</Label>
                <Input
                  id="fobPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ör. 6000"
                  {...register("fobPrice")}
                  disabled={isPending}
                />
                {errors.fobPrice && (
                  <p className={`text-xs ${FORM_COLORS.error}`}>{errors.fobPrice.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fobCurrency">Para Birimi</Label>
                <Select
                  value={fobCurrencyValue || "USD"}
                  onValueChange={(val) =>
                    setValue("fobCurrency", val, { shouldValidate: true })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="fobCurrency">
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shippingCost">Nakliye Maliyeti</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ör. 600"
                  {...register("shippingCost")}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="insuranceCost">Sigorta Maliyeti</Label>
                <Input
                  id="insuranceCost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ör. 100"
                  {...register("insuranceCost")}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Durum */}
        <Card>
          <CardHeader>
            <CardTitle>Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Araç Durumu</Label>
                <Select
                  value={statusValue ?? "TRANSIT"}
                  onValueChange={(val) =>
                    setValue("status", val as VehicleFormValues["status"], {
                      shouldValidate: true,
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estimatedArrival">Tahmini Varış Tarihi</Label>
                <Input
                  id="estimatedArrival"
                  type="date"
                  {...register("estimatedArrival")}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Araç hakkında ek bilgiler..."
                rows={3}
                {...register("description")}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Kaydediliyor..." : "Aracı Kaydet"}
          </Button>
          <Link href="/dashboard/vehicles">
            <Button type="button" variant="outline" disabled={isPending}>
              İptal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
