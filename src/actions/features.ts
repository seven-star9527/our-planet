'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- 纪念日逻辑 ---
export async function createMilestone(formData: FormData) {
  const title = formData.get('title') as string;
  const date = new Date(formData.get('date') as string);
  const isCountdown = formData.get('type') === 'countdown';
  
  await prisma.milestone.create({
    data: { title, date, isCountdown, remind: true }
  });
  revalidatePath('/milestones');
}

export async function deleteMilestone(id: number) {
  await prisma.milestone.delete({ where: { id } });
  revalidatePath('/milestones');
}

// --- 恋爱清单逻辑 ---
export async function createBucketItem(formData: FormData) {
  const title = formData.get('title') as string;
  if (!title.trim()) return;
  await prisma.bucketList.create({ data: { title: title.trim() } });
  revalidatePath('/bucket-list');
}

export async function updateBucketStatus(id: number, status: string) {
  await prisma.bucketList.update({ where: { id }, data: { status } });
  revalidatePath('/bucket-list');
}

export async function deleteBucketItem(id: number) {
  await prisma.bucketList.delete({ where: { id } });
  revalidatePath('/bucket-list');
}

export async function editBucketItem(id: number, title: string) {
  if (!title.trim()) return { success: false, error: '内容不能为空' };
  await prisma.bucketList.update({ where: { id }, data: { title: title.trim() } });
  revalidatePath('/bucket-list');
  return { success: true };
}

export async function markBucketDone(id: number) {
  await prisma.bucketList.update({ where: { id }, data: { status: 'DONE' } });
  revalidatePath('/bucket-list');
}

// 更新纪念日
export async function updateMilestone(id: number, formData: FormData) {
  const title = formData.get('title') as string;
  const dateStr = formData.get('date') as string;
  const type = formData.get('type') as string;

  if (!title || !dateStr) return { success: false, error: '信息不完整' };

  try {
    await prisma.milestone.update({
      where: { id },
      data: {
        title: title.trim(),
        date: new Date(dateStr),
        isCountdown: type === 'countdown',
      }
    });
    revalidatePath('/milestones');
    return { success: true };
  } catch (error) {
    return { success: false, error: '更新失败' };
  }
}

// 核心闭环：完成清单 -> 跳转去写手账
// 这里我们不直接写库，而是生成一个带参数的跳转链接给前端用