// KKTC Araç İthalat Maliyet Hesaplama Motoru
// T-037 + T-038: Calculator Service + TaxSnapshot Mechanism
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { auditService } from './audit.service';

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const TAX_CODE = {
  CUSTOMS_DUTY: 'CUSTOMS_DUTY',
  FIF: 'FIF',
  KDV_PASSENGER: 'KDV_PASSENGER',
  KDV_COMMERCIAL: 'KDV_COMMERCIAL',
  GKK: 'GKK',
  WHARF_FEE: 'WHARF_FEE',
  GENERAL_FIF: 'GENERAL_FIF',
  BANDROL: 'BANDROL',
} as const;

// FIF fallback oranları — TaxRate tablosunda kayıt yoksa kullanılır
const FIF_FALLBACK_RATES: { min: number; max: number | null; rate: number }[] = [
  { min: 0,    max: 1000, rate: 0.15 },
  { min: 1001, max: 1600, rate: 0.18 },
  { min: 1601, max: 2000, rate: 0.22 },
  { min: 2001, max: 2500, rate: 0.25 },
  { min: 2501, max: null, rate: 0.30 },
];

const DEFAULT_RATES = {
  CUSTOMS_DUTY: 0.10,
  GKK:          0.025,
  WHARF_FEE:    0.044,
  KDV_PASSENGER: 0.20,
  KDV_COMMERCIAL: 0.16,
  GENERAL_FIF_PER_CC: 2.03, // TL / cc
  BANDROL_TL: 33.5,          // sabit TL
} as const;

// ─── Tipler ────────────────────────────────────────────────────────────────────

export interface CalculateInput {
  fobPrice: number;
  fobCurrency: string;       // USD | EUR | GBP | ...
  originCountryId: string;   // OriginCountry ID
  engineCC: number;
  vehicleType: 'PASSENGER' | 'COMMERCIAL';
  modelYear: number;
  shippingCost: number;
  insuranceCost: number;
  galleryId: string;
  calculatedBy: string;
  vehicleId?: string;
  preview?: boolean;          // O-1: true ise DB'ye yazmadan sonuç döndür
}

export interface TaxDetail {
  rate: number;
  amount: number;
}

export interface GeneralFifDetail {
  ratePerCC: number;
  amountTL: number;
  amountUSD: number;
}

export interface BandrolDetail {
  amountTL: number;
  amountUSD: number;
}

export interface CalculationResult {
  id: string;
  input: {
    fobPrice: number;
    fobCurrency: string;
    originCountry: string;
    engineCC: number;
    vehicleType: string;
    modelYear: number;
    shippingCost: number;
    insuranceCost: number;
  };
  exchangeRate: number;
  cifValue: number;
  taxes: {
    customsDuty: TaxDetail;
    fif: TaxDetail;
    kdv: TaxDetail;
    gkk: TaxDetail;
    wharfFee: TaxDetail;
    generalFif: GeneralFifDetail;
    bandrol: BandrolDetail;
  };
  totalTaxes: number;
  totalCostUSD: number;
  totalCostTL: number;
  suggestedPrices: {
    margin15: number;
    margin20: number;
    margin25: number;
  };
  taxSnapshotId: string | null;
  calculatedAt: string;
  preview?: boolean;
}

export interface CurrentRates {
  taxRates: {
    code: string;
    name: string;
    rate: number;
    rateType: string;
    vehicleType: string | null | undefined;
    minEngineCC: number | null | undefined;
    maxEngineCC: number | null | undefined;
  }[];
  exchangeRates: {
    currencyCode: string;
    buyRate: number;
    sellRate: number;
    fetchedAt: Date;
  }[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function suggestedPrice(cost: number, marginPercent: number): number {
  return round2(cost / (1 - marginPercent / 100));
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CalculatorService {
  // ─── Ana hesaplama ─────────────────────────────────────────────────────────
  async calculate(input: CalculateInput): Promise<CalculationResult> {
    // 1. Menşei ülkeyi doğrula
    const originCountry = await prisma.originCountry.findFirst({
      where: { id: input.originCountryId, isActive: true },
    });

    if (!originCountry) {
      throw new NotFoundError(
        `Origin country with ID "${input.originCountryId}" not found or inactive`,
      );
    }

    // 2. Aktif TaxRate'leri ve ExchangeRate'leri paralel çek
    const [activeTaxRates, activeExchangeRates] = await Promise.all([
      prisma.taxRate.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      prisma.exchangeRate.findMany({
        where: { isActive: true },
        orderBy: { currencyCode: 'asc' },
      }),
    ]);

    // 3. Döviz kurlarını bir haritaya al — sellRate kullan (ithalat maliyeti)
    // U-VH1: Rate doğrulamaları TaxSnapshot oluşturulmadan ÖNCE yapılır.
    // Böylece geçersiz rate durumunda orphan TaxSnapshot oluşmaz.
    const rateMap = new Map<string, number>();
    for (const er of activeExchangeRates) {
      rateMap.set(er.currencyCode.toUpperCase(), Number(er.sellRate));
    }

    // USD/TRY kuru — Genel FIF ve Bandrol dönüşümü için
    const usdToTry = rateMap.get('USD');
    if (!usdToTry) {
      throw new BadRequestError(
        'USD/TRY exchange rate not found in system. Please update exchange rates before calculating.'
      );
    }

    // 4. FOB'u USD'ye çevir (FOB currency USD değilse)
    // U-VH1: FOB currency doğrulaması da TaxSnapshot öncesinde yapılır.
    const fobCurrency = input.fobCurrency.toUpperCase();
    let fobUSD: number;

    if (fobCurrency === 'USD') {
      fobUSD = input.fobPrice;
    } else {
      // fobCurrency → TRY → USD: fobPrice × (fobCurrency/TRY rate) / usdToTry
      const fobToTry = rateMap.get(fobCurrency);
      if (!fobToTry) {
        throw new BadRequestError(
          `Exchange rate for currency "${input.fobCurrency}" not found in system. Please update exchange rates first.`,
        );
      }
      // rateMap'te saklanan değer zaten TRY cinsinden (1 birim = X TRY)
      // fobPrice × fobToTry = TL değeri → TL / usdToTry = USD değeri
      fobUSD = (input.fobPrice * fobToTry) / usdToTry;
    }

    // 5. CIF Hesaplama
    const shippingUSD = input.shippingCost;
    const insuranceUSD = input.insuranceCost;
    const cifUSD = fobUSD + shippingUSD + insuranceUSD;

    // 6. TaxRate haritası — koda göre hızlı erişim
    const taxMap = new Map(activeTaxRates.map((t) => [t.code, t]));

    // ─── 6a. Gümrük Vergisi ───────────────────────────────────────────────────
    let customsDutyRate: number;

    if (originCountry.isEU) {
      customsDutyRate = 0; // AB menşei — gümrük muafiyet
    } else {
      const customsTax = taxMap.get(TAX_CODE.CUSTOMS_DUTY);
      customsDutyRate = customsTax ? Number(customsTax.rate) / 100 : DEFAULT_RATES.CUSTOMS_DUTY;
    }

    const customsDutyAmount = cifUSD * customsDutyRate;

    // ─── 6b. FIF (Fiyat İstikrar Fonu) ───────────────────────────────────────
    const fifRate = this.resolveFifRate(input.engineCC, activeTaxRates);
    const fifAmount = cifUSD * fifRate;

    // ─── 6c. KDV ─────────────────────────────────────────────────────────────
    const kdvCode =
      input.vehicleType === 'PASSENGER' ? TAX_CODE.KDV_PASSENGER : TAX_CODE.KDV_COMMERCIAL;
    const kdvTax = taxMap.get(kdvCode);
    const kdvDefaultRate =
      input.vehicleType === 'PASSENGER'
        ? DEFAULT_RATES.KDV_PASSENGER
        : DEFAULT_RATES.KDV_COMMERCIAL;
    const kdvRate = kdvTax ? Number(kdvTax.rate) / 100 : kdvDefaultRate;
    const kdvBase = cifUSD + customsDutyAmount + fifAmount;
    const kdvAmount = kdvBase * kdvRate;

    // ─── 6d. GKK (Gümrük Koruma Katkısı) ────────────────────────────────────
    const gkkTax = taxMap.get(TAX_CODE.GKK);
    const gkkRate = gkkTax ? Number(gkkTax.rate) / 100 : DEFAULT_RATES.GKK;
    const gkkAmount = cifUSD * gkkRate;

    // ─── 6e. Rıhtım Vergisi ──────────────────────────────────────────────────
    const wharfTax = taxMap.get(TAX_CODE.WHARF_FEE);
    const wharfRate = wharfTax ? Number(wharfTax.rate) / 100 : DEFAULT_RATES.WHARF_FEE;
    const wharfAmount = cifUSD * wharfRate;

    // ─── 6f. Genel FIF — cc başına sabit TL, USD'ye çevir ───────────────────
    const generalFifTax = taxMap.get(TAX_CODE.GENERAL_FIF);
    const generalFifPerCC =
      generalFifTax && generalFifTax.rateType === 'PER_CC'
        ? Number(generalFifTax.rate)
        : DEFAULT_RATES.GENERAL_FIF_PER_CC;
    const generalFifTL = input.engineCC * generalFifPerCC;
    const generalFifUSD = generalFifTL / usdToTry;

    // ─── 6g. Bandrol — sabit TL, USD'ye çevir ───────────────────────────────
    const bandrolTax = taxMap.get(TAX_CODE.BANDROL);
    const bandrolTL =
      bandrolTax && bandrolTax.rateType === 'FIXED'
        ? Number(bandrolTax.rate)
        : DEFAULT_RATES.BANDROL_TL;
    const bandrolUSD = bandrolTL / usdToTry;

    // 7. Toplam hesaplamalar
    const totalTaxes =
      customsDutyAmount +
      fifAmount +
      kdvAmount +
      gkkAmount +
      wharfAmount +
      generalFifUSD +
      bandrolUSD;

    const totalCostUSD = cifUSD + totalTaxes;
    const totalCostTL = totalCostUSD * usdToTry;

    // 8. Önerilen satış fiyatları (kar marjına göre)
    const margin15 = suggestedPrice(totalCostUSD, 15);
    const margin20 = suggestedPrice(totalCostUSD, 20);
    const margin25 = suggestedPrice(totalCostUSD, 25);

    // 9. Preview modu — DB'ye yazmadan sadece hesaplama sonucunu döndür (O-1)
    if (input.preview) {
      return {
        id: 'preview',
        input: {
          fobPrice:      input.fobPrice,
          fobCurrency:   input.fobCurrency,
          originCountry: originCountry.name,
          engineCC:      input.engineCC,
          vehicleType:   input.vehicleType,
          modelYear:     input.modelYear,
          shippingCost:  input.shippingCost,
          insuranceCost: input.insuranceCost,
        },
        exchangeRate: round2(usdToTry),
        cifValue:     round2(cifUSD),
        taxes: {
          customsDuty: { rate: round2(customsDutyRate * 100), amount: round2(customsDutyAmount) },
          fif:         { rate: round2(fifRate * 100), amount: round2(fifAmount) },
          kdv:         { rate: round2(kdvRate * 100), amount: round2(kdvAmount) },
          gkk:         { rate: round2(gkkRate * 100), amount: round2(gkkAmount) },
          wharfFee:    { rate: round2(wharfRate * 100), amount: round2(wharfAmount) },
          generalFif:  { ratePerCC: generalFifPerCC, amountTL: round2(generalFifTL), amountUSD: round2(generalFifUSD) },
          bandrol:     { amountTL: round2(bandrolTL), amountUSD: round2(bandrolUSD) },
        },
        totalTaxes:   round2(totalTaxes),
        totalCostUSD: round2(totalCostUSD),
        totalCostTL:  round2(totalCostTL),
        suggestedPrices: { margin15, margin20, margin25 },
        taxSnapshotId: null,
        calculatedAt:  new Date().toISOString(),
        preview: true,
      };
    }

    // 10. TaxSnapshot + ImportCalculation + AuditLog — tek atomik transaction (U-VH2, O-2)
    const { calculation } = await prisma.$transaction(async (tx) => {
      const newSnapshot = await tx.taxSnapshot.create({
        data: {
          rates: activeTaxRates as unknown as Prisma.JsonArray,
          currencies: activeExchangeRates as unknown as Prisma.JsonArray,
        },
      });

      const newCalculation = await tx.importCalculation.create({
        data: {
          galleryId:     input.galleryId,
          vehicleId:     input.vehicleId ?? null,
          calculatedBy:  input.calculatedBy,
          taxSnapshotId: newSnapshot.id,

          // Giriş alanları
          fobPrice:      new Prisma.Decimal(round2(fobUSD)),
          fobCurrency:   input.fobCurrency,
          originCountry: originCountry.name,
          engineCC:      input.engineCC,
          vehicleType:   input.vehicleType,
          modelYear:     input.modelYear,
          shippingCost:  new Prisma.Decimal(round2(shippingUSD)),
          insuranceCost: new Prisma.Decimal(round2(insuranceUSD)),

          // Hesaplama sonuçları
          exchangeRate: new Prisma.Decimal(round2(usdToTry)),
          cifValue:     new Prisma.Decimal(round2(cifUSD)),
          customsDuty:  new Prisma.Decimal(round2(customsDutyAmount)),
          fif:          new Prisma.Decimal(round2(fifAmount)),
          kdv:          new Prisma.Decimal(round2(kdvAmount)),
          gkk:          new Prisma.Decimal(round2(gkkAmount)),
          wharfFee:     new Prisma.Decimal(round2(wharfAmount)),
          generalFif:   new Prisma.Decimal(round2(generalFifUSD)),
          bandrol:      new Prisma.Decimal(round2(bandrolUSD)),
          otherFees:    new Prisma.Decimal(0),

          totalTaxes:   new Prisma.Decimal(round2(totalTaxes)),
          totalCostUSD: new Prisma.Decimal(round2(totalCostUSD)),
          totalCostTL:  new Prisma.Decimal(round2(totalCostTL)),
        },
      });

      // O-2: Audit log inside transaction for atomicity
      await tx.auditLog.create({
        data: {
          action:     'CREATE',
          entityType: 'ImportCalculation',
          entityId:   newCalculation.id,
          newValues: {
            galleryId:    input.galleryId,
            vehicleId:    input.vehicleId ?? null,
            originCountry: originCountry.name,
            engineCC:     input.engineCC,
            vehicleType:  input.vehicleType,
            fobPrice:     round2(fobUSD),
            fobCurrency:  input.fobCurrency,
            totalCostUSD: round2(totalCostUSD),
            totalCostTL:  round2(totalCostTL),
          },
          performedBy: input.calculatedBy,
        },
      });

      return { snapshot: newSnapshot, calculation: newCalculation };
    });

    // 11. Sonuç nesnesini döndür
    return {
      id: calculation.id,
      input: {
        fobPrice:      input.fobPrice,
        fobCurrency:   input.fobCurrency,
        originCountry: originCountry.name,
        engineCC:      input.engineCC,
        vehicleType:   input.vehicleType,
        modelYear:     input.modelYear,
        shippingCost:  input.shippingCost,
        insuranceCost: input.insuranceCost,
      },
      exchangeRate: round2(usdToTry),
      cifValue:     round2(cifUSD),
      taxes: {
        customsDuty: {
          rate:   round2(customsDutyRate * 100),
          amount: round2(customsDutyAmount),
        },
        fif: {
          rate:   round2(fifRate * 100),
          amount: round2(fifAmount),
        },
        kdv: {
          rate:   round2(kdvRate * 100),
          amount: round2(kdvAmount),
        },
        gkk: {
          rate:   round2(gkkRate * 100),
          amount: round2(gkkAmount),
        },
        wharfFee: {
          rate:   round2(wharfRate * 100),
          amount: round2(wharfAmount),
        },
        generalFif: {
          ratePerCC: generalFifPerCC,
          amountTL:  round2(generalFifTL),
          amountUSD: round2(generalFifUSD),
        },
        bandrol: {
          amountTL:  round2(bandrolTL),
          amountUSD: round2(bandrolUSD),
        },
      },
      totalTaxes:   round2(totalTaxes),
      totalCostUSD: round2(totalCostUSD),
      totalCostTL:  round2(totalCostTL),
      suggestedPrices: {
        margin15,
        margin20,
        margin25,
      },
      taxSnapshotId: calculation.taxSnapshotId,
      calculatedAt:  calculation.calculatedAt.toISOString(),
    };
  }

  // ─── Mevcut aktif oranları getir (UI için) ────────────────────────────────
  async getCurrentRates(): Promise<CurrentRates> {
    const [taxRates, exchangeRates] = await Promise.all([
      prisma.taxRate.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      prisma.exchangeRate.findMany({
        where: { isActive: true },
        orderBy: { currencyCode: 'asc' },
      }),
    ]);

    return {
      taxRates: taxRates.map((t) => ({
        code:        t.code,
        name:        t.name,
        rate:        Number(t.rate),
        rateType:    t.rateType,
        vehicleType: t.vehicleType,
        minEngineCC: t.minEngineCC,
        maxEngineCC: t.maxEngineCC,
      })),
      exchangeRates: exchangeRates.map((e) => ({
        currencyCode: e.currencyCode,
        buyRate:      Number(e.buyRate),
        sellRate:     Number(e.sellRate),
        fetchedAt:    e.fetchedAt,
      })),
    };
  }

  // ─── Hesaplama geçmişi (gallery-scoped) ──────────────────────────────────
  async getHistory(
    galleryId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<unknown>> {
    const where = { galleryId };

    const [data, total] = await Promise.all([
      prisma.importCalculation.findMany({
        where,
        skip:    params.skip,
        take:    params.limit,
        orderBy: { calculatedAt: 'desc' },
        include: {
          vehicle: {
            select: {
              id:    true,
              brand: true,
              model: true,
              year:  true,
            },
          },
          taxSnapshot: true,
        },
      }),
      prisma.importCalculation.count({ where }),
    ]);

    return {
      data,
      total,
      page:  params.page,
      limit: params.limit,
    };
  }

  // ─── Tek hesaplama detayı ─────────────────────────────────────────────────
  async getById(id: string, galleryId: string) {
    const calculation = await prisma.importCalculation.findFirst({
      where: { id, galleryId },
      include: {
        vehicle: {
          select: {
            id:    true,
            brand: true,
            model: true,
            year:  true,
            vin:   true,
          },
        },
        taxSnapshot: true,
      },
    });

    if (!calculation) {
      throw new NotFoundError(`Calculation with ID "${id}" not found`);
    }

    return calculation;
  }

  // ─── Hesaplamayı araca kaydet ─────────────────────────────────────────────
  // ImportCalculation.vehicleId güncellenir ve Vehicle'ın maliyet alanları yazılır
  async saveToVehicle(
    calculationId: string,
    vehicleId: string,
    galleryId: string,
    performedBy?: string,
    ipAddress?: string,
  ): Promise<void> {
    // U-MT3: Status guard + tüm write operasyonları tek $transaction içinde.
    // findFirst (guard) ve update'ler atomik olarak çalışır; SOLD check ile
    // write arasında race condition oluşması engellenir.
    await prisma.$transaction(async (tx) => {
      // Hesaplamayı doğrula — gallery scope
      const foundCalculation = await tx.importCalculation.findFirst({
        where: { id: calculationId, galleryId },
      });

      if (!foundCalculation) {
        throw new NotFoundError(`Calculation with ID "${calculationId}" not found`);
      }

      // Aracı doğrula — gallery scope
      const foundVehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, galleryId },
      });

      if (!foundVehicle) {
        throw new NotFoundError(`Vehicle with ID "${vehicleId}" not found`);
      }

      // Satılmış araçlara maliyet güncellemesi yapılamaz
      if (foundVehicle.status === 'SOLD') {
        throw new BadRequestError('Cannot update cost data for a sold vehicle');
      }

      // SECURITY: Both records verified with galleryId above inside this transaction.
      // ID is globally unique (CUID), so where: { id } is safe — ownership was
      // enforced by the findFirst calls within the same transaction snapshot.
      // 1. Hesaplama kaydına vehicleId bağla
      await tx.importCalculation.update({
        where: { id: calculationId },
        data:  { vehicleId },
      });

      // 2. Araç maliyet alanlarını güncelle
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          shippingCost:   foundCalculation.shippingCost,
          insuranceCost:  foundCalculation.insuranceCost,
          cifValue:       foundCalculation.cifValue,
          customsDuty:    foundCalculation.customsDuty,
          kdv:            foundCalculation.kdv,
          fif:            foundCalculation.fif,
          generalFif:     foundCalculation.generalFif,
          gkk:            foundCalculation.gkk,
          wharfFee:       foundCalculation.wharfFee,
          bandrol:        foundCalculation.bandrol,
          otherFees:      foundCalculation.otherFees,
          totalImportCost: foundCalculation.totalCostUSD,
          totalCost:       new Prisma.Decimal(
            Number(foundCalculation.totalCostUSD) + Number(foundVehicle.additionalExpenses),
          ),
          taxSnapshotId: foundCalculation.taxSnapshotId,
        },
      });
    });

    // Audit log — hesaplama araca bağlandı
    if (performedBy) {
      await auditService.log({
        action:     'UPDATE',
        entityType: 'ImportCalculation',
        entityId:   calculationId,
        newValues: {
          vehicleId,
          galleryId,
          action: 'saved_to_vehicle',
        },
        performedBy,
        ipAddress,
      });
    }
  }

  // ─── Yardımcı: FIF oranını belirle ───────────────────────────────────────
  // TaxRate tablosundaki FIF kayıtlarında minEngineCC/maxEngineCC aralığına bak
  // Eşleşme bulunamazsa fallback oranları kullan
  private resolveFifRate(
    engineCC: number,
    taxRates: { code: string; rate: Prisma.Decimal; minEngineCC: number | null; maxEngineCC: number | null }[],
  ): number {
    // TaxRate tablosundaki FIF kayıtları
    const fifTaxRates = taxRates.filter((t) => t.code === TAX_CODE.FIF);

    if (fifTaxRates.length > 0) {
      // Motor hacmine göre eşleşen dilimi bul
      const matched = fifTaxRates.find((t) => {
        const min = t.minEngineCC ?? 0;
        const max = t.maxEngineCC;

        if (max === null) {
          // Üst sınırı olmayan dilim (örn. 2500+)
          return engineCC >= min;
        }
        return engineCC >= min && engineCC <= max;
      });

      if (matched) {
        // TaxRate.rate yüzde olarak saklanıyor (örn. 18 → %18)
        return Number(matched.rate) / 100;
      }
    }

    // Fallback: hardcoded oranlar
    const fallback = FIF_FALLBACK_RATES.find((f) => {
      if (f.max === null) return engineCC >= f.min;
      return engineCC >= f.min && engineCC <= f.max;
    });

    if (!fallback) {
      throw new BadRequestError(
        `No FIF rate found for engine capacity ${engineCC}cc. Please configure FIF tax rates.`
      );
    }
    return fallback.rate;
  }
}

export const calculatorService = new CalculatorService();
