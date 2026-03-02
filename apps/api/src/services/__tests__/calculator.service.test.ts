import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { CalculatorService } from '../calculator.service';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Prisma mock
// ------------------------------------------------------------------ //

vi.mock('../audit.service', () => ({
  auditService: { log: vi.fn().mockResolvedValue(undefined) },
}));

// Transaction proxy — captures inner tx calls
const txMock = {
  taxSnapshot: { create: vi.fn() },
  importCalculation: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  vehicle: { findFirst: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
};

vi.mock('../../lib/prisma', () => ({
  default: {
    originCountry: { findFirst: vi.fn() },
    taxRate: { findMany: vi.fn() },
    exchangeRate: { findMany: vi.fn() },
    taxSnapshot: { create: vi.fn() },
    importCalculation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    vehicle: { findFirst: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((ops: any) =>
      typeof ops === 'function' ? ops(txMock) : Promise.all(ops),
    ),
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const GALLERY_ID      = 'gallery-aaa-111';
const OTHER_GALLERY_ID = 'gallery-bbb-222';
const VEHICLE_ID      = 'vehicle-ccc-333';
const COUNTRY_ID_JP   = 'country-jp-001';
const COUNTRY_ID_DE   = 'country-de-002';
const CALC_ID         = 'calc-xxx-999';
const SNAPSHOT_ID     = 'snapshot-yyy-888';
const USER_ID         = 'user-zzz-777';

// ─── Mock ülkeler ─────────────────────────────────────────────────────────────

const mockCountryJP = {
  id: COUNTRY_ID_JP,
  code: 'JP',
  name: 'Japan',
  flag: '🇯🇵',
  isEU: false,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCountryDE = {
  id: COUNTRY_ID_DE,
  code: 'DE',
  name: 'Germany',
  flag: '🇩🇪',
  isEU: true,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ─── Mock TaxRate'ler (tüm kodlar) ────────────────────────────────────────────

const mockTaxRates = [
  {
    code: 'CUSTOMS_DUTY',
    name: 'Gümrük Vergisi',
    rate: new Prisma.Decimal(10),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: null,
    maxEngineCC: null,
  },
  {
    code: 'FIF',
    name: 'FIF 0-1000cc',
    rate: new Prisma.Decimal(15),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: 0,
    maxEngineCC: 1000,
  },
  {
    code: 'FIF',
    name: 'FIF 1001-1600cc',
    rate: new Prisma.Decimal(18),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: 1001,
    maxEngineCC: 1600,
  },
  {
    code: 'FIF',
    name: 'FIF 1601-2000cc',
    rate: new Prisma.Decimal(22),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: 1601,
    maxEngineCC: 2000,
  },
  {
    code: 'FIF',
    name: 'FIF 2001-2500cc',
    rate: new Prisma.Decimal(25),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: 2001,
    maxEngineCC: 2500,
  },
  {
    code: 'FIF',
    name: 'FIF 2500+cc',
    rate: new Prisma.Decimal(30),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: 2501,
    maxEngineCC: null,
  },
  {
    code: 'KDV_PASSENGER',
    name: 'KDV Binek',
    rate: new Prisma.Decimal(20),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: 'PASSENGER',
    minEngineCC: null,
    maxEngineCC: null,
  },
  {
    code: 'KDV_COMMERCIAL',
    name: 'KDV Ticari',
    rate: new Prisma.Decimal(16),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: 'COMMERCIAL',
    minEngineCC: null,
    maxEngineCC: null,
  },
  {
    code: 'GKK',
    name: 'Gümrük Koruma Katkısı',
    rate: new Prisma.Decimal(2.5),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: null,
    maxEngineCC: null,
  },
  {
    code: 'WHARF_FEE',
    name: 'Rıhtım Vergisi',
    rate: new Prisma.Decimal(4.4),
    rateType: 'PERCENTAGE',
    isActive: true,
    vehicleType: null,
    minEngineCC: null,
    maxEngineCC: null,
  },
  {
    code: 'GENERAL_FIF',
    name: 'Genel FIF',
    rate: new Prisma.Decimal(2.03),
    rateType: 'PER_CC',
    isActive: true,
    vehicleType: null,
    minEngineCC: null,
    maxEngineCC: null,
  },
  {
    code: 'BANDROL',
    name: 'Bandrol',
    rate: new Prisma.Decimal(33.5),
    rateType: 'FIXED',
    isActive: true,
    vehicleType: null,
    minEngineCC: null,
    maxEngineCC: null,
  },
];

// ─── Mock ExchangeRate'ler ─────────────────────────────────────────────────────
// USD sellRate = 35.5, EUR sellRate = 38.5

const mockExchangeRates = [
  {
    currencyCode: 'USD',
    buyRate: new Prisma.Decimal(35.0),
    sellRate: new Prisma.Decimal(35.5),
    isActive: true,
    fetchedAt: new Date('2024-01-01'),
  },
  {
    currencyCode: 'EUR',
    buyRate: new Prisma.Decimal(38.0),
    sellRate: new Prisma.Decimal(38.5),
    isActive: true,
    fetchedAt: new Date('2024-01-01'),
  },
  {
    currencyCode: 'GBP',
    buyRate: new Prisma.Decimal(44.0),
    sellRate: new Prisma.Decimal(44.5),
    isActive: true,
    fetchedAt: new Date('2024-01-01'),
  },
];

// ─── Mock TaxSnapshot ─────────────────────────────────────────────────────────

const mockSnapshot = {
  id: SNAPSHOT_ID,
  rates: [],
  currencies: [],
  createdAt: new Date('2024-01-01'),
};

// ─── Temel hesaplama girdisi (Toyota Corolla doğrulama örneği) ────────────────

const baseCalculateInput = {
  fobPrice: 6000,
  fobCurrency: 'USD',
  originCountryId: COUNTRY_ID_JP,
  engineCC: 1600,
  vehicleType: 'PASSENGER' as const,
  modelYear: 2022,
  shippingCost: 600,
  insuranceCost: 100,
  galleryId: GALLERY_ID,
  calculatedBy: USER_ID,
};

// ─── Mock araç ────────────────────────────────────────────────────────────────

const mockVehicle = {
  id: VEHICLE_ID,
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  status: 'IN_STOCK' as const,
  galleryId: GALLERY_ID,
  additionalExpenses: new Prisma.Decimal(0),
  cifValue: new Prisma.Decimal(6700),
  customsDuty: new Prisma.Decimal(670),
  kdv: new Prisma.Decimal(1715.2),
  fif: new Prisma.Decimal(1206),
  generalFif: new Prisma.Decimal(91.49),
  gkk: new Prisma.Decimal(167.5),
  wharfFee: new Prisma.Decimal(294.8),
  bandrol: new Prisma.Decimal(0.94),
  otherFees: new Prisma.Decimal(0),
  totalImportCost: new Prisma.Decimal(10845.93),
  totalCost: new Prisma.Decimal(10845.93),
  taxSnapshotId: SNAPSHOT_ID,
};

// ─── Mock importCalculation kaydı ─────────────────────────────────────────────

const mockCalculation = {
  id: CALC_ID,
  galleryId: GALLERY_ID,
  vehicleId: null,
  calculatedBy: USER_ID,
  taxSnapshotId: SNAPSHOT_ID,
  fobPrice: new Prisma.Decimal(6000),
  fobCurrency: 'USD',
  originCountry: 'Japan',
  engineCC: 1600,
  vehicleType: 'PASSENGER',
  modelYear: 2022,
  shippingCost: new Prisma.Decimal(600),
  insuranceCost: new Prisma.Decimal(100),
  exchangeRate: new Prisma.Decimal(35.5),
  cifValue: new Prisma.Decimal(6700),
  customsDuty: new Prisma.Decimal(670),
  fif: new Prisma.Decimal(1206),
  kdv: new Prisma.Decimal(1715.2),
  gkk: new Prisma.Decimal(167.5),
  wharfFee: new Prisma.Decimal(294.8),
  generalFif: new Prisma.Decimal(91.49),
  bandrol: new Prisma.Decimal(0.94),
  otherFees: new Prisma.Decimal(0),
  totalTaxes: new Prisma.Decimal(4145.93),
  totalCostUSD: new Prisma.Decimal(10845.93),
  totalCostTL: new Prisma.Decimal(385031.15),
  calculatedAt: new Date('2024-01-01T10:00:00.000Z'),
};

// ─── Prisma mock kurulum yardımcısı ──────────────────────────────────────────

function setupCalculateMocks(overrides: {
  country?: object | null;
  taxRates?: object[];
  exchangeRates?: object[];
  snapshot?: object;
  calculation?: object;
} = {}) {
  vi.mocked(prisma.originCountry.findFirst).mockResolvedValue(
    (overrides.country !== undefined ? overrides.country : mockCountryJP) as any,
  );
  vi.mocked(prisma.taxRate.findMany).mockResolvedValue(
    (overrides.taxRates ?? mockTaxRates) as any,
  );
  vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue(
    (overrides.exchangeRates ?? mockExchangeRates) as any,
  );
  txMock.taxSnapshot.create.mockResolvedValue(
    (overrides.snapshot ?? mockSnapshot) as any,
  );
  txMock.importCalculation.create.mockResolvedValue(
    (overrides.calculation ?? mockCalculation) as any,
  );
}

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CalculatorService();
  });

  // ---------------------------------------------------------------- //
  // calculate — SPEC dogrulama ornegi
  // ---------------------------------------------------------------- //
  describe('calculate — SPEC dogrulama ornegi (Toyota Corolla 1600cc JP non-EU)', () => {
    it('should return CIF value of $6700 for FOB $6000 + shipping $600 + insurance $100', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.cifValue).toBe(6700);
    });

    it('should apply 10% customs duty on CIF for non-EU origin country', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.taxes.customsDuty.rate).toBe(10);
      expect(result.taxes.customsDuty.amount).toBe(670);
    });

    it('should apply 18% FIF rate for 1001-1600cc engine range', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.taxes.fif.rate).toBe(18);
      expect(result.taxes.fif.amount).toBe(1206);
    });

    it('should apply 20% KDV on (CIF + customs + FIF) base for PASSENGER vehicle', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // KDV base = 6700 + 670 + 1206 = 8576; KDV = 8576 * 0.20 = 1715.20
      expect(result.taxes.kdv.rate).toBe(20);
      expect(result.taxes.kdv.amount).toBeCloseTo(1715.2, 1);
    });

    it('should apply 2.5% GKK on CIF value', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // GKK = 6700 * 0.025 = 167.50
      expect(result.taxes.gkk.rate).toBe(2.5);
      expect(result.taxes.gkk.amount).toBeCloseTo(167.5, 1);
    });

    it('should apply 4.4% wharf fee on CIF value', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // Rihtim = 6700 * 0.044 = 294.80
      expect(result.taxes.wharfFee.rate).toBe(4.4);
      expect(result.taxes.wharfFee.amount).toBeCloseTo(294.8, 1);
    });

    it('should calculate General FIF as engineCC * 2.03 TL converted to USD', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // generalFifTL = 1600 * 2.03 = 3248 TL
      // generalFifUSD = 3248 / 35.5 (USD sellRate) ≈ 91.49
      expect(result.taxes.generalFif.ratePerCC).toBe(2.03);
      expect(result.taxes.generalFif.amountTL).toBe(3248);
      expect(result.taxes.generalFif.amountUSD).toBeCloseTo(91.49, 1);
    });

    it('should calculate Bandrol as 33.5 TL fixed amount converted to USD', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // bandrolUSD = 33.5 / 35.5 ≈ 0.94
      expect(result.taxes.bandrol.amountTL).toBe(33.5);
      expect(result.taxes.bandrol.amountUSD).toBeCloseTo(0.94, 1);
    });

    it('should calculate total cost close to $10,845.93 (within $1 tolerance due to rounding)', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // SPEC dogrulama ornegi: toplam ~$10,845.93
      expect(result.totalCostUSD).toBeCloseTo(10845.93, 0);
    });

    it('should calculate total taxes close to $4,145.93', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // 670 + 1206 + 1715.20 + 167.50 + 294.80 + ~91.49 + ~0.94 ≈ 4145.93
      expect(result.totalTaxes).toBeCloseTo(4145.93, 0);
    });

    it('should calculate totalCostTL as totalCostUSD * USD/TRY sellRate', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // USD sellRate = 35.5
      expect(result.totalCostTL).toBeCloseTo(result.totalCostUSD * 35.5, 0);
    });

    it('should return suggested price with 15% margin using cost/(1 - margin%/100) formula', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      // margin15 = totalCostUSD / (1 - 0.15)
      const expected = result.totalCostUSD / (1 - 0.15);
      expect(result.suggestedPrices.margin15).toBeCloseTo(expected, 1);
    });

    it('should return suggested prices for 20% and 25% margin as well', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.suggestedPrices.margin20).toBeCloseTo(result.totalCostUSD / 0.80, 1);
      expect(result.suggestedPrices.margin25).toBeCloseTo(result.totalCostUSD / 0.75, 1);
    });

    it('should return the exchangeRate used (USD sellRate = 35.5)', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.exchangeRate).toBe(35.5);
    });

    it('should persist a TaxSnapshot before creating the calculation record', async () => {
      setupCalculateMocks();

      await service.calculate(baseCalculateInput);

      expect(txMock.taxSnapshot.create).toHaveBeenCalledOnce();
      expect(txMock.importCalculation.create).toHaveBeenCalledOnce();

      // Snapshot oncelikle olusturulmali
      const snapshotOrder = txMock.taxSnapshot.create.mock.invocationCallOrder[0];
      const calcOrder = txMock.importCalculation.create.mock.invocationCallOrder[0];
      expect(snapshotOrder).toBeLessThan(calcOrder);
    });

    it('should embed active tax rates and exchange rates into the TaxSnapshot', async () => {
      setupCalculateMocks();

      await service.calculate(baseCalculateInput);

      const call = txMock.taxSnapshot.create.mock.calls[0][0] as any;
      expect(call.data.rates).toBeDefined();
      expect(call.data.currencies).toBeDefined();
    });

    it('should return input echo with originCountry name resolved from DB record', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.input.originCountry).toBe('Japan');
    });

    it('should return the taxSnapshotId returned by prisma.taxSnapshot.create', async () => {
      setupCalculateMocks();

      const result = await service.calculate(baseCalculateInput);

      expect(result.taxSnapshotId).toBe(SNAPSHOT_ID);
    });

    it('should save importCalculation with galleryId scoped to the caller', async () => {
      setupCalculateMocks();

      await service.calculate(baseCalculateInput);

      const call = txMock.importCalculation.create.mock.calls[0][0] as any;
      expect(call.data.galleryId).toBe(GALLERY_ID);
      expect(call.data.calculatedBy).toBe(USER_ID);
    });

    it('should store all monetary values in the DB as Prisma.Decimal', async () => {
      setupCalculateMocks();

      await service.calculate(baseCalculateInput);

      const call = txMock.importCalculation.create.mock.calls[0][0] as any;
      expect(call.data.cifValue).toBeInstanceOf(Prisma.Decimal);
      expect(call.data.customsDuty).toBeInstanceOf(Prisma.Decimal);
      expect(call.data.fif).toBeInstanceOf(Prisma.Decimal);
      expect(call.data.kdv).toBeInstanceOf(Prisma.Decimal);
      expect(call.data.totalCostUSD).toBeInstanceOf(Prisma.Decimal);
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — AB menseli arac (Almanya, isEU: true)
  // ---------------------------------------------------------------- //
  describe('calculate — EU origin country (Germany)', () => {
    it('should apply 0% customs duty for EU origin country', async () => {
      setupCalculateMocks({ country: mockCountryDE });

      const result = await service.calculate({
        ...baseCalculateInput,
        originCountryId: COUNTRY_ID_DE,
      });

      expect(result.taxes.customsDuty.rate).toBe(0);
      expect(result.taxes.customsDuty.amount).toBe(0);
    });

    it('should still apply FIF, KDV, GKK and wharf fee for EU origin', async () => {
      setupCalculateMocks({ country: mockCountryDE });

      const result = await service.calculate({
        ...baseCalculateInput,
        originCountryId: COUNTRY_ID_DE,
      });

      expect(result.taxes.fif.amount).toBeGreaterThan(0);
      expect(result.taxes.kdv.amount).toBeGreaterThan(0);
      expect(result.taxes.gkk.amount).toBeGreaterThan(0);
      expect(result.taxes.wharfFee.amount).toBeGreaterThan(0);
    });

    it('should produce lower total cost for EU vs non-EU (no customs duty)', async () => {
      // EU hesaplama
      setupCalculateMocks({ country: mockCountryDE });
      const euResult = await service.calculate({
        ...baseCalculateInput,
        originCountryId: COUNTRY_ID_DE,
      });

      vi.clearAllMocks();

      // non-EU hesaplama
      setupCalculateMocks({ country: mockCountryJP });
      const nonEuResult = await service.calculate({
        ...baseCalculateInput,
        originCountryId: COUNTRY_ID_JP,
      });

      expect(euResult.totalCostUSD).toBeLessThan(nonEuResult.totalCostUSD);
    });

    it('should query originCountry with isActive: true filter', async () => {
      setupCalculateMocks({ country: mockCountryDE });

      await service.calculate({ ...baseCalculateInput, originCountryId: COUNTRY_ID_DE });

      expect(prisma.originCountry.findFirst).toHaveBeenCalledWith({
        where: { id: COUNTRY_ID_DE, isActive: true },
      });
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — Kucuk motor (0-1000cc), FIF %15
  // ---------------------------------------------------------------- //
  describe('calculate — small engine (800cc, FIF 15%)', () => {
    it('should apply 15% FIF rate for engine in 0-1000cc range', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        engineCC: 800,
      });

      expect(result.taxes.fif.rate).toBe(15);
    });

    it('should compute correct FIF amount as CIF * 0.15 for 800cc engine', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        engineCC: 800,
      });

      // CIF = 6700; FIF = 6700 * 0.15 = 1005
      expect(result.taxes.fif.amount).toBeCloseTo(1005, 1);
    });

    it('should use exact boundary 1000cc in 0-1000cc range', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        engineCC: 1000,
      });

      expect(result.taxes.fif.rate).toBe(15);
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — Buyuk motor (2800cc, FIF %30)
  // ---------------------------------------------------------------- //
  describe('calculate — large engine (2800cc, FIF 30%)', () => {
    it('should apply 30% FIF rate for engine over 2500cc', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        engineCC: 2800,
      });

      expect(result.taxes.fif.rate).toBe(30);
    });

    it('should compute correct FIF amount as CIF * 0.30 for 2800cc engine', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        engineCC: 2800,
      });

      // CIF = 6700; FIF = 6700 * 0.30 = 2010
      expect(result.taxes.fif.amount).toBeCloseTo(2010, 1);
    });

    it('should also use correct General FIF amount (2800cc * 2.03 TL)', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        engineCC: 2800,
      });

      // 2800 * 2.03 = 5684 TL
      expect(result.taxes.generalFif.amountTL).toBe(5684);
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — Ticari arac (COMMERCIAL, KDV %16)
  // ---------------------------------------------------------------- //
  describe('calculate — commercial vehicle (KDV 16%)', () => {
    it('should apply 16% KDV rate for COMMERCIAL vehicle type', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        vehicleType: 'COMMERCIAL',
      });

      expect(result.taxes.kdv.rate).toBe(16);
    });

    it('should produce lower KDV amount for COMMERCIAL vs PASSENGER (same CIF)', async () => {
      // Binek arac
      setupCalculateMocks();
      const passengerResult = await service.calculate({
        ...baseCalculateInput,
        vehicleType: 'PASSENGER',
      });

      vi.clearAllMocks();

      // Ticari arac
      setupCalculateMocks();
      const commercialResult = await service.calculate({
        ...baseCalculateInput,
        vehicleType: 'COMMERCIAL',
      });

      expect(commercialResult.taxes.kdv.amount).toBeLessThan(passengerResult.taxes.kdv.amount);
    });

    it('should compute KDV on correct base (CIF + customs + FIF) for COMMERCIAL vehicle', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        vehicleType: 'COMMERCIAL',
      });

      // CIF=6700, customs=670, FIF(18%)=1206 -> base=8576 -> KDV=8576*0.16=1372.16
      expect(result.taxes.kdv.amount).toBeCloseTo(1372.16, 1);
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — EUR cinsinden FOB donusumu
  // ---------------------------------------------------------------- //
  describe('calculate — non-USD FOB currency conversion (EUR)', () => {
    it('should convert EUR FOB to USD using EUR sellRate / USD sellRate', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        fobPrice: 5000,
        fobCurrency: 'EUR',
      });

      // fobUSD = (5000 * 38.5) / 35.5 ≈ 5422.54
      // CIF = 5422.54 + 600 + 100 = 6122.54
      const expectedFobUSD = (5000 * 38.5) / 35.5;
      const expectedCIF = expectedFobUSD + 600 + 100;
      expect(result.cifValue).toBeCloseTo(expectedCIF, 0);
    });

    it('should use EUR TL rate to compute FOB USD via EUR->TRY->USD conversion', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        fobPrice: 1000,
        fobCurrency: 'EUR',
      });

      // fobUSD = (1000 * 38.5) / 35.5 ≈ 1084.51
      const expectedFobUSD = (1000 * 38.5) / 35.5;
      expect(result.cifValue).toBeCloseTo(expectedFobUSD + 600 + 100, 0);
    });

    it('should pass FOB input correctly through to the result input object even when converted', async () => {
      setupCalculateMocks();

      const result = await service.calculate({
        ...baseCalculateInput,
        fobPrice: 5000,
        fobCurrency: 'EUR',
      });

      expect(result.input.fobPrice).toBe(5000);
      expect(result.input.fobCurrency).toBe('EUR');
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — Hatali girdi
  // ---------------------------------------------------------------- //
  describe('calculate — invalid inputs', () => {
    it('should throw NotFoundError when originCountryId does not exist or is inactive', async () => {
      setupCalculateMocks({ country: null });

      await expect(
        service.calculate({ ...baseCalculateInput, originCountryId: 'non-existent-id' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should include the unknown originCountryId in the NotFoundError message', async () => {
      setupCalculateMocks({ country: null });

      await expect(
        service.calculate({ ...baseCalculateInput, originCountryId: 'bad-country-id' }),
      ).rejects.toThrow('bad-country-id');
    });

    it('should not create TaxSnapshot or Calculation when originCountry is not found', async () => {
      setupCalculateMocks({ country: null });

      await expect(service.calculate(baseCalculateInput)).rejects.toThrow(NotFoundError);
      expect(txMock.taxSnapshot.create).not.toHaveBeenCalled();
      expect(txMock.importCalculation.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when fobCurrency is not in exchange rate table', async () => {
      setupCalculateMocks();

      await expect(
        service.calculate({ ...baseCalculateInput, fobCurrency: 'XYZ' }),
      ).rejects.toThrow(BadRequestError);
    });

    it('should include the unsupported currency code in the BadRequestError message', async () => {
      setupCalculateMocks();

      await expect(
        service.calculate({ ...baseCalculateInput, fobCurrency: 'XYZ' }),
      ).rejects.toThrow('XYZ');
    });

    it('should not create TaxSnapshot or Calculation when currency is unsupported', async () => {
      setupCalculateMocks();

      await expect(
        service.calculate({ ...baseCalculateInput, fobCurrency: 'XYZ' }),
      ).rejects.toThrow(BadRequestError);
      expect(txMock.importCalculation.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------- //
  // calculate — Sinir degerler (boundary engine CC)
  // ---------------------------------------------------------------- //
  describe('calculate — FIF engine CC boundary values', () => {
    it('should apply 18% FIF for exactly 1001cc (start of second range)', async () => {
      setupCalculateMocks();

      const result = await service.calculate({ ...baseCalculateInput, engineCC: 1001 });

      expect(result.taxes.fif.rate).toBe(18);
    });

    it('should apply 22% FIF for exactly 1601cc (start of third range)', async () => {
      setupCalculateMocks();

      const result = await service.calculate({ ...baseCalculateInput, engineCC: 1601 });

      expect(result.taxes.fif.rate).toBe(22);
    });

    it('should apply 25% FIF for exactly 2001cc', async () => {
      setupCalculateMocks();

      const result = await service.calculate({ ...baseCalculateInput, engineCC: 2001 });

      expect(result.taxes.fif.rate).toBe(25);
    });

    it('should apply 30% FIF for exactly 2501cc (start of highest range)', async () => {
      setupCalculateMocks();

      const result = await service.calculate({ ...baseCalculateInput, engineCC: 2501 });

      expect(result.taxes.fif.rate).toBe(30);
    });
  });

  // ---------------------------------------------------------------- //
  // getCurrentRates
  // ---------------------------------------------------------------- //
  describe('getCurrentRates', () => {
    it('should return active tax rates and exchange rates in parallel', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue(mockTaxRates as any);
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue(mockExchangeRates as any);

      const result = await service.getCurrentRates();

      expect(result.taxRates).toHaveLength(mockTaxRates.length);
      expect(result.exchangeRates).toHaveLength(mockExchangeRates.length);
    });

    it('should convert Prisma.Decimal rate to number in returned taxRates', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue(mockTaxRates as any);
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue(mockExchangeRates as any);

      const result = await service.getCurrentRates();

      result.taxRates.forEach((t) => {
        expect(typeof t.rate).toBe('number');
      });
    });

    it('should convert Prisma.Decimal buy/sell rates to number in returned exchangeRates', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue(mockTaxRates as any);
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue(mockExchangeRates as any);

      const result = await service.getCurrentRates();

      result.exchangeRates.forEach((e) => {
        expect(typeof e.buyRate).toBe('number');
        expect(typeof e.sellRate).toBe('number');
      });
    });

    it('should query taxRate with isActive: true and order by code asc', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getCurrentRates();

      expect(prisma.taxRate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
    });

    it('should return empty arrays when no active rates exist', async () => {
      vi.mocked(prisma.taxRate.findMany).mockResolvedValue([]);
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      const result = await service.getCurrentRates();

      expect(result.taxRates).toEqual([]);
      expect(result.exchangeRates).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- //
  // getHistory — gallery-scoped pagination
  // ---------------------------------------------------------------- //
  describe('getHistory', () => {
    const paginationParams = { page: 1, limit: 10, skip: 0 };

    it('should return paginated calculations scoped to galleryId', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([mockCalculation] as any);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(1);

      const result = await service.getHistory(GALLERY_ID, paginationParams);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should always scope findMany and count queries to the given galleryId', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      await service.getHistory(GALLERY_ID, paginationParams);

      expect(prisma.importCalculation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { galleryId: GALLERY_ID } }),
      );
      expect(prisma.importCalculation.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { galleryId: GALLERY_ID } }),
      );
    });

    it('should apply skip and limit (take) from pagination params', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      await service.getHistory(GALLERY_ID, { page: 3, limit: 5, skip: 10 });

      expect(prisma.importCalculation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should order results by calculatedAt descending', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      await service.getHistory(GALLERY_ID, paginationParams);

      const call = vi.mocked(prisma.importCalculation.findMany).mock.calls[0][0] as any;
      expect(call.orderBy).toEqual({ calculatedAt: 'desc' });
    });

    it('should include vehicle (id, brand, model, year) and taxSnapshot in results', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      await service.getHistory(GALLERY_ID, paginationParams);

      const call = vi.mocked(prisma.importCalculation.findMany).mock.calls[0][0] as any;
      expect(call.include.vehicle).toBeDefined();
      expect(call.include.vehicle.select).toEqual(
        expect.objectContaining({ id: true, brand: true, model: true, year: true }),
      );
      expect(call.include.taxSnapshot).toBe(true);
    });

    it('should return page and limit metadata in result', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      const result = await service.getHistory(GALLERY_ID, { page: 2, limit: 15, skip: 15 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(15);
    });

    it('should return empty data array and zero total when gallery has no calculations', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      const result = await service.getHistory(GALLERY_ID, paginationParams);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should not return calculations from a different gallery', async () => {
      vi.mocked(prisma.importCalculation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.importCalculation.count).mockResolvedValue(0);

      await service.getHistory(OTHER_GALLERY_ID, paginationParams);

      expect(prisma.importCalculation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { galleryId: OTHER_GALLERY_ID } }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // getById
  // ---------------------------------------------------------------- //
  describe('getById', () => {
    it('should return the calculation when id and galleryId match', async () => {
      vi.mocked(prisma.importCalculation.findFirst).mockResolvedValue(mockCalculation as any);

      const result = await service.getById(CALC_ID, GALLERY_ID);

      expect(result).toEqual(mockCalculation);
    });

    it('should query with both id and galleryId for tenant isolation', async () => {
      vi.mocked(prisma.importCalculation.findFirst).mockResolvedValue(mockCalculation as any);

      await service.getById(CALC_ID, GALLERY_ID);

      expect(prisma.importCalculation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CALC_ID, galleryId: GALLERY_ID },
        }),
      );
    });

    it('should throw NotFoundError when calculation does not exist', async () => {
      vi.mocked(prisma.importCalculation.findFirst).mockResolvedValue(null);

      await expect(service.getById('non-existent', GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when calculation belongs to a different gallery', async () => {
      // Prisma returns null when WHERE id=X AND galleryId=OTHER_GALLERY does not match
      vi.mocked(prisma.importCalculation.findFirst).mockResolvedValue(null);

      await expect(service.getById(CALC_ID, OTHER_GALLERY_ID)).rejects.toThrow(NotFoundError);
    });

    it('should include the calculation id in the NotFoundError message', async () => {
      vi.mocked(prisma.importCalculation.findFirst).mockResolvedValue(null);

      await expect(service.getById('missing-calc-id', GALLERY_ID)).rejects.toThrow(
        'missing-calc-id',
      );
    });

    it('should include vehicle (with vin) and taxSnapshot in the returned data', async () => {
      vi.mocked(prisma.importCalculation.findFirst).mockResolvedValue(mockCalculation as any);

      await service.getById(CALC_ID, GALLERY_ID);

      const call = vi.mocked(prisma.importCalculation.findFirst).mock.calls[0][0] as any;
      expect(call.include.vehicle.select).toEqual(
        expect.objectContaining({ id: true, brand: true, model: true, year: true, vin: true }),
      );
      expect(call.include.taxSnapshot).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  // saveToVehicle
  // ---------------------------------------------------------------- //
  describe('saveToVehicle', () => {
    it('should link calculation to vehicle via $transaction when both exist and vehicle is not SOLD', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle as any);
      txMock.importCalculation.update.mockResolvedValue({} as any);
      txMock.vehicle.update.mockResolvedValue({} as any);

      await service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID);

      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it('should update importCalculation.vehicleId inside the transaction', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle as any);
      txMock.importCalculation.update.mockResolvedValue({} as any);
      txMock.vehicle.update.mockResolvedValue({} as any);

      await service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID);

      expect(txMock.importCalculation.update).toHaveBeenCalledWith({
        where: { id: CALC_ID },
        data: { vehicleId: VEHICLE_ID },
      });
    });

    it('should update vehicle cost fields from calculation data inside the transaction', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle as any);
      txMock.importCalculation.update.mockResolvedValue({} as any);
      txMock.vehicle.update.mockResolvedValue({} as any);

      await service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID);

      expect(txMock.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: VEHICLE_ID },
          data: expect.objectContaining({
            cifValue: mockCalculation.cifValue,
            customsDuty: mockCalculation.customsDuty,
            kdv: mockCalculation.kdv,
            fif: mockCalculation.fif,
            gkk: mockCalculation.gkk,
            wharfFee: mockCalculation.wharfFee,
            bandrol: mockCalculation.bandrol,
            totalImportCost: mockCalculation.totalCostUSD,
          }),
        }),
      );
    });

    it('should compute totalCost as totalImportCost + vehicle.additionalExpenses', async () => {
      const vehicleWithExpenses = {
        ...mockVehicle,
        additionalExpenses: new Prisma.Decimal(500),
      };
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(vehicleWithExpenses as any);
      txMock.importCalculation.update.mockResolvedValue({} as any);
      txMock.vehicle.update.mockResolvedValue({} as any);

      await service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID);

      const call = txMock.vehicle.update.mock.calls[0][0] as any;
      const expectedTotal = Number(mockCalculation.totalCostUSD) + 500;
      expect(Number(call.data.totalCost)).toBeCloseTo(expectedTotal, 2);
    });

    it('should throw BadRequestError when vehicle status is SOLD', async () => {
      const soldVehicle = { ...mockVehicle, status: 'SOLD' };
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(soldVehicle as any);

      await expect(
        service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID),
      ).rejects.toThrow(BadRequestError);
    });

    it('should include "sold" in the BadRequestError message for SOLD vehicle', async () => {
      const soldVehicle = { ...mockVehicle, status: 'SOLD' };
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(soldVehicle as any);

      await expect(
        service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID),
      ).rejects.toThrow(/sold/i);
    });

    it('should throw NotFoundError when calculation is not found for the gallery', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(null);

      await expect(
        service.saveToVehicle('missing-calc', VEHICLE_ID, GALLERY_ID),
      ).rejects.toThrow(NotFoundError);
    });

    it('should include the calculationId in the NotFoundError message when calculation is missing', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(null);

      await expect(
        service.saveToVehicle('missing-calc-id', VEHICLE_ID, GALLERY_ID),
      ).rejects.toThrow('missing-calc-id');
    });

    it('should not look up the vehicle when calculation is not found', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(null);

      await expect(
        service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID),
      ).rejects.toThrow(NotFoundError);
      expect(txMock.vehicle.findFirst).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when vehicle is not found for the gallery', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.saveToVehicle(CALC_ID, 'missing-vehicle', GALLERY_ID),
      ).rejects.toThrow(NotFoundError);
    });

    it('should scope calculation lookup to galleryId for tenant isolation', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(null);

      await expect(
        service.saveToVehicle(CALC_ID, VEHICLE_ID, OTHER_GALLERY_ID),
      ).rejects.toThrow(NotFoundError);
      expect(txMock.importCalculation.findFirst).toHaveBeenCalledWith({
        where: { id: CALC_ID, galleryId: OTHER_GALLERY_ID },
      });
    });

    it('should scope vehicle lookup to galleryId for tenant isolation', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID),
      ).rejects.toThrow(NotFoundError);
      expect(txMock.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: VEHICLE_ID, galleryId: GALLERY_ID },
      });
    });

    it('should bind taxSnapshotId from calculation to vehicle update', async () => {
      txMock.importCalculation.findFirst.mockResolvedValue(mockCalculation as any);
      txMock.vehicle.findFirst.mockResolvedValue(mockVehicle as any);
      txMock.importCalculation.update.mockResolvedValue({} as any);
      txMock.vehicle.update.mockResolvedValue({} as any);

      await service.saveToVehicle(CALC_ID, VEHICLE_ID, GALLERY_ID);

      const call = txMock.vehicle.update.mock.calls[0][0] as any;
      expect(call.data.taxSnapshotId).toBe(SNAPSHOT_ID);
    });
  });
});
