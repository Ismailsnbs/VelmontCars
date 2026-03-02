import prisma from '../lib/prisma';
import { NotFoundError } from '../middleware/error.middleware';
import { emitToMaster } from '../socket';
import { SOCKET_EVENTS } from '../socket/events';

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  TRY: 'Turkish Lira',
  CHF: 'Swiss Franc',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  AED: 'UAE Dirham',
};

const DEFAULT_FETCH_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'TRY'];

interface BulkRateInput {
  currencyCode: string;
  buyRate: number;
  sellRate: number;
}

interface UpdateSettingsData {
  updateMode?: string;
  apiProvider?: string;
  apiKey?: string;
  updateInterval?: number;
}

export class ExchangeRateService {
  async getAll() {
    return prisma.exchangeRate.findMany({
      where: { isActive: true },
      orderBy: { currencyCode: 'asc' },
    });
  }

  async getHistory(currencyCode: string, limit = 30) {
    return prisma.exchangeRate.findMany({
      where: { currencyCode: currencyCode.toUpperCase() },
      orderBy: { fetchedAt: 'desc' },
      take: limit,
    });
  }

  async getByCurrency(currencyCode: string) {
    const rate = await prisma.exchangeRate.findFirst({
      where: { currencyCode: currencyCode.toUpperCase(), isActive: true },
    });

    if (!rate) {
      throw new NotFoundError(`Exchange rate for ${currencyCode.toUpperCase()} not found`);
    }

    return rate;
  }

  async updateRate(
    currencyCode: string,
    buyRate: number,
    sellRate: number,
    source = 'manual',
  ) {
    const code = currencyCode.toUpperCase();

    // Eski aktif rate'leri deaktive et — gecmis korunsun
    await prisma.exchangeRate.updateMany({
      where: { currencyCode: code, isActive: true },
      data: { isActive: false },
    });

    const created = await prisma.exchangeRate.create({
      data: {
        currencyCode: code,
        currencyName: this.getCurrencyName(code),
        buyRate,
        sellRate,
        source,
        isActive: true,
      },
    });

    try {
      emitToMaster(SOCKET_EVENTS.EXCHANGE_RATE_UPDATED, {
        currency: created.currencyCode,
        buyRate: Number(created.buyRate),
        sellRate: Number(created.sellRate),
        source: created.source,
      });
    } catch (emitError) {
      console.error('[ExchangeRateService] Socket emit error (updateRate):', emitError);
    }

    return created;
  }

  async bulkUpdate(rates: BulkRateInput[], source = 'manual') {
    // O-3: Parallelize rate updates with Promise.all instead of sequential loop
    const results = await Promise.all(
      rates.map((rate) =>
        this.updateRate(
          rate.currencyCode,
          rate.buyRate,
          rate.sellRate,
          source,
        ),
      ),
    );

    return results;
  }

  async getSettings() {
    const existing = await prisma.exchangeRateSettings.findFirst();

    if (existing) return existing;

    return prisma.exchangeRateSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', updateMode: 'manual', updateInterval: 60 },
    });
  }

  async updateSettings(data: UpdateSettingsData) {
    const existing = await this.getSettings();

    return prisma.exchangeRateSettings.update({
      where: { id: existing.id },
      data,
    });
  }

  async fetchFromAPI(): Promise<BulkRateInput[]> {
    const apiUrl =
      process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest';

    // O-4: Precedence for API key: environment variable > database setting
    // This ensures production API keys are never stored as plaintext in the database
    let apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      // Fall back to database setting only if environment variable is not set
      const settings = await this.getSettings();
      apiKey = settings?.apiKey || undefined;
    }

    try {
      const response = await fetch(`${apiUrl}/USD`);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = (await response.json()) as { rates?: Record<string, number>; conversion_rates?: Record<string, number> };

      // v4 uses "rates", v6 uses "conversion_rates"
      const ratesMap = data.rates || data.conversion_rates;

      if (!ratesMap) {
        throw new Error('Invalid API response: missing rates/conversion_rates field');
      }

      const usdToTry = ratesMap['TRY'];
      if (!usdToTry) {
        throw new Error('API response missing TRY rate — cannot calculate exchange rates');
      }
      const rates: BulkRateInput[] = [];

      // USD/TRY baz kuru
      rates.push({
        currencyCode: 'USD',
        buyRate: Number(usdToTry.toFixed(4)),
        sellRate: Number((usdToTry * 1.01).toFixed(4)),
      });

      // Diger para birimleri — TRY bazli
      const otherCurrencies = DEFAULT_FETCH_CURRENCIES.filter((c) => c !== 'USD');

      for (const code of otherCurrencies) {
        const usdRate = ratesMap[code];
        if (!usdRate) continue;

        // 1 birim = kac TRY: (TRY/USD) / (KOD/USD) = TRY/KOD
        const buyRate = Number((usdToTry / usdRate).toFixed(4));
        const sellRate = Number((buyRate * 1.01).toFixed(4)); // %1 spread

        rates.push({ currencyCode: code, buyRate, sellRate });
      }

      return rates;
    } catch (error) {
      console.error('[ExchangeRateService] API fetch error:', error);
      throw new Error(
        `Failed to fetch exchange rates from API: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async autoUpdate() {
    const rates = await this.fetchFromAPI();
    const results = await this.bulkUpdate(rates, 'api');

    // lastAutoUpdate guncelle
    await prisma.exchangeRateSettings.updateMany({
      data: { lastAutoUpdate: new Date() },
    });

    return results;
  }

  private getCurrencyName(code: string): string {
    return CURRENCY_NAMES[code] ?? code;
  }
}

export const exchangeRateService = new ExchangeRateService();
