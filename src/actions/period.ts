// src/actions/period.ts
'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 添加或更新生理期开始日
export async function markPeriodStart(dateStr: string) {
  try {
    const date = new Date(dateStr);

    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.periodRecord.findFirst({
      where: {
        startDate: {
          gte: dayStart,
          lt: dayEnd,
        }
      }
    });

    if (existing) {
      await prisma.periodRecord.delete({ where: { id: existing.id } });
    } else {
      // 获取持续天数设置
      const durationSetting = await prisma.appSetting.findFirst({ where: { key: 'period_duration' } });
      const durationDays = parseInt(durationSetting?.value || '5', 10);

      const endDate = new Date(dateStr);
      endDate.setDate(endDate.getDate() + durationDays - 1);

      await prisma.periodRecord.create({
        data: {
          startDate: new Date(dateStr),
          endDate,
        }
      });
    }

    revalidatePath('/period');
    return { success: true };
  } catch (error) {
    return { success: false, error: '操作失败' };
  }
}

// 更新生理期设置：持续天数和周期长度
export async function updatePeriodSettings(duration: number, cycle: number) {
  try {
    const upsertSetting = async (key: string, value: string) => {
      const existing = await prisma.appSetting.findFirst({ where: { key } });
      if (existing) {
        await prisma.appSetting.update({ where: { id: existing.id }, data: { value } });
      } else {
        await prisma.appSetting.create({ data: { key, value } });
      }
    };

    await upsertSetting('period_duration', duration.toString());
    await upsertSetting('period_cycle', cycle.toString());

    revalidatePath('/period');
    return { success: true };
  } catch (error) {
    return { success: false, error: '保存失败' };
  }
}

// 获取生理期设置
export async function getPeriodSettings() {
  const durationSetting = await prisma.appSetting.findFirst({ where: { key: 'period_duration' } });
  const cycleSetting = await prisma.appSetting.findFirst({ where: { key: 'period_cycle' } });

  return {
    duration: parseInt(durationSetting?.value || '5', 10),
    cycle: parseInt(cycleSetting?.value || '28', 10),
  };
}

// 切换女方可见性
export async function togglePeriodVisibility(isVisible: boolean) {
  const key = 'period_visible_to_girl';
  const value = isVisible ? 'true' : 'false';

  const existing = await prisma.appSetting.findFirst({ where: { key } });
  if (existing) {
    await prisma.appSetting.update({ where: { id: existing.id }, data: { value } });
  } else {
    await prisma.appSetting.create({ data: { key, value } });
  }
  revalidatePath('/period');
  revalidatePath('/');
  return { success: true };
}
