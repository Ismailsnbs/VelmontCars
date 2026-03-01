import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExchangeRateService } from '../exchangeRate.service';
import { NotFoundError } from '../../middleware/error.middleware';

// ------------------------------------------------------------------ //
// Mocks
// ------------------------------------------------------------------ //

vi.mock('../../lib/prisma', () => ({
  default: {
    exchangeRate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    exchangeRateSettings: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from '../../lib/prisma';

// ------------------------------------------------------------------ //
// Fixtures
// ------------------------------------------------------------------ //

const mockRate = {
  id: 'rate-1',
  currencyCode: 'USD',
  currencyName: 'US Dollar',
  buyRate: 35.5,
  sellRate: 35.85,
  source: 'manual',
  isActive: true,
  fetchedAt: new Date('2024-01-01'),
};

const mockSettings = {
  id: 'singleton',
  updateMode: 'manual',
  apiProvider: null,
  apiKey: null,
  updateInterval: 60,
  lastAutoUpdate: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExchangeRateService();
  });

  // ---------------------------------------------------------------- //
  // getAll
  // ---------------------------------------------------------------- //
  describe('getAll', () => {
    it('should return all active exchange rates', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([mockRate] as any);

      const result = await service.getAll();

      expect(result).toEqual([mockRate]);
    });

    it('should query only active rates', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getAll();

      expect(prisma.exchangeRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('should order results by currencyCode ascending', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getAll();

      expect(prisma.exchangeRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { currencyCode: 'asc' } }),
      );
    });

    it('should return empty array when no active rates exist', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      const result = await service.getAll();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- //
  // getByCurrency
  // ---------------------------------------------------------------- //
  describe('getByCurrency', () => {
    it('should return the rate for a known currency', async () => {
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue(mockRate as any);

      const result = await service.getByCurrency('USD');

      expect(result).toEqual(mockRate);
    });

    it('should convert currencyCode to uppercase before querying', async () => {
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue(mockRate as any);

      await service.getByCurrency('usd');

      expect(prisma.exchangeRate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ currencyCode: 'USD' }) }),
      );
    });

    it('should query only active rates for the currency', async () => {
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue(mockRate as any);

      await service.getByCurrency('EUR');

      expect(prisma.exchangeRate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should throw NotFoundError when currency is not found', async () => {
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue(null);

      await expect(service.getByCurrency('XYZ')).rejects.toThrow(NotFoundError);
    });

    it('should include the currency code in the NotFoundError message', async () => {
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue(null);

      await expect(service.getByCurrency('XYZ')).rejects.toThrow('XYZ');
    });

    it('should handle mixed case currency code and uppercase in error message', async () => {
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue(null);

      await expect(service.getByCurrency('xyz')).rejects.toThrow('XYZ');
    });
  });

  // ---------------------------------------------------------------- //
  // bulkUpdate
  // ---------------------------------------------------------------- //
  describe('bulkUpdate', () => {
    it('should return results for all rates in the input', async () => {
      const newRate = { ...mockRate, currencyCode: 'EUR' };
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.exchangeRate.create)
        .mockResolvedValueOnce(mockRate as any)
        .mockResolvedValueOnce(newRate as any);

      const rates = [
        { currencyCode: 'USD', buyRate: 35.5, sellRate: 35.85 },
        { currencyCode: 'EUR', buyRate: 38.0, sellRate: 38.38 },
      ];

      const results = await service.bulkUpdate(rates);

      expect(results).toHaveLength(2);
    });

    it('should process each rate sequentially by calling updateRate', async () => {
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.exchangeRate.create).mockResolvedValue(mockRate as any);

      await service.bulkUpdate([{ currencyCode: 'USD', buyRate: 35.5, sellRate: 35.85 }]);

      expect(prisma.exchangeRate.updateMany).toHaveBeenCalledOnce();
      expect(prisma.exchangeRate.create).toHaveBeenCalledOnce();
    });

    it('should deactivate existing rates before creating new ones', async () => {
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.exchangeRate.create).mockResolvedValue(mockRate as any);

      await service.bulkUpdate([{ currencyCode: 'USD', buyRate: 35.5, sellRate: 35.85 }]);

      expect(prisma.exchangeRate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { currencyCode: 'USD', isActive: true },
          data: { isActive: false },
        }),
      );
    });

    it('should return empty array when input is empty', async () => {
      const result = await service.bulkUpdate([]);

      expect(result).toEqual([]);
      expect(prisma.exchangeRate.updateMany).not.toHaveBeenCalled();
    });

    it('should pass the source to each created rate', async () => {
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.exchangeRate.create).mockResolvedValue(mockRate as any);

      await service.bulkUpdate([{ currencyCode: 'USD', buyRate: 35.5, sellRate: 35.85 }], 'api');

      expect(prisma.exchangeRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ source: 'api' }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------- //
  // getSettings
  // ---------------------------------------------------------------- //
  describe('getSettings', () => {
    it('should return existing settings when they exist', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(mockSettings as any);

      const result = await service.getSettings();

      expect(result).toEqual(mockSettings);
    });

    it('should not call upsert when settings already exist', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(mockSettings as any);

      await service.getSettings();

      expect(prisma.exchangeRateSettings.upsert).not.toHaveBeenCalled();
    });

    it('should create singleton settings when none exist', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.exchangeRateSettings.upsert).mockResolvedValue(mockSettings as any);

      await service.getSettings();

      expect(prisma.exchangeRateSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'singleton' },
          create: expect.objectContaining({ id: 'singleton', updateMode: 'manual', updateInterval: 60 }),
        }),
      );
    });

    it('should return the upserted settings when none existed', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.exchangeRateSettings.upsert).mockResolvedValue(mockSettings as any);

      const result = await service.getSettings();

      expect(result).toEqual(mockSettings);
    });
  });

  // ---------------------------------------------------------------- //
  // updateSettings
  // ---------------------------------------------------------------- //
  describe('updateSettings', () => {
    it('should update and return modified settings', async () => {
      const updated = { ...mockSettings, updateMode: 'auto', updateInterval: 30 };
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(mockSettings as any);
      vi.mocked(prisma.exchangeRateSettings.update).mockResolvedValue(updated as any);

      const result = await service.updateSettings({ updateMode: 'auto', updateInterval: 30 });

      expect(result).toEqual(updated);
    });

    it('should call settings update with the correct id', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(mockSettings as any);
      vi.mocked(prisma.exchangeRateSettings.update).mockResolvedValue(mockSettings as any);

      await service.updateSettings({ updateMode: 'auto' });

      expect(prisma.exchangeRateSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'singleton' } }),
      );
    });

    it('should pass the update data to prisma', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(mockSettings as any);
      vi.mocked(prisma.exchangeRateSettings.update).mockResolvedValue(mockSettings as any);

      await service.updateSettings({ updateInterval: 120 });

      expect(prisma.exchangeRateSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { updateInterval: 120 } }),
      );
    });

    it('should create singleton settings if none exist before updating', async () => {
      vi.mocked(prisma.exchangeRateSettings.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.exchangeRateSettings.upsert).mockResolvedValue(mockSettings as any);
      vi.mocked(prisma.exchangeRateSettings.update).mockResolvedValue(mockSettings as any);

      await service.updateSettings({ updateMode: 'auto' });

      expect(prisma.exchangeRateSettings.upsert).toHaveBeenCalledOnce();
      expect(prisma.exchangeRateSettings.update).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------- //
  // getHistory
  // ---------------------------------------------------------------- //
  describe('getHistory', () => {
    it('should return history for a currency', async () => {
      const historyRecords = [mockRate, { ...mockRate, id: 'rate-2', isActive: false }];
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue(historyRecords as any);

      const result = await service.getHistory('USD');

      expect(result).toEqual(historyRecords);
    });

    it('should convert currency code to uppercase when querying history', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getHistory('usd');

      expect(prisma.exchangeRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { currencyCode: 'USD' } }),
      );
    });

    it('should order results by fetchedAt descending', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getHistory('USD');

      expect(prisma.exchangeRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { fetchedAt: 'desc' } }),
      );
    });

    it('should limit results to 30 records by default', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getHistory('USD');

      expect(prisma.exchangeRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30 }),
      );
    });

    it('should use the custom limit when provided', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      await service.getHistory('USD', 10);

      expect(prisma.exchangeRate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('should return empty array when no history exists', async () => {
      vi.mocked(prisma.exchangeRate.findMany).mockResolvedValue([]);

      const result = await service.getHistory('USD');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- //
  // updateRate (internal — tested through bulkUpdate paths)
  // ---------------------------------------------------------------- //
  describe('updateRate (via direct call)', () => {
    it('should deactivate old rates and create a new active rate', async () => {
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.exchangeRate.create).mockResolvedValue(mockRate as any);

      const result = await (service as any).updateRate('USD', 35.5, 35.85, 'manual');

      expect(prisma.exchangeRate.updateMany).toHaveBeenCalledWith({
        where: { currencyCode: 'USD', isActive: true },
        data: { isActive: false },
      });
      expect(prisma.exchangeRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currencyCode: 'USD',
            buyRate: 35.5,
            sellRate: 35.85,
            isActive: true,
          }),
        }),
      );
      expect(result).toEqual(mockRate);
    });

    it('should set the correct currency name for known currencies', async () => {
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.exchangeRate.create).mockResolvedValue(mockRate as any);

      await (service as any).updateRate('EUR', 38.0, 38.38);

      expect(prisma.exchangeRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currencyName: 'Euro' }),
        }),
      );
    });

    it('should use currencyCode as currencyName for unknown currencies', async () => {
      const unknownRate = { ...mockRate, currencyCode: 'XYZ', currencyName: 'XYZ' };
      vi.mocked(prisma.exchangeRate.updateMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.exchangeRate.create).mockResolvedValue(unknownRate as any);

      await (service as any).updateRate('XYZ', 10.0, 10.1);

      expect(prisma.exchangeRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ currencyName: 'XYZ' }),
        }),
      );
    });
  });
});
