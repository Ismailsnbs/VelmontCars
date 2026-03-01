"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApiMutation } from "@/hooks/use-api"
import { Loader2 } from "lucide-react"
import { FORM_COLORS } from "@/lib/design-tokens"

const rateEntrySchema = z.object({
  currencyCode: z.string(),
  currencyName: z.string(),
  buyRate: z
    .string()
    .min(1, "Alış kuru zorunludur")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Geçerli bir sayı girin",
    }),
  sellRate: z
    .string()
    .min(1, "Satış kuru zorunludur")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Geçerli bir sayı girin",
    }),
})

const bulkUpdateSchema = z.object({
  rates: z.array(rateEntrySchema),
})

type BulkUpdateFormValues = z.infer<typeof bulkUpdateSchema>

interface ExchangeRate {
  id: string
  currencyCode: string
  currencyName: string
  buyRate: number | string
  sellRate: number | string
  source: string
  fetchedAt: string
  isActive: boolean
}

interface BulkUpdatePayload {
  rates: { currencyCode: string; buyRate: string; sellRate: string }[]
}

interface BulkUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRates: ExchangeRate[]
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  currentRates,
}: BulkUpdateDialogProps) {
  const queryClient = useQueryClient()

  const { control, register, reset, handleSubmit, formState: { errors } } =
    useForm<BulkUpdateFormValues>({
      resolver: zodResolver(bulkUpdateSchema),
      defaultValues: { rates: [] },
    })

  const { fields } = useFieldArray({ control, name: "rates" })

  useEffect(() => {
    if (open && currentRates.length > 0) {
      reset({
        rates: currentRates.map((rate) => ({
          currencyCode: rate.currencyCode,
          currencyName: rate.currencyName,
          buyRate: Number(rate.buyRate).toFixed(4),
          sellRate: Number(rate.sellRate).toFixed(4),
        })),
      })
    }
  }, [open, currentRates, reset])

  const { mutate, isPending } = useApiMutation<unknown, BulkUpdatePayload>(
    "/exchange-rates",
    "put",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["exchange-rates"] })
        onOpenChange(false)
      },
    }
  )

  const onSubmit = (values: BulkUpdateFormValues) => {
    mutate({
      rates: values.rates.map((r) => ({
        currencyCode: r.currencyCode,
        buyRate: r.buyRate,
        sellRate: r.sellRate,
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Döviz Kurlarını Manuel Güncelle</DialogTitle>
          <DialogDescription>
            Tüm kurları tek seferde güncelleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="bulk-update-form">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Kod</TableHead>
                <TableHead>Döviz Adı</TableHead>
                <TableHead className="w-36">Alış</TableHead>
                <TableHead className="w-36">Satış</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-sm">
                      {field.currencyCode}
                    </span>
                    <input
                      type="hidden"
                      {...register(`rates.${index}.currencyCode`)}
                    />
                    <input
                      type="hidden"
                      {...register(`rates.${index}.currencyName`)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {field.currencyName}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        {...register(`rates.${index}.buyRate`)}
                        type="number"
                        step="0.0001"
                        min="0"
                        className="h-8 text-sm"
                        placeholder="0.0000"
                      />
                      {errors.rates?.[index]?.buyRate && (
                        <p className={`text-xs ${FORM_COLORS.error}`}>
                          {errors.rates[index]?.buyRate?.message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        {...register(`rates.${index}.sellRate`)}
                        type="number"
                        step="0.0001"
                        min="0"
                        className="h-8 text-sm"
                        placeholder="0.0000"
                      />
                      {errors.rates?.[index]?.sellRate && (
                        <p className={`text-xs ${FORM_COLORS.error}`}>
                          {errors.rates[index]?.sellRate?.message}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {fields.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-6 text-sm"
                  >
                    Kur verisi bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Label className="text-xs text-gray-500">
              * Tüm alanlar zorunludur. Kaynak "manual" olarak işaretlenecektir.
            </Label>
          </div>
        </form>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button
            type="submit"
            form="bulk-update-form"
            disabled={isPending || fields.length === 0}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Güncelle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
