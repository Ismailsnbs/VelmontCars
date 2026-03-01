"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FORM_COLORS } from "@/lib/design-tokens"

// ---- Types ----------------------------------------------------------------

export type RateType = "PERCENTAGE" | "FIXED" | "PER_CC"
export type VehicleCategory = "PASSENGER" | "COMMERCIAL" | "ALL"

export interface TaxRate {
  id: string
  code: string
  name: string
  nameEn: string | null
  rate: string | number
  rateType: RateType
  vehicleType: VehicleCategory | null
  minEngineCC: number | null
  maxEngineCC: number | null
  description: string | null
  isActive: boolean
  effectiveFrom: string
  effectiveTo: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ---- Zod schema -----------------------------------------------------------

const baseTaxRateSchema = z.object({
  code: z.string().min(1, "Kod zorunludur").max(50, "Kod en fazla 50 karakter olabilir"),
  name: z.string().min(1, "Ad zorunludur").max(100, "Ad en fazla 100 karakter olabilir"),
  nameEn: z.string().max(100).optional().or(z.literal("")),
  rate: z
    .string()
    .min(1, "Oran zorunludur")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Geçerli bir oran giriniz",
    }),
  rateType: z.enum(["PERCENTAGE", "FIXED", "PER_CC"], {
    required_error: "Oran tipi zorunludur",
  }),
  vehicleType: z.enum(["PASSENGER", "COMMERCIAL", "ALL", "__none__"]).optional().or(z.literal("")).or(z.literal(undefined)),
  minEngineCC: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Geçerli bir değer giriniz",
    }),
  maxEngineCC: z
    .string()
    .optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), {
      message: "Geçerli bir değer giriniz",
    }),
  description: z.string().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  effectiveFrom: z.string().min(1, "Yürürlük başlangıcı zorunludur"),
  effectiveTo: z.string().optional().or(z.literal("")),
})

const createTaxRateSchema = baseTaxRateSchema

const editTaxRateSchema = baseTaxRateSchema.extend({
  reason: z.string().min(1, "Değişiklik sebebi zorunludur (geçmiş için)").max(500),
})

type EditFormValues = z.infer<typeof editTaxRateSchema>

// ---- Helpers --------------------------------------------------------------

const RATE_TYPE_LABELS: Record<RateType, string> = {
  PERCENTAGE: "Yüzde (%)",
  FIXED: "Sabit (TL)",
  PER_CC: "CC başına (TL/cc)",
}

const VEHICLE_TYPE_LABELS: Record<VehicleCategory, string> = {
  PASSENGER: "Binek",
  COMMERCIAL: "Ticari",
  ALL: "Tumu",
}

// ---- Component ------------------------------------------------------------

interface TaxRateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxRate?: TaxRate | null
}

export function TaxRateForm({ open, onOpenChange, taxRate }: TaxRateFormProps) {
  const isEditing = Boolean(taxRate)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const schema = isEditing ? editTaxRateSchema : createTaxRateSchema

  const form = useForm<EditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      nameEn: "",
      rate: "",
      rateType: "PERCENTAGE",
      vehicleType: undefined,
      minEngineCC: "",
      maxEngineCC: "",
      description: "",
      isActive: true,
      effectiveFrom: "",
      effectiveTo: "",
      reason: "",
    },
  })

  // Populate form when editing
  React.useEffect(() => {
    if (taxRate) {
      form.reset({
        code: taxRate.code,
        name: taxRate.name,
        nameEn: taxRate.nameEn ?? "",
        rate: String(taxRate.rate),
        rateType: taxRate.rateType,
        vehicleType: taxRate.vehicleType ?? undefined,
        minEngineCC: taxRate.minEngineCC != null ? String(taxRate.minEngineCC) : "",
        maxEngineCC: taxRate.maxEngineCC != null ? String(taxRate.maxEngineCC) : "",
        description: taxRate.description ?? "",
        isActive: taxRate.isActive,
        effectiveFrom: taxRate.effectiveFrom
          ? taxRate.effectiveFrom.slice(0, 10)
          : "",
        effectiveTo: taxRate.effectiveTo
          ? taxRate.effectiveTo.slice(0, 10)
          : "",
        reason: "",
      })
    } else {
      form.reset({
        code: "",
        name: "",
        nameEn: "",
        rate: "",
        rateType: "PERCENTAGE",
        vehicleType: undefined,
        minEngineCC: "",
        maxEngineCC: "",
        description: "",
        isActive: true,
        effectiveFrom: "",
        effectiveTo: "",
        reason: "",
      })
    }
  }, [taxRate, form, open])

  // ---- Mutations -----------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      const payload = buildPayload(values)
      const { data } = await api.post("/tax-rates", payload)
      return data
    },
    onSuccess: () => {
      toast({ title: "Basarili", description: "Vergi orani olusturuldu.", variant: "default" })
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] })
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error)
      toast({ title: "Hata", description: message, variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      const payload = buildPayload(values)
      const { data } = await api.put(`/tax-rates/${taxRate!.id}`, payload)
      return data
    },
    onSuccess: () => {
      toast({ title: "Basarili", description: "Vergi orani guncellendi.", variant: "default" })
      queryClient.invalidateQueries({ queryKey: ["tax-rates"] })
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error)
      toast({ title: "Hata", description: message, variant: "destructive" })
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  // ---- Submit --------------------------------------------------------------

  const onSubmit = form.handleSubmit((values) => {
    if (isEditing) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  })

  // ---- Render --------------------------------------------------------------

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form

  const isActiveValue = watch("isActive")
  const rateTypeValue = watch("rateType")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Vergi Oranini Duzenle" : "Yeni Vergi Orani"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 pt-2">
          {/* Row: Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                placeholder="orn. GUMRUK_AB"
                {...register("code")}
                disabled={isPending}
              />
              {errors.code && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Ad *</Label>
              <Input
                id="name"
                placeholder="Gümrük Vergisi"
                {...register("name")}
                disabled={isPending}
              />
              {errors.name && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* nameEn */}
          <div className="space-y-1.5">
            <Label htmlFor="nameEn">Ingilizce Ad</Label>
            <Input
              id="nameEn"
              placeholder="Customs Duty"
              {...register("nameEn")}
              disabled={isPending}
            />
            {errors.nameEn && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.nameEn.message}</p>
            )}
          </div>

          {/* Row: Rate + RateType */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rate">Oran *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                placeholder={
                  rateTypeValue === "PERCENTAGE"
                    ? "18"
                    : rateTypeValue === "FIXED"
                    ? "33.50"
                    : "2.03"
                }
                {...register("rate")}
                disabled={isPending}
              />
              {errors.rate && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.rate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rateType">Oran Tipi *</Label>
              <Select
                value={rateTypeValue}
                onValueChange={(val) => setValue("rateType", val as RateType, { shouldValidate: true })}
                disabled={isPending}
              >
                <SelectTrigger id="rateType">
                  <SelectValue placeholder="Seciniz" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(RATE_TYPE_LABELS) as [RateType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {errors.rateType && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.rateType.message}</p>
              )}
            </div>
          </div>

          {/* Row: VehicleType + Engine CC */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleType">Arac Tipi</Label>
              <Select
                value={watch("vehicleType") ?? ""}
                onValueChange={(val) =>
                  setValue("vehicleType", val as VehicleCategory | undefined, { shouldValidate: true })
                }
                disabled={isPending}
              >
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder="Seciniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {(Object.entries(VEHICLE_TYPE_LABELS) as [VehicleCategory, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minEngineCC">Min. Motor Hacmi (cc)</Label>
              <Input
                id="minEngineCC"
                type="number"
                min="0"
                placeholder="1001"
                {...register("minEngineCC")}
                disabled={isPending}
              />
              {errors.minEngineCC && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.minEngineCC.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxEngineCC">Max. Motor Hacmi (cc)</Label>
              <Input
                id="maxEngineCC"
                type="number"
                min="0"
                placeholder="1600"
                {...register("maxEngineCC")}
                disabled={isPending}
              />
              {errors.maxEngineCC && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.maxEngineCC.message}</p>
              )}
            </div>
          </div>

          {/* Row: EffectiveFrom + EffectiveTo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="effectiveFrom">Yururluk Baslangici *</Label>
              <Input
                id="effectiveFrom"
                type="date"
                {...register("effectiveFrom")}
                disabled={isPending}
              />
              {errors.effectiveFrom && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.effectiveFrom.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="effectiveTo">Yururluk Sonu</Label>
              <Input
                id="effectiveTo"
                type="date"
                {...register("effectiveTo")}
                disabled={isPending}
              />
              {errors.effectiveTo && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.effectiveTo.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Aciklama</Label>
            <Textarea
              id="description"
              placeholder="Vergi orani hakkinda aciklama..."
              rows={3}
              {...register("description")}
              disabled={isPending}
            />
            {errors.description && (
              <p className={`text-xs ${FORM_COLORS.error}`}>{errors.description.message}</p>
            )}
          </div>

          {/* isActive switch */}
          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={isActiveValue}
              onCheckedChange={(checked) =>
                setValue("isActive", checked, { shouldValidate: true })
              }
              disabled={isPending}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Durum: {isActiveValue ? "Aktif" : "Pasif"}
            </Label>
          </div>

          {/* Reason — only for edit */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="reason">Degisiklik Sebebi *</Label>
              <Textarea
                id="reason"
                placeholder="Bu degisikligi neden yapiyorsunuz?"
                rows={2}
                {...register("reason")}
                disabled={isPending}
              />
              {errors.reason && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.reason.message}</p>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Iptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Kaydediliyor..."
                : isEditing
                ? "Guncelle"
                : "Olustur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---- Utils ----------------------------------------------------------------

function buildPayload(values: EditFormValues) {
  return {
    code: values.code,
    name: values.name,
    nameEn: values.nameEn || undefined,
    rate: Number(values.rate),
    rateType: values.rateType,
    vehicleType: ((): VehicleCategory | undefined => {
      const vt = values.vehicleType as string | undefined
      if (!vt || vt === "__none__") return undefined
      return vt as VehicleCategory
    })(),
    minEngineCC: values.minEngineCC ? Number(values.minEngineCC) : undefined,
    maxEngineCC: values.maxEngineCC ? Number(values.maxEngineCC) : undefined,
    description: values.description || undefined,
    isActive: values.isActive,
    effectiveFrom: values.effectiveFrom
      ? new Date(values.effectiveFrom).toISOString()
      : undefined,
    effectiveTo: values.effectiveTo
      ? new Date(values.effectiveTo).toISOString()
      : undefined,
    reason: "reason" in values ? values.reason : undefined,
  }
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response: { data?: { message?: string } } }).response
    return response.data?.message ?? "Bir hata olustu"
  }
  if (error instanceof Error) return error.message
  return "Bir hata olustu"
}
