import { z } from "zod"
import { CURRENT_YEAR } from "./constants"

export const calculatorSchema = z.object({
  fobPrice: z
    .number({ invalid_type_error: "Gecerli bir tutar giriniz" })
    .positive("FOB fiyati pozitif olmali"),
  fobCurrency: z.string().default("USD"),
  originCountryId: z.string().min(1, "Mense ulke seciniz"),
  engineCC: z
    .number({ invalid_type_error: "Gecerli bir deger giriniz" })
    .int()
    .positive()
    .max(20000),
  vehicleType: z.enum(["PASSENGER", "COMMERCIAL"]),
  modelYear: z
    .number({ invalid_type_error: "Gecerli bir yil giriniz" })
    .int()
    .min(1900)
    .max(CURRENT_YEAR + 1),
  shippingCost: z
    .number({ invalid_type_error: "Gecerli bir tutar giriniz" })
    .min(0)
    .default(0),
  insuranceCost: z
    .number({ invalid_type_error: "Gecerli bir tutar giriniz" })
    .min(0)
    .default(0),
})

export type CalculatorFormValues = z.infer<typeof calculatorSchema>
