import prisma from '../lib/prisma';

export class SystemSettingService {
  /**
   * Get a system setting by key
   * Returns null if not found
   */
  async get(key: string): Promise<string | null> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    return setting?.value ?? null;
  }

  /**
   * Set (upsert) a system setting
   */
  async set(key: string, value: string): Promise<{ key: string; value: string }> {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  /**
   * Get all system settings ordered by key
   */
  async getAll(): Promise<{ key: string; value: string; updatedAt: Date }[]> {
    return prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }
}

export const systemSettingService = new SystemSettingService();
