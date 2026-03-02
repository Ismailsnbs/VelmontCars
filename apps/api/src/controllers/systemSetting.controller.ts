import { Request, Response, NextFunction } from 'express';
import { systemSettingService } from '../services/systemSetting.service';
import { auditService } from '../services/audit.service';
import { sendSuccess } from '../utils/helpers';
import type { UpdateSettingInput } from '../validations/systemSetting.validation';

/** Default values for known system settings */
const SETTING_DEFAULTS: Record<string, string> = {
  stockAgeWarningDays: '30',
};

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export class SystemSettingController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await systemSettingService.getAll();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  async getByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const key = getParam(req.params.key);
      const value = await systemSettingService.get(key);

      if (value !== null) {
        sendSuccess(res, { key, value });
        return;
      }

      // Return default if available, otherwise 200 with null
      const defaultValue = SETTING_DEFAULTS[key] ?? null;
      sendSuccess(res, { key, value: defaultValue });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const key = getParam(req.params.key);
      const { value } = req.body as UpdateSettingInput;
      const ip = req.ip ? getParam(req.ip as string | string[]) : undefined;

      const setting = await systemSettingService.set(key, value);

      // Log to audit
      await auditService.log({
        action: 'UPDATE',
        entityType: 'SystemSetting',
        entityId: key,
        newValues: { key, value },
        performedBy: req.user!.userId,
        ipAddress: ip,
      });

      sendSuccess(res, setting);
    } catch (error) {
      next(error);
    }
  }
}

export const systemSettingController = new SystemSettingController();
