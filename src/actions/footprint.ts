// src/actions/footprint.ts
'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addFootprint(formData: FormData) {
  const city = formData.get('city') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  const notes = formData.get('notes') as string;

  if (!city) return { success: false, error: '城市名称不能为空' };

  try {
    await prisma.footprint.create({
      data: {
        city: city.trim(),
        location: location ? location.trim() : null,
        date: dateStr ? new Date(dateStr) : null,
        notes: notes ? notes.trim() : null,
      }
    });

    // 刷新足迹页面，让新数据立刻显示
    revalidatePath('/footprint');
    return { success: true };
  } catch (error) {
    console.error('添加足迹失败:', error);
    return { success: false, error: '添加失败，请重试' };
  }
}

export async function deleteFootprint(id: number) {
  try {
    await prisma.footprint.delete({ where: { id } });
    revalidatePath('/footprint');
    return { success: true };
  } catch (error) {
    return { success: false, error: '删除失败' };
  }
}

export async function updateFootprint(id: number, formData: FormData) {
  const city = formData.get('city') as string;
  const location = formData.get('location') as string;
  const dateStr = formData.get('date') as string;
  const notes = formData.get('notes') as string;

  if (!city) return { success: false, error: '城市名称不能为空' };

  try {
    await prisma.footprint.update({
      where: { id },
      data: {
        city: city.trim(),
        location: location ? location.trim() : null,
        date: dateStr ? new Date(dateStr) : null,
        notes: notes ? notes.trim() : null,
      }
    });

    revalidatePath('/footprint');
    return { success: true };
  } catch (error) {
    console.error('更新足迹失败:', error);
    return { success: false, error: '更新失败，请重试' };
  }
}