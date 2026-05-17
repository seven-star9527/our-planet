'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function setMood(dateStr: string, mood: string, diary?: string) {
  const cookieStore = await cookies();
  const author = cookieStore.get('user_role')?.value;
  if (!author || (author !== 'boy' && author !== 'girl')) {
    return { success: false, error: '未登录' };
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  try {
    await prisma.moodRecord.upsert({
      where: { author_date: { author, date } },
      update: { mood, diary: diary ?? null },
      create: { author, date, mood, diary: diary ?? null },
    });
    revalidatePath('/mood');
    return { success: true };
  } catch (error) {
    return { success: false, error: '保存失败' };
  }
}

export async function deleteMood(dateStr: string) {
  const cookieStore = await cookies();
  const author = cookieStore.get('user_role')?.value;
  if (!author) return { success: false, error: '未登录' };

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  try {
    await prisma.moodRecord.deleteMany({
      where: { author, date },
    });
    revalidatePath('/mood');
    return { success: true };
  } catch (error) {
    return { success: false, error: '删除失败' };
  }
}

export async function getMoodRecords(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1, 23, 59, 59, 999);

  const records = await prisma.moodRecord.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  return records.map(r => ({
    id: r.id,
    author: r.author,
    date: r.date.toISOString(),
    mood: r.mood,
    diary: r.diary,
  }));
}

export async function getMoodStats(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1, 23, 59, 59, 999);

  const records = await prisma.moodRecord.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });

  const moodTypes = ['happy', 'love', 'calm', 'angry', 'sad', 'hurt', 'excited', 'tired'];
  const boy: Record<string, number> = {};
  const girl: Record<string, number> = {};
  for (const m of moodTypes) { boy[m] = 0; girl[m] = 0; }

  let totalDays = 0;
  for (const r of records) {
    if (r.author === 'boy') boy[r.mood] = (boy[r.mood] || 0) + 1;
    else girl[r.mood] = (girl[r.mood] || 0) + 1;
    totalDays++;
  }

  return { boy, girl, totalDays };
}
