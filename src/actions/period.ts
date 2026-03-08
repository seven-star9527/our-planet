// src/actions/period.ts
'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 添加或更新生理期开始日
export async function markPeriodStart(dateStr: string) {
  try {
    const date = new Date(dateStr);
    
    // 检查当天是否已经有记录，有则删除（实现开关效果）
    const existing = await prisma.periodRecord.findFirst({
      where: {
        startDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });

    if (existing) {
      await prisma.periodRecord.delete({ where: { id: existing.id } });
    } else {
      await prisma.periodRecord.create({
        data: { startDate: new Date(dateStr) }
      });
    }

    revalidatePath('/period');
    return { success: true };
  } catch (error) {
    return { success: false, error: '操作失败' };
  }
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