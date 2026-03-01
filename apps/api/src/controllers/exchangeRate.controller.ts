import { Request, Response, NextFunction } from 'express';
import { exchangeRateService } from '../services/exchangeRate.service';
import { sendSuccess } from '../utils/helpers';

export class ExchangeRateController {
  /**
   * GET /exchange-rates
   * Aktif tum doviz kurlarini listele
   */
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await exchangeRateService.getAll();
      sendSuccess(res, rates);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /exchange-rates/settings
   * Guncelleme ayarlarini getir
   */
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await exchangeRateService.getSettings();
      // apiKey'i maskeleyerek döndür — plain text API key sızmasını önle
      const { apiKey: _apiKey, ...safeSettings } = settings as Record<string, unknown>;
      const maskedKey = typeof _apiKey === 'string' && _apiKey.length > 4
        ? `${'*'.repeat(_apiKey.length - 4)}${_apiKey.slice(-4)}`
        : _apiKey ? '****' : null;
      sendSuccess(res, { ...safeSettings, apiKey: maskedKey });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /exchange-rates/settings
   * Guncelleme ayarlarini degistir
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await exchangeRateService.updateSettings(req.body);
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /exchange-rates/history/:code
   * Belirli bir para biriminin gecmis kurlarini getir
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = String(req.params['code']);
      const limit = req.query.limit ? Math.min(100, parseInt(req.query.limit as string) || 30) : 30;

      const history = await exchangeRateService.getHistory(code, limit);
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /exchange-rates/:code
   * Tek bir para biriminin aktif kurunu getir
   */
  async getByCurrency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = String(req.params['code']);
      const rate = await exchangeRateService.getByCurrency(code);
      sendSuccess(res, rate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /exchange-rates
   * Toplu kur guncelleme (manuel)
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rates } = req.body as { rates: Array<{ currencyCode: string; buyRate: number; sellRate: number }> };
      const results = await exchangeRateService.bulkUpdate(rates, 'manual');
      sendSuccess(res, results);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /exchange-rates/fetch
   * Harici API'den kurları cek ve kaydet (manuel tetikleme)
   */
  async fetchFromAPI(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await exchangeRateService.autoUpdate();
      sendSuccess(res, {
        updated: results.length,
        rates: results,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const exchangeRateController = new ExchangeRateController();
