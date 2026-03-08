// src/actions/settings.ts
'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 获取所有设置项
export async function getSettings() {
  const settings = await prisma.appSetting.findMany();
  const dict: Record<string, string> = {};
  settings.forEach(s => {
    dict[s.key] = s.value;
  });
  return dict;
}

// 批量更新设置项
export async function updateSettings(data: Record<string, string | null>) {
  try {
    for (const [key, value] of Object.entries(data)) {
      const existing = await prisma.appSetting.findFirst({ where: { key } });
      
      if (value === null) {
        if (existing) await prisma.appSetting.delete({ where: { id: existing.id } });
      } else {
        if (existing) {
          await prisma.appSetting.update({ where: { id: existing.id }, data: { value } });
        } else {
          await prisma.appSetting.create({ data: { key, value } });
        }
      }
    }
    
    // 强制刷新所有页面的缓存，确保新设置立刻生效
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('更新设置失败:', error);
    return { success: false, error: '服务器内部错误' };
  }
}