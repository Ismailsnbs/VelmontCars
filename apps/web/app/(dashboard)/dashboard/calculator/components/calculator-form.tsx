"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calculator, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { FORM_COLORS } from "@/lib/design-tokens"
import { calculatorSchema, type CalculatorFormValues } from "../schema"
import { CURRENCY_OPTIONS, VEHICLE_TYPE_OPTIONS, CURRENT_YEAR } from "../constants"
import type { OriginCountry } from "../types"

interface CalculationFormProps {
  countries: OriginCountry[]
  isPending: boolean
  onSubmit: (values: CalculatorFormValues) => void
}

export function CalculationForm({ countries, isPending, onSubmit }: CalculationFormProps) {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      fobCurrency: "USD",
      vehicleType: "PASSENGER",
      shippingCost: 0,
      insuranceCost: 0,
    },
  })

  const fobCurrency = watch("fobCurrency")
  const vehicleType = watch("vehicleType")
  const originCountryId = watch("originCountryId")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Arac Bilgileri</CardTitle>
        <CardDescription>
          Hesaplama icin arac ve fiyat bilgilerini giriniz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* FOB + Currency */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="fobPrice">FOB Fiyati *</Label>
              <Input
                id="fobPrice"
                type="number"
                placeholder="6000"
                step="0.01"
                min="0"
                disabled={isPending}
                {...register("fobPrice", { valueAsNumber: true })}
              />
              {errors.fobPrice && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.fobPrice.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fobCurrency">Para Birimi</Label>
              <Select
                value={fobCurrency}
                onValueChange={(val) => setValue("fobCurrency", val, { shouldValidate: true })}
                disabled={isPending}
              >
                <SelectTrigger id="fobCurrency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shipping + Insurance */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shippingCost">Nakliye Ucreti (USD)</Label>
              <Input
                id="shippingCost"
                type="number"
                placeholder="600"
                step="0.01"
                min="0"
                disabled={isPending}
                {...register("shippingCost", { valueAsNumber: true })}
              />
              {errors.shippingCost && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.shippingCost.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="insuranceCost">Sigorta Ucreti (USD)</Label>
              <Input
                id="insuranceCost"
                type="number"
                placeholder="100"
                step="0.01"
                min="0"
                disabled={isPending}
                {...register("insuranceCost", { valueAsNumber: true })}
              />
              {errors.insuranceCost && (
                <p className={`text-xs ${FORM_COLORS.error}`}>
                  {errors.insuranceCost.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Origin country + Vehicle type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="originCountryId">Mense Ulke *</Label>
              <Select
                value={originCountryId ?? ""}
                onValueChange={(val) =>
                  setValue("originCountryId", val, { shouldValidate: true })
                }
                disabled={isPending}
              >
                <SelectTrigger id="originCountryId">
                  <SelectValue placeholder="Ulke secin..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
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
              <Label htmlFor="vehicleType">Arac Tipi *</Label>
              <Select
                value={vehicleType}
                onValueChange={(val) =>
                  setValue("vehicleType", val as "PASSENGER" | "COMMERCIAL", {
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger id="vehicleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleType && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.vehicleType.message}</p>
              )}
            </div>
          </div>

          {/* Engine CC + Model year */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="engineCC">Motor Hacmi (cc) *</Label>
              <Input
                id="engineCC"
                type="number"
                placeholder="1600"
                min="1"
                max="20000"
                disabled={isPending}
                {...register("engineCC", { valueAsNumber: true })}
              />
              {errors.engineCC && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.engineCC.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modelYear">Model Yili *</Label>
              <Input
                id="modelYear"
                type="number"
                placeholder={String(CURRENT_YEAR)}
                min="1900"
                max={CURRENT_YEAR + 1}
                disabled={isPending}
                {...register("modelYear", { valueAsNumber: true })}
              />
              {errors.modelYear && (
                <p className={`text-xs ${FORM_COLORS.error}`}>{errors.modelYear.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hesaplaniyor...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Hesapla
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
