"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useApiMutation } from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { FORM_COLORS } from "@/lib/design-tokens"

const countryFormSchema = z.object({
  code: z
    .string()
    .length(2, "Ülke kodu 2 karakter olmalıdır")
    .toUpperCase(),
  name: z.string().min(1, "Ülke adı gerekli"),
  flag: z.string().optional().default(""),
  customsDutyRate: z
    .number()
    .min(0, "Gümrük vergisi oranı negatif olamaz")
    .max(100, "Gümrük vergisi oranı %100'ü geçemez"),
  isEU: z.boolean().default(false),
  minShippingCost: z
    .number()
    .min(0, "Minimum nakliye maliyeti negatif olamaz"),
  maxShippingCost: z
    .number()
    .min(0, "Maksimum nakliye maliyeti negatif olamaz"),
  avgShippingDays: z
    .number()
    .int()
    .min(0, "Ortalama gün negatif olamaz")
    .optional()
    .nullable(),
  notes: z.string().optional().default(""),
  isActive: z.boolean().default(true),
})

export type CountryFormValues = z.infer<typeof countryFormSchema>

interface CountryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: CountryFormValues & { id: string }
}

export function CountryForm({
  open,
  onOpenChange,
  initialData,
}: CountryFormProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      flag: "",
      customsDutyRate: 10,
      isEU: false,
      minShippingCost: 0,
      maxShippingCost: 0,
      avgShippingDays: null,
      notes: "",
      isActive: true,
    },
  })

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset(initialData)
      } else {
        form.reset({
          code: "",
          name: "",
          flag: "",
          customsDutyRate: 10,
          isEU: false,
          minShippingCost: 0,
          maxShippingCost: 0,
          avgShippingDays: null,
          notes: "",
          isActive: true,
        })
      }
    }
  }, [open, initialData, form])

  const createMutation = useApiMutation<
    { id: string },
    CountryFormValues
  >("/countries", "post", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] })
      toast({
        title: "Başarılı",
        description: "Ülke başarıyla oluşturuldu",
        variant: "default",
      })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error("Create error:", error)
    },
  })

  const updateMutation = useApiMutation<
    { id: string },
    CountryFormValues
  >(`/countries/${initialData?.id}`, "put", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] })
      toast({
        title: "Başarılı",
        description: "Ülke başarıyla güncellendi",
        variant: "default",
      })
      onOpenChange(false)
    },
    onError: (error) => {
      console.error("Update error:", error)
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: CountryFormValues) {
    // Validate shipping costs
    if (values.minShippingCost > values.maxShippingCost) {
      toast({
        title: "Hata",
        description: "Minimum nakliye maliyeti maksimumdan fazla olamaz",
        variant: "destructive",
      })
      return
    }

    if (initialData) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Ülkeyi Düzenle" : "Yeni Ülke"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Ülke bilgilerini güncelleyin"
              : "Yeni bir ülke ekleyin"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Ülke Kodu</Label>
              <Controller
                control={form.control}
                name="code"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="code"
                      placeholder="TR"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      disabled={!!initialData}
                    />
                    {fieldState.error && (
                      <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flag">Bayrak</Label>
              <Controller
                control={form.control}
                name="flag"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="flag"
                      placeholder="🇹🇷"
                      {...field}
                      maxLength={2}
                    />
                    {fieldState.error && (
                      <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Ülke Adı</Label>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input id="name" placeholder="Türkiye" {...field} />
                  {fieldState.error && (
                    <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customsDutyRate">Gümrük Vergisi Oranı (%)</Label>
            <Controller
              control={form.control}
              name="customsDutyRate"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    id="customsDutyRate"
                    type="number"
                    placeholder="10"
                    step="0.1"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                  {fieldState.error && (
                    <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="isEU" className="cursor-pointer">
              AB Üyesi
            </Label>
            <Controller
              control={form.control}
              name="isEU"
              render={({ field }) => (
                <Switch
                  id="isEU"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minShippingCost">Min. Nakliye ($)</Label>
              <Controller
                control={form.control}
                name="minShippingCost"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="minShippingCost"
                      type="number"
                      placeholder="500"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                    {fieldState.error && (
                      <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxShippingCost">Max. Nakliye ($)</Label>
              <Controller
                control={form.control}
                name="maxShippingCost"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      id="maxShippingCost"
                      type="number"
                      placeholder="2000"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                    {fieldState.error && (
                      <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avgShippingDays">Ortalama Nakliye Günü</Label>
            <Controller
              control={form.control}
              name="avgShippingDays"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    id="avgShippingDays"
                    type="number"
                    placeholder="14"
                    min="0"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                  {fieldState.error && (
                    <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="notes"
                    placeholder="Ülke hakkında notlar..."
                    {...field}
                    rows={3}
                  />
                  {fieldState.error && (
                    <p className={`text-sm font-medium ${FORM_COLORS.error}`}>
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="isActive" className="cursor-pointer">
              Aktif
            </Label>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Yükleniyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
